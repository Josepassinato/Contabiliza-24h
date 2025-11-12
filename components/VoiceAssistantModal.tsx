import React, { useState, useEffect, useRef, useCallback } from 'react';
// Corrected import to follow Gemini API guidelines
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
// FIX: Added file extension to import for module resolution.
import { User } from '../contexts/AuthContext.tsx';
import { Client } from '../api/contadorApi.ts';
import ChartComponent from './ChartComponent.tsx';

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
    const chatContainerRef = useRef<HTMLElement>(null);

    // FIX: A ref to hold the current status, accessible inside the audio processing callback
    // without being affected by stale closures.
    const statusRef = useRef(status);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);


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
            // FIX: Enhanced the demo prompt for better fluidity and a more conversational interaction.
            return `Você é o Contaflux, um assistente de IA contador, amigável, proativo e especialista. Você está em modo de demonstração para a empresa 'Padaria Pão Quente LTDA'.

**Sua Personalidade:**
- **Tom de Voz:** Fale de forma natural, clara e profissional, mas acessível. Evite jargões contábeis complexos.
- **Proatividade:** Vá além de apenas responder. Ofereça insights. Por exemplo, se o faturamento caiu, mencione isso e sugira uma análise mais profunda.
- **Interatividade:** Se um pedido do usuário for vago (ex: "como estão as finanças?"), faça perguntas para esclarecer o que ele deseja saber (ex: "Você gostaria de ver o faturamento, as despesas ou o lucro do último mês?").

**Dados Disponíveis (use apenas estes dados):**
- **Faturamento Bruto (Últimos 12 Meses):**
  - Maio/2024: 85000, Abril/2024: 82000, Março/2024: 88000, Fevereiro/2024: 79000, Janeiro/2024: 75000, Dezembro/2023: 95000, Novembro/2023: 91000, Outubro/2023: 89000, Setembro/2023: 87000, Agosto/2023: 84000, Julho/2023: 82000, Junho/2023: 80000
- **Despesas Totais (Últimos 12 Meses):**
  - Maio/2024: 62010, Abril/2024: 59800, Março/2024: 64000, Fevereiro/2024: 58000, Janeiro/2024: 55000, Dezembro/2023: 68000, Novembro/2023: 65000, Outubro/2023: 63000, Setembro/2023: 61000, Agosto/2023: 60000, Julho/2023: 59000, Junho/2023: 58000
- **Despesas Detalhadas (Maio/2024):**
  - Fornecedores: 34000, Folha de Pagamento: 10700, Aluguel: 5500, Impostos (Folha + Simples): 8460, Utilitários (Energia/Água): 2800, Outros: 550
- **Quadro de Funcionários (Salário Bruto):**
  - João Silva (Padeiro Chefe): 3500
  - Maria Souza (Confeiteira): 2800
  - Carlos Pereira (Atendente): 2200
  - Ana Costa (Atendente): 2200
- **Previsão de Impostos (Próximos 3 Meses):**
  - Junho/24: Simples Nacional: ~5100, INSS: ~1180, FGTS: ~856
  - Julho/24: Simples Nacional: ~4900, INSS: ~1180, FGTS: ~856
  - Agosto/24: Simples Nacional: ~5000, INSS: ~1180, FGTS: ~856
- **Dados Operacionais (Maio/2024):** Vendas Realizadas: 1250, Notas Fiscais Emitidas: 1245.

**Instruções de Ferramentas (CRÍTICO):**
1.  **Formate Valores:** Sempre formate valores como moeda (ex: "R$ 85.000,00").
2.  **Exibir Gráficos:** Para QUALQUER pedido de gráfico, OBRIGATORIAMENTE use a função 'displayFinancialChart'.
3.  **Regra de Ouro para Gráficos:** Os parâmetros 'labels' (textos) e 'values' (números) DEVEM ser arrays com o MESMO NÚMERO de itens.
    - **Exemplo CORRETO de chamada da função 'displayFinancialChart':**
      \`\`\`json
      {
        "title": "Faturamento Bruto (Últimos 4 Meses)",
        "labels": ["Maio/24", "Abril/24", "Março/24", "Fev/24"],
        "values": [85000, 82000, 88000, 79000]
      }
      \`\`\`
4.  **Enviar E-mail:** Se o usuário pedir para enviar um e-mail, use a função 'sendEmail'.`;
        }
        // FIX: Changed clientContext.financialData to clientContext.financial_data to match the data model.
        if (clientContext?.financial_data) {
            // FIX: Changed clientContext.financialData to clientContext.financial_data to match the data model.
            const data = clientContext.financial_data;
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
                            if (statusRef.current !== 'listening') {
                                return;
                            }
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
                         if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'displayFinancialChart') {
                                    const { title, labels, values } = fc.args;
                                    if (Array.isArray(labels) && Array.isArray(values) && labels.length === values.length) {
                                        const chartData = labels.map((label, i) => ({ label, value: values[i] }));
                                        chartDataRef.current = { title, data: chartData };
                                    } else {
                                        console.warn("Mismatched labels and values for chart, skipping display.");
                                    }
                                } else if (fc.name === 'sendEmail') {
                                    console.log("Function Call: sendEmail", fc.args);
                                }

                                sessionPromiseRef.current?.then((session) => {
                                    session.sendToolResponse({
                                        functionResponses: {
                                            id: fc.id,
                                            name: fc.name,
                                            response: { result: "ok" },
                                        }
                                    });
                                });
                            }
                        }

                        if (message.serverContent?.inputTranscription) {
                            userTranscriptRef.current = message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            assistantTranscriptRef.current = message.serverContent.outputTranscription.text;
                            setStatus('speaking');
                        }

                        if (message.serverContent?.turnComplete) {
                            if (userTranscriptRef.current || assistantTranscriptRef.current) {
                                setHistory(prev => [...prev, {
                                    user: userTranscriptRef.current,
                                    assistant: assistantTranscriptRef.current,
                                    chartData: chartDataRef.current,
                                }]);
                            }
                            userTranscriptRef.current = '';
                            assistantTranscriptRef.current = '';
                            chartDataRef.current = null;
                            setStatus('listening');
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const ctx = outputAudioContextRef.current;
                            nextAudioStartTimeRef.current = Math.max(nextAudioStartTimeRef.current, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            source.addEventListener('ended', () => {
                                audioSourcesRef.current.delete(source);
                                if (audioSourcesRef.current.size === 0) {
                                    setStatus('listening');
                                }
                            });
                            source.start(nextAudioStartTimeRef.current);
                            nextAudioStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                            setStatus('speaking');
                        }
                        
                        const interrupted = message.serverContent?.interrupted;
                        if (interrupted) {
                            for (const source of audioSourcesRef.current.values()) {
                                source.stop();
                                audioSourcesRef.current.delete(source);
                            }
                            nextAudioStartTimeRef.current = 0;
                            setStatus('listening');
                        }

                    },
                    onerror: (e: ErrorEvent) => {
                        console.error("Live session error:", e);
                        setErrorMessage("Ocorreu um erro na conexão com o assistente.");
                        setStatus('error');
                        stopSession();
                    },
                    onclose: () => {
                        console.log("Live session closed.");
                        if (statusRef.current !== 'idle') {
                            stopSession();
                        }
                    },
                }
            });
        } catch (error) {
            console.error("Failed to start session:", error);
            setErrorMessage("Não foi possível iniciar o microfone. Verifique as permissões.");
            setStatus('error');
        }
    }, [getSystemPrompt, stopSession]);


    const handleClose = () => {
        stopSession();
        onClose();
    };
    
    useEffect(() => {
        if (isOpen) {
            setHistory([]);
            userTranscriptRef.current = '';
            assistantTranscriptRef.current = '';
            chartDataRef.current = null;
            setErrorMessage(null);
            startSession();
        } else {
            stopSession();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);
    
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }); 

    if (!isOpen) {
        return null;
    }

    const StatusIndicator = () => {
        const baseClasses = "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shadow-lg";
        const iconClasses = "h-8 w-8 text-white";

        switch (status) {
            case 'listening':
                return (
                    <div className={`${baseClasses} bg-green-500 shadow-green-500/30 animate-pulse`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </div>
                );
            case 'speaking':
            case 'processing':
                return (
                    <div className={`${baseClasses} bg-cyan-500 shadow-cyan-500/30`}>
                        <div className="w-4 h-4 bg-white rounded-full animate-ping absolute opacity-50"></div>
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                );
            case 'error':
                 return (
                    <div className={`${baseClasses} bg-red-500 shadow-red-500/30`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <div className={`${baseClasses} bg-slate-600`}>
                         <svg xmlns="http://www.w3.org/2000/svg" className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </div>
                );
        }
    };
    
    const getWelcomeMessage = () => {
        if (isDemo) {
            return "Olá! Sou seu assistente de IA para a Padaria Pão Quente. Estou ouvindo. Como posso ajudar a analisar os dados hoje?";
        }
        if (clientContext) {
            return `Olá! Sou seu assistente para a empresa ${clientContext.name}. Estou pronto para analisar os dados. O que você gostaria de saber?`;
        }
        return "Olá! Sou seu assistente de contabilidade. Estou pronto para ajudar. Faça uma pergunta.";
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center sm:p-4">
            <div className="bg-slate-900 sm:border border-slate-700/50 sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-2xl flex flex-col shadow-2xl shadow-cyan-500/10 sm:max-h-[85vh]">
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700/50">
                     <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full transition-colors ${status === 'listening' || status === 'speaking' ? 'bg-green-400' : 'bg-slate-500'}`}></div>
                        <h2 className="text-lg font-bold text-white">Assistente de Voz IA</h2>
                    </div>
                    <button onClick={handleClose} className="text-slate-500 hover:text-white p-1 rounded-full text-2xl leading-none">&times;</button>
                </header>
                
                <main ref={chatContainerRef} className="p-6 flex-grow overflow-y-auto space-y-6 scroll-smooth">
                    {history.length === 0 && !userTranscriptRef.current && (
                         <div className="text-left text-white font-medium">
                            <div className="inline-block bg-slate-700/60 rounded-xl rounded-bl-sm px-4 py-2">
                                {getWelcomeMessage()}
                            </div>
                        </div>
                    )}

                    {history.map((turn, index) => (
                        <div key={index} className="space-y-4">
                             {turn.user && (
                                <div className="text-right">
                                     <div className="inline-block bg-cyan-500/80 text-white rounded-xl rounded-br-sm px-4 py-2 max-w-[80%] text-left">
                                        {turn.user}
                                     </div>
                                </div>
                            )}
                            {turn.assistant && (
                                <div className="text-left text-white font-medium">
                                    <div className="inline-block bg-slate-700/60 rounded-xl rounded-bl-sm px-4 py-2 max-w-[80%]">
                                        {turn.assistant}
                                    </div>
                                </div>
                            )}
                            {turn.chartData && (
                                <div className="my-4">
                                    <ChartComponent title={turn.chartData.title} data={turn.chartData.data} />
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {/* Live Transcripts */}
                    {userTranscriptRef.current && (
                        <div className="text-right">
                             <div className="inline-block bg-cyan-500/80 text-white rounded-xl rounded-br-sm px-4 py-2 max-w-[80%] text-left">
                                {userTranscriptRef.current}
                             </div>
                        </div>
                    )}
                    {assistantTranscriptRef.current && (
                         <div className="text-left text-white font-medium">
                            <div className="inline-block bg-slate-700/60 rounded-xl rounded-bl-sm px-4 py-2 max-w-[80%]">
                                {assistantTranscriptRef.current}
                            </div>
                        </div>
                    )}
                    {chartDataRef.current && (
                        <div className="my-4">
                            <ChartComponent title={chartDataRef.current.title} data={chartDataRef.current.data} />
                        </div>
                    )}
                </main>
                
                <footer className="flex-shrink-0 p-6 bg-slate-900/50 border-t border-slate-700/50 flex flex-col items-center justify-center">
                    <StatusIndicator />
                    {errorMessage && <p className="text-red-400 text-xs mt-3 text-center">{errorMessage}</p>}
                </footer>
            </div>
        </div>
    );
};

export default VoiceAssistantModal;