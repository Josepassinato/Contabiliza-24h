import React, { useState, useEffect, useRef, useCallback } from 'react';
// Corrected import to follow Gemini API guidelines
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { User } from '../contexts/AuthContext';
import { Client } from '../api/contadorApi';
import ChartComponent from './ChartComponent';

interface VoiceAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    isDemo: boolean;
    clientContext: Client | null;
}

type AssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
type ChatMessage = {
    user: string;
    assistant: string;
    chartData?: { title: string; data: { label: string; value: number }[] } | null;
};


// --- Audio Helper Functions (from Gemini docs) ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Optimized helper for performance
function createPcmBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Function Calling Definitions ---
const displayFinancialChart: FunctionDeclaration = {
  name: 'displayFinancialChart',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
      },
      labels: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
      },
      values: {
         type: Type.ARRAY,
         items: {
            type: Type.NUMBER,
         },
      },
    },
    required: ['title', 'labels', 'values'],
  },
};

const sendEmail: FunctionDeclaration = {
  name: 'sendEmail',
  parameters: {
    type: Type.OBJECT,
    properties: {
      recipientEmail: { type: Type.STRING },
      subject: { type: Type.STRING },
      body: { type: Type.STRING },
    },
    required: ['recipientEmail', 'subject', 'body'],
  }
};


const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose, user, isDemo, clientContext }) => {
    const [status, setStatus] = useState<AssistantStatus>('idle');
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    // Refs for live data to avoid re-rendering on every message chunk
    const userTranscriptRef = useRef('');
    const assistantTranscriptRef = useRef('');
    const chartDataRef = useRef<{ title: string; data: { label: string; value: number }[] } | null>(null);

    // State to force UI updates for live transcript at a controlled interval
    const [, forceUpdate] = useState(0);
    const renderIntervalRef = useRef<number | null>(null);

    // Audio processing refs
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextAudioStartTimeRef = useRef(0);

    const getSystemPrompt = useCallback(() => {
        if (isDemo) {
            // FIX: Added extensive new data points for employees and operations.
            return `Você é um assistente de IA para contabilidade chamado Contaflux, em modo de demonstração para a empresa 'Padaria Pão Quente LTDA'.

**Dados Disponíveis (use apenas estes dados):**

- **Faturamento Bruto (Últimos 6 Meses):**
  - Maio/2024: 85000
  - Abril/2024: 82000
  - Março/2024: 88000
  - Fevereiro/2024: 79000
  - Janeiro/2024: 75000
  - Dezembro/2023: 95000

- **Despesas (Maio/2024):**
  - Fornecedores: 34000
  - Folha de Pagamento: 12000
  - Aluguel: 5500
  - Impostos (Folha + Simples): 8460 (3360 + 5100)
  - Utilitários (Energia/Água): 2800
  - Outros (Software/Internet): 550

- **Folha de Pagamento (Maio/2024):**
  - Total de Funcionários: 4
  - Funcionário 1: Nome: Carlos Silva, Função: Padeiro Chefe, Salário Bruto: 3500, INSS: 280, Outros Descontos: 150
  - Funcionário 2: Nome: Mariana Costa, Função: Confeiteira, Salário Bruto: 2800, INSS: 210, Outros Descontos: 100
  - Funcionário 3: Nome: João Almeida, Função: Atendente, Salário Bruto: 2200, INSS: 165, Outros Descontos: 80
  - Funcionário 4: Nome: Ana Pereira, Função: Serviços Gerais, Salário Bruto: 1800, INSS: 135, Outros Descontos: 50

- **Dados Operacionais (Últimos 6 Meses):**
  - Maio/2024: Vendas Realizadas: 1250, Notas Fiscais Emitidas: 1245
  - Abril/2024: Vendas Realizadas: 1210, Notas Fiscais Emitidas: 1208
  - Março/2024: Vendas Realizadas: 1300, Notas Fiscais Emitidas: 1295
  - Fevereiro/2024: Vendas Realizadas: 1150, Notas Fiscais Emitidas: 1148
  - Janeiro/2024: Vendas Realizadas: 1100, Notas Fiscais Emitidas: 1100
  - Dezembro/2023: Vendas Realizadas: 1500, Notas Fiscais Emitidas: 1492

**Instruções:**
1.  Seja conciso, amigável e proativo.
2.  Ao citar valores, formate-os como moeda (ex: "R$ 85.000").
3.  **Para exibir gráficos, OBRIGATORIAMENTE use a função 'displayFinancialChart'.**
4.  **Regra CRÍTICA para Gráficos:** Os parâmetros 'labels' (textos) e 'values' (números) DEVEM ser arrays com o mesmo número de itens.
    - **Exemplo CORRETO de argumentos para a função 'displayFinancialChart':**
      \`\`\`json
      {
        "title": "Faturamento Bruto (Últimos 4 Meses)",
        "labels": ["Maio/2024", "Abril/2024", "Março/2024", "Fevereiro/2024"],
        "values": [85000, 82000, 88000, 79000]
      }
      \`\`\`
5.  **Se o usuário pedir para enviar um e-mail, use a função 'sendEmail'.**`;
        }
        if (clientContext?.financialData) {
            const data = clientContext.financialData;
            const outrasDespesas = data.expenses - data.topExpenseValue;
            
            return `Você é um assistente de IA para a empresa ${clientContext.name}.

**Dados Disponíveis (Mês: ${data.month}):**
- Faturamento Bruto: ${data.revenue}
- Despesas Totais: ${data.expenses}
- Principal Despensa (${data.topExpenseCategory}): ${data.topExpenseValue}
- Outras Despesas: ${outrasDespesas > 0 ? outrasDespesas : 0}

**Instruções:**
1. Ao citar valores, formate como moeda (ex: "R$ ${data.revenue.toLocaleString('pt-BR')}").
2. Para exibir gráficos, OBRIGATORIAMENTE use a função 'displayFinancialChart'.
3. **Regra CRÍTICA para Gráficos:** Os parâmetros 'labels' (textos) e 'values' (números) DEVEM ser arrays com o mesmo número de itens.
   - **Exemplo CORRETO de argumentos para a função 'displayFinancialChart':**
     \`\`\`json
     {
       "title": "Detalhamento de Despesas (${data.month})",
       "labels": ["${data.topExpenseCategory}", "Outras Despesas"],
       "values": [${data.topExpenseValue}, ${outrasDespesas > 0 ? outrasDespesas : 0}]
     }
     \`\`\`
4. **Se o usuário pedir para enviar um e-mail, use a função 'sendEmail'.**

Seja direto e preciso.`;
        }
        return 'Você é um assistente de IA para contabilidade. Responda às perguntas sobre finanças, impostos e gestão de forma geral, já que nenhum dado de cliente específico foi carregado.';
    }, [isDemo, clientContext]);
    
    const stopSession = useCallback(() => {
        if (renderIntervalRef.current) {
            clearInterval(renderIntervalRef.current);
            renderIntervalRef.current = null;
        }

        sessionPromiseRef.current?.then(session => {
            session.close();
            sessionPromiseRef.current = null;
        });

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        audioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current?.close().catch(console.error);

        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextAudioStartTimeRef.current = 0;
        
        setStatus('idle');
    }, []);

    const startSession = useCallback(async () => {
        setErrorMessage(null);
        if (!process.env.API_KEY) {
            console.error("API_KEY is not set.");
            setErrorMessage("A chave de API para a IA da Gemini não foi configurada no ambiente.");
            setStatus('error');
            return;
        }

        setStatus('listening');
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        renderIntervalRef.current = window.setInterval(() => forceUpdate(c => c + 1), 250);

        try {
            audioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: getSystemPrompt(),
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: [{ functionDeclarations: [displayFinancialChart, sendEmail] }],
                },
                callbacks: {
                    onopen: () => {
                        if (!audioContextRef.current || !mediaStreamRef.current) return;
                        
                        mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            userTranscriptRef.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            assistantTranscriptRef.current += message.serverContent.outputTranscription.text;
                        }
                        
                        if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
                            setStatus('speaking');
                        }

                        if (message.toolCall?.functionCalls) {
                            for (const fc of message.toolCall.functionCalls) {
                                try {
                                    const args: any = fc.args;
                                    if (fc.name === 'displayFinancialChart') {
                                        const isValidData = args && typeof args.title === 'string' && Array.isArray(args.labels) && Array.isArray(args.values) && args.labels.length === args.values.length && args.labels.length > 0;
                                        if (isValidData) {
                                            const reconstructedData = args.labels.map((label: string, index: number) => ({ label: label, value: args.values[index] }));
                                            chartDataRef.current = { title: args.title, data: reconstructedData };
                                            sessionPromiseRef.current?.then((session) => {
                                                session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: "ok, o gráfico foi exibido." } } });
                                            });
                                        } else {
                                            throw new Error("Dados do gráfico malformados. 'labels' e 'values' devem ser arrays de mesmo comprimento.");
                                        }
                                    } else if (fc.name === 'sendEmail') {
                                        if (args.recipientEmail && args.subject && args.body) {
                                            console.log('Simulating email send:', args);
                                            const result = `E-mail de teste enviado para ${args.recipientEmail}.`;
                                            sessionPromiseRef.current?.then((session) => {
                                                session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: result } } });
                                            });
                                        } else {
                                            throw new Error("Parâmetros de e-mail ausentes ou inválidos.");
                                        }
                                    }
                                } catch (error) {
                                    console.error("Erro ao processar a chamada de função:", error);
                                    sessionPromiseRef.current?.then((session) => {
                                        session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { error: `Erro interno: ${(error as Error).message}` } } });
                                    });
                                }
                            }
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const outputCtx = outputAudioContextRef.current;
                            nextAudioStartTimeRef.current = Math.max(nextAudioStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            
                            source.addEventListener('ended', () => {
                                audioSourcesRef.current.delete(source);
                                if (audioSourcesRef.current.size === 0) {
                                    setStatus('listening');
                                }
                            });
                            
                            source.start(nextAudioStartTimeRef.current);
                            nextAudioStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }

                        if (message.serverContent?.turnComplete) {
                            const finalUserTranscript = userTranscriptRef.current;
                            const finalAssistantTranscript = assistantTranscriptRef.current;
                            const finalChartData = chartDataRef.current;

                            if (finalUserTranscript.trim() || finalAssistantTranscript.trim()) {
                                setHistory(prev => [...prev, { user: finalUserTranscript, assistant: finalAssistantTranscript, chartData: finalChartData }]);
                            }

                            userTranscriptRef.current = '';
                            assistantTranscriptRef.current = '';
                            chartDataRef.current = null;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        const detailedError = `Ocorreu um erro de conexão (${e.message || 'Network error'}). Verifique sua conexão com a internet e certifique-se de que sua chave de API da Gemini (API_KEY no arquivo .env) está correta e habilitada para uso.`;
                        setErrorMessage(detailedError);
                        setStatus('error');
                        stopSession();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Session closed');
                        stopSession();
                    },
                }
            });
        } catch (error) {
            console.error('Failed to start session:', error);
            const detailedError = `Falha ao iniciar a sessão de áudio. Verifique as permissões do microfone. (${(error as Error).message})`;
            setErrorMessage(detailedError);
            setStatus('error');
            stopSession();
        }
    }, [getSystemPrompt, stopSession]);
    

    useEffect(() => {
        if (isOpen) {
            startSession();
        } else {
            stopSession();
        }
        return () => {
            stopSession();
        };
    }, [isOpen, startSession, stopSession]);
    
    const handleClose = () => {
        stopSession();
        onClose();
        setHistory([]);
    };

    const handleClear = () => {
        setHistory([]);
        userTranscriptRef.current = '';
        assistantTranscriptRef.current = '';
        chartDataRef.current = null;
        setErrorMessage(null);
        forceUpdate(c => c + 1);
    };
    
    const getStatusIndicator = () => {
        switch (status) {
            case 'listening': return { text: 'Ouvindo...', color: 'border-cyan-500' };
            case 'processing': return { text: 'Processando...', color: 'border-yellow-500' };
            case 'speaking': return { text: 'Falando...', color: 'border-green-500' };
            case 'error': return { text: 'Erro', color: 'border-red-500' };
            default: return { text: 'Inativo', color: 'border-slate-600' };
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900/80 border border-slate-700 rounded-2xl w-full max-w-2xl h-[90vh] max-h-[700px] flex flex-col shadow-2xl shadow-cyan-500/10">
                {/* Header */}
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full border-2 ${getStatusIndicator().color} transition-colors`}></div>
                        <span className="text-sm font-medium text-slate-300">{getStatusIndicator().text}</span>
                    </div>
                    <h2 className="text-lg font-bold text-white">Assistente de IA</h2>
                    <button onClick={handleClose} className="text-slate-500 hover:text-white">&times;</button>
                </header>
                
                {/* Chat Area */}
                <div className="flex-grow p-4 overflow-y-auto space-y-6 scroll-smooth">
                    {status === 'error' && (
                        <div className="bg-red-900/50 border border-red-500/50 text-red-300 text-sm rounded-lg p-3 mb-4">
                            <p className="font-bold mb-1 text-center text-red-200">Erro na Conexão</p>
                            <p className="text-center text-xs">{errorMessage}</p>
                        </div>
                    )}

                    {history.map((turn, index) => (
                        <div key={index}>
                            <p className="text-cyan-400 font-semibold mb-1">Você:</p>
                            <p className="ml-4 text-slate-300">{turn.user}</p>
                            <p className="text-green-400 font-semibold mt-3 mb-1">Assistente:</p>
                            <p className="ml-4 text-slate-300">{turn.assistant}</p>
                            {turn.chartData && <div className="mt-4 ml-4"><ChartComponent title={turn.chartData.title} data={turn.chartData.data} /></div>}
                        </div>
                    ))}
                    {(userTranscriptRef.current || assistantTranscriptRef.current) && (
                         <div>
                            <p className="text-cyan-400 font-semibold mb-1">Você:</p>
                            <p className="ml-4 text-slate-300">{userTranscriptRef.current}</p>
                            <p className="text-green-400 font-semibold mt-3 mb-1">Assistente:</p>
                            <p className="ml-4 text-slate-300">{assistantTranscriptRef.current}</p>
                             {chartDataRef.current && <div className="mt-4 ml-4"><ChartComponent title={chartDataRef.current.title} data={chartDataRef.current.data} /></div>}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="flex-shrink-0 p-4 border-t border-slate-700 flex items-center justify-between h-24">
                     <button onClick={handleClose} className="flex flex-col items-center text-slate-400 hover:text-red-500 transition-colors text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Encerrar
                    </button>

                    <div className="flex flex-col items-center">
                         <button
                            className={`relative bg-cyan-500 text-white w-16 h-16 rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:bg-cyan-600 transition-all duration-300 ease-in-out transform hover:scale-110`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            {(status === 'listening' || status === 'speaking') && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            )}
                        </button>
                    </div>
                    
                    <button onClick={handleClear} className="flex flex-col items-center text-slate-400 hover:text-cyan-400 transition-colors text-xs">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Limpar
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default VoiceAssistantModal;