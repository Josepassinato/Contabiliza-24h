import React, { useState, useEffect, useRef, useCallback } from 'react';
// Corrected import to follow Gemini API guidelines
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { User } from '../contexts/AuthContext';
import { Client, FinancialData } from '../api/contadorApi';
import { firebaseConfig } from '../firebase/config';
import ChartComponent from './ChartComponent';

interface VoiceAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    isDemo: boolean;
    clientContext: Client | null;
}

type AssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

// Helper function to format the financial data into a string for the AI prompt
const formatFinancialDataForPrompt = (data: FinancialData): string => {
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return `
Dados Financeiros Referentes a ${data.month}:
- Faturamento Bruto: ${formatCurrency(data.revenue)}
- Total de Despesas: ${formatCurrency(data.expenses)}
- Principal Categoria de Despesa: ${data.topExpenseCategory} (${formatCurrency(data.topExpenseValue)})
- Margem de Lucro Bruta (calculada): ${formatCurrency(data.revenue - data.expenses)}
`;
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

// --- Function Calling Definition ---
const displayFinancialChart: FunctionDeclaration = {
  name: 'displayFinancialChart',
  parameters: {
    type: Type.OBJECT,
    description: 'Exibe um gráfico de barras com dados financeiros.',
    properties: {
      title: {
        type: Type.STRING,
        description: 'O título do gráfico. Ex: "Detalhamento de Despesas de Maio/2024".',
      },
      data: {
        type: Type.ARRAY,
        description: 'Uma lista de itens para plotar no gráfico.',
        items: {
          type: Type.OBJECT,
          properties: {
            label: {
              type: Type.STRING,
              description: 'O rótulo da barra. Ex: "Fornecedores".',
            },
            value: {
              type: Type.NUMBER,
              description: 'O valor numérico da barra. Ex: 12000.',
            },
          },
           required: ['label', 'value'],
        },
      },
    },
    required: ['title', 'data'],
  },
};


const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose, user, isDemo, clientContext }) => {
    const [status, setStatus] = useState<AssistantStatus>('idle');
    const userTranscriptRef = useRef('');
    const assistantTranscriptRef = useRef('');
    const [currentTurn, setCurrentTurn] = useState({ user: '', assistant: '' });
    const [history, setHistory] = useState<{ user: string; assistant: string }[]>([]);
    
    // State for function calling (charts)
    const [chartData, setChartData] = useState<{label: string, value: number}[] | null>(null);
    const [chartTitle, setChartTitle] = useState<string>('');


    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const noiseGateRef = useRef<DynamicsCompressorNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const isAssistantSpeakingRef = useRef(false); // Ref to gate microphone input

    const getSystemInstruction = () => {
        const baseIntro = `Você é o Contaflux IA, um assistente contador especialista. Sua persona é direta, confiável e prestativa.`;
        
        const noiseHandlingInstruction = `**REGRAS RÍGIDAS DE SUPRESSÃO DE RUÍDO:**
1.  **Foco em Comandos Claros:** Seu objetivo principal é ignorar CUIDADOSAMENTE qualquer som que não seja uma instrução de voz clara e direta. Muitos usuários estarão em modo viva-voz, então espere ruídos de fundo (carros, outras pessoas falando ao longe, tosse, etc.).
2.  **NÃO RESPONDA A RUÍDOS:** Se o áudio for baixo, abafado ou incerto, NÃO responda. Apenas continue ouvindo. É melhor não responder do que interromper com uma resposta errada.
3.  **Peça para Repetir:** Se você detectar uma fala, mas não tiver certeza do que foi dito, pergunte educadamente: 'Não entendi muito bem, você poderia repetir, por favor?'. Use isso com moderação, apenas se achar que uma pergunta foi feita, mas não foi clara.
4.  **Seja Passivo:** Aguarde o usuário falar com você. Não inicie a conversa a menos que seja a primeira interação.`;

        if (isDemo) {
            return `Você é o Contaflux IA para uma demonstração. Responda brevemente a perguntas sobre dados da 'Padaria Pão Quente'.
Use os seguintes dados simulados:

**Dados Atuais (Maio/2024):**
- Faturamento Bruto: R$ 50.000
- Total de Despesas: R$ 38.500
- Previsão de Impostos (Simples Nacional): R$ 3.000
- Lucro Líquido: R$ 8.500

**Despesas Detalhadas (Maio/2024):**
- Fornecedores (matéria-prima): R$ 12.000
- Folha de Pagamento: R$ 14.000
- Impostos sobre a Folha (INSS + FGTS): R$ 4.000
- Aluguel (Despesa Fixa): R$ 5.000
- Marketing e Outros: R$ 3.500

**Quadro de Funcionários:**
- João Silva (Gerente, Salário: R$ 4.500)
- Maria Souza (Padeira Chefe, Salário: R$ 2.800)
- Ana Costa (Padeira, Salário: R$ 2.500)
- Carlos Pereira (Atendente, Salário: R$ 2.200)
- Beatriz Lima (Atendente, Salário: R$ 2.000)
- **Total da Folha de Pagamento:** R$ 14.000

**Histórico dos Últimos 12 Meses (Faturamento / Despesas):**
- Jun/23: R$42k / R$33k
- Jul/23: R$44k / R$34k
- Ago/23: R$45k / R$35k
- Set/23: R$47k / R$36k
- Out/23: R$48k / R$37k
- Nov/23: R$52k / R$39k
- Dez/23: R$60k / R$42k
- Jan/24: R$48k / R$37k
- Fev/24: R$47k / R$36k
- Mar/24: R$51k / R$38k
- Abr/24: R$49k / R$37.5k
- Mai/24: R$50k / R$38.5k

**Suas Tarefas:**
1.  Responda a perguntas sobre os dados acima. Faça comparações se solicitado (ex: 'faturamento de Maio vs Abril').
2.  **IMPORTANTE: Se o usuário pedir para "ver um gráfico", "mostrar um gráfico", "gerar gráfico" ou algo semelhante, você DEVE usar a ferramenta 'displayFinancialChart'. Por exemplo, para um gráfico de despesas, chame a ferramenta com os dados detalhados das despesas.**
3.  Se perguntado sobre contratações, diga que a margem de lucro está um pouco apertada e seria prudente esperar.
4.  Se solicitado um relatório de faturamento, apresente um resumo verbal dos últimos 3 meses e ofereça enviá-lo por e-mail.
5.  Inicie a conversa se apresentando de forma breve e profissional.
${noiseHandlingInstruction}`;
        }

        const dataContext = clientContext?.financialData
            ? `Você está atendendo a empresa '${clientContext.name}'. Use os seguintes dados para embasar suas respostas: ${formatFinancialDataForPrompt(clientContext.financialData)}`
            : `Você está no modo geral. Se perguntado sobre dados específicos de um cliente, informe que precisa que o contador selecione um cliente e sincronize os dados primeiro.`;

        const functionHierarchy = `
Suas funções, em ordem de prioridade, são:
1.  **Assistente de Dados Instantâneos**: Sua principal função é entregar dados financeiros e de performance de forma clara e instantânea quando solicitado. Ofereça dicas baseadas nos dados.
2.  **Monitor Fiscal Proativo**: Sua segunda função é agir como um monitor da saúde fiscal. Se identificar uma tendência ou ponto de atenção nos dados, mencione-o.
3.  **Especialista Tributário**: Sua terceira função, APENAS quando inquirida sobre impostos, é responder a dúvidas tributárias. Nestes casos, sempre considere a legislação federal e estadual aplicável.`;

        return `${baseIntro}\n${noiseHandlingInstruction}\n${dataContext}\n${functionHierarchy}`;
    };
    
    const cleanup = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close()).catch(console.error);
        sessionPromiseRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        noiseGateRef.current?.disconnect();
        noiseGateRef.current = null;

        mediaStreamSourceRef.current?.disconnect();
        mediaStreamSourceRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        inputAudioContextRef.current?.close().catch(console.error);
        inputAudioContextRef.current = null;

        outputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current = null;

        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        isAssistantSpeakingRef.current = false;
        
        // Reset chart state
        setChartData(null);
        setChartTitle('');

    }, []);

    const handleClose = useCallback(() => {
        cleanup();
        onClose();
    }, [cleanup, onClose]);

    // Initialize and connect to Gemini Live API
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        let isMounted = true;
        
        const setupLiveSession = async () => {
            setStatus('processing'); 

            try {
                const apiKey = firebaseConfig.apiKey;
                if (!apiKey) {
                    console.error("API Key is not configured in firebase/config.ts.");
                    setStatus('error');
                    return;
                }
                
                const ai = new GoogleGenAI({ apiKey: apiKey });

                inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                
                mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

                sessionPromiseRef.current = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                        },
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        systemInstruction: getSystemInstruction(),
                        tools: [{ functionDeclarations: [displayFinancialChart] }],
                    },
                    callbacks: {
                        onopen: () => {
                            if (!isMounted || !inputAudioContextRef.current || !mediaStreamRef.current) return;
                            setStatus('listening');

                            mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                            
                            noiseGateRef.current = inputAudioContextRef.current.createDynamicsCompressor();
                            noiseGateRef.current.threshold.setValueAtTime(-50, inputAudioContextRef.current.currentTime);
                            noiseGateRef.current.knee.setValueAtTime(0, inputAudioContextRef.current.currentTime);
                            noiseGateRef.current.ratio.setValueAtTime(20, inputAudioContextRef.current.currentTime);
                            noiseGateRef.current.attack.setValueAtTime(0, inputAudioContextRef.current.currentTime);
                            noiseGateRef.current.release.setValueAtTime(0.25, inputAudioContextRef.current.currentTime);
                            
                            scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                            
                            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                                // Gatekeeper: if assistant is speaking, don't send user audio.
                                if (isAssistantSpeakingRef.current) {
                                    return;
                                }
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const int16 = new Int16Array(inputData.length);
                                for (let i = 0; i < inputData.length; i++) {
                                    int16[i] = inputData[i] * 32768;
                                }
                                const pcmBlob: Blob = {
                                    data: encode(new Uint8Array(int16.buffer)),
                                    mimeType: 'audio/pcm;rate=16000',
                                };
                                sessionPromiseRef.current?.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            };

                            mediaStreamSourceRef.current.connect(noiseGateRef.current);
                            noiseGateRef.current.connect(scriptProcessorRef.current);
                            scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                        },
                        onmessage: async (message: LiveServerMessage) => {
                             if (!isMounted) return;
                             
                             // Handle Function Calling
                             if (message.toolCall) {
                                for (const fc of message.toolCall.functionCalls) {
                                    if (fc.name === 'displayFinancialChart') {
                                        const { title, data } = fc.args;
                                        setChartTitle(title);
                                        setChartData(data);
                                        // Acknowledge the function call
                                        sessionPromiseRef.current?.then((session) => {
                                            session.sendToolResponse({
                                                functionResponses: {
                                                    id: fc.id,
                                                    name: fc.name,
                                                    response: { result: "Gráfico exibido com sucesso." },
                                                }
                                            });
                                        });
                                    }
                                }
                             }

                            if (message.serverContent) {
                                if (message.serverContent.inputTranscription) {
                                    userTranscriptRef.current += message.serverContent.inputTranscription.text;
                                    setCurrentTurn(prev => ({...prev, user: userTranscriptRef.current}));
                                }
                                if (message.serverContent.outputTranscription) {
                                    assistantTranscriptRef.current += message.serverContent.outputTranscription.text;
                                     setCurrentTurn(prev => ({...prev, assistant: assistantTranscriptRef.current}));
                                }

                                const interrupted = message.serverContent?.interrupted;
                                if (interrupted) {
                                    for (const source of audioSourcesRef.current.values()) {
                                        source.stop();
                                    }
                                    audioSourcesRef.current.clear();
                                    nextStartTimeRef.current = 0;
                                    isAssistantSpeakingRef.current = false; // Open mic gate after interruption
                                    setStatus('listening');
                                }

                                const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                                if (audioData && outputAudioContextRef.current) {
                                    if (status !== 'speaking') setStatus('speaking');
                                    isAssistantSpeakingRef.current = true; // Close mic gate

                                    const oac = outputAudioContextRef.current;
                                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, oac.currentTime);
                                    const audioBuffer = await decodeAudioData(decode(audioData), oac, 24000, 1);
                                    const source = oac.createBufferSource();
                                    source.buffer = audioBuffer;
                                    source.connect(oac.destination);
                                    
                                    source.addEventListener('ended', () => {
                                        audioSourcesRef.current.delete(source);
                                        // If this was the last audio chunk, re-open the mic.
                                        if (audioSourcesRef.current.size === 0) {
                                            isAssistantSpeakingRef.current = false;
                                            setStatus('listening');
                                        }
                                    });
                                    
                                    source.start(nextStartTimeRef.current);
                                    nextStartTimeRef.current += audioBuffer.duration;
                                    audioSourcesRef.current.add(source);
                                }
                                
                                if (message.serverContent.turnComplete) {
                                    if (userTranscriptRef.current || assistantTranscriptRef.current) {
                                        setHistory(prev => [...prev, {user: userTranscriptRef.current, assistant: assistantTranscriptRef.current}]);
                                    }
                                    userTranscriptRef.current = '';
                                    assistantTranscriptRef.current = '';
                                    setCurrentTurn({ user: '', assistant: '' });
                                    
                                    // If turn completes and no audio is playing/pending, ensure we're listening.
                                    if (audioSourcesRef.current.size === 0) {
                                        isAssistantSpeakingRef.current = false;
                                        setStatus('listening');
                                    }
                                }
                            }
                        },
                        onerror: (e: ErrorEvent) => {
                            if (!isMounted) return;
                            console.error('Live session error:', e);
                            setStatus('error');
                        },
                        onclose: (e: CloseEvent) => {
                            if (!isMounted) return;
                            setStatus('idle');
                        },
                    },
                });

            } catch (error) {
                console.error("Failed to setup voice assistant:", error);
                setStatus('error');
            }
        };
        
        setupLiveSession();

        return () => {
            isMounted = false;
            cleanup();
        };

    }, [isOpen, isDemo, clientContext, cleanup]);

    if (!isOpen) return null;

    const statusInfo = {
        idle: { text: "Toque no microfone para começar", color: "text-slate-400" },
        listening: { text: "Ouvindo...", color: "text-cyan-400 animate-pulse" },
        processing: { text: "Conectando...", color: "text-yellow-400" },
        speaking: { text: "Contaflux IA está falando...", color: "text-green-400" },
        error: { text: "Erro. Verifique a permissão do microfone e recarregue.", color: "text-red-400" },
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg h-[80vh] max-h-[700px] flex flex-col shadow-2xl shadow-cyan-500/10" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 flex justify-between items-center border-b border-slate-700/50">
                    <h2 className="text-lg font-bold text-white">Assistente de Voz Contaflux IA</h2>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0-0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                
                <main className="flex-1 p-6 flex flex-col-reverse justify-start overflow-y-auto space-y-4 space-y-reverse">
                     {currentTurn.assistant && <div className="self-start max-w-[80%] bg-slate-700 p-3 rounded-lg text-slate-200">{currentTurn.assistant}</div>}
                     {currentTurn.user && <div className="self-end max-w-[80%] bg-cyan-600 p-3 rounded-lg text-white">{currentTurn.user}</div>}
                    {history.slice().reverse().map((t, i) => (
                        <React.Fragment key={i}>
                            {t.assistant && <div className="self-start max-w-[80%] bg-slate-700 p-3 rounded-lg text-slate-200">{t.assistant}</div>}
                            {t.user && <div className="self-end max-w-[80%] bg-cyan-600/50 p-3 rounded-lg text-white">{t.user}</div>}
                        </React.Fragment>
                    ))}
                    {chartData && (
                        <div className="w-full self-center py-4">
                            <ChartComponent title={chartTitle} data={chartData} />
                        </div>
                    )}
                </main>

                <footer className="p-6 border-t border-slate-700/50 flex flex-col items-center justify-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'listening' ? 'bg-cyan-500/20' : ''}`}>
                         <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'listening' ? 'bg-cyan-500/30' : ''}`}>
                             <div className="bg-cyan-500 text-white w-16 h-16 rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center cursor-pointer transform hover:scale-110 transition-transform">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <p className={`mt-4 text-sm font-medium ${statusInfo[status].color}`}>
                        {statusInfo[status].text}
                    </p>
                    <button 
                        onClick={handleClose} 
                        className="mt-6 bg-slate-700 text-slate-300 font-semibold px-6 py-2 rounded-lg hover:bg-slate-600 transition-colors duration-300 text-sm"
                    >
                        Encerrar Conversa
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default VoiceAssistantModal;