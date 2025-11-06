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
    const [currentTurn, setCurrentTurn] = useState<ChatMessage | null>(null);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    
    // State for function calling (charts)
    const chartDataRef = useRef<{ title: string; data: { label: string; value: number }[] } | null>(null);

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
            return `Você é um assistente de IA para contabilidade chamado Contaflux. Você está em modo de demonstração. Seu objetivo é mostrar suas capacidades a um contador que está avaliando seu software. Use os dados financeiros fictícios a seguir para responder: Mês: Maio/2024, Faturamento Bruto: R$125.000, Despesas Totais: R$89.000 (detalhes: Fornecedores R$35.000, Aluguel R$12.000, Folha de Pagamento R$42.000). Seja conciso, amigável e proativo. Se o usuário pedir um gráfico, use a função 'displayFinancialChart'. Ao final de uma interação útil, pergunte se o usuário deseja receber um resumo das informações por e-mail.`;
        }
        if (clientContext?.financialData) {
            const data = clientContext.financialData;
            return `Você é um assistente de IA para a empresa ${clientContext.name}. Responda perguntas com base nos seguintes dados financeiros de ${data.month}: Faturamento Bruto: R$${data.revenue}, Despesas Totais: R$${data.expenses}. A principal categoria de despesa foi ${data.topExpenseCategory} com R$${data.topExpenseValue}. Seja direto e preciso. Se pedirem um gráfico, use a ferramenta 'displayFinancialChart'.`;
        }
        return 'Você é um assistente de IA para contabilidade. Responda às perguntas sobre finanças, impostos e gestão de forma geral, já que nenhum dado de cliente específico foi carregado.';
    }, [isDemo, clientContext]);
    
    
    const startSession = useCallback(async () => {
        if (!process.env.API_KEY) {
            console.error("API_KEY is not set.");
            setStatus('error');
            return;
        }

        setStatus('listening');
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        try {
            // FIX: Cast window to any to allow for webkitAudioContext for cross-browser compatibility.
            audioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            // FIX: Cast window to any to allow for webkitAudioContext for cross-browser compatibility.
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
                    tools: [{ functionDeclarations: [displayFinancialChart] }],
                },
                callbacks: {
                    onopen: () => {
                        if (!audioContextRef.current || !mediaStreamRef.current) return;
                        
                        mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                // FIX: Wrap the ArrayBuffer in a Uint8Array to match the 'encode' function's expected parameter type.
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle transcriptions
                        if (message.serverContent?.inputTranscription) {
                            userTranscriptRef.current += message.serverContent.inputTranscription.text;
                             setCurrentTurn({ user: userTranscriptRef.current, assistant: assistantTranscriptRef.current, chartData: chartDataRef.current });
                        }
                        if (message.serverContent?.outputTranscription) {
                            assistantTranscriptRef.current += message.serverContent.outputTranscription.text;
                             setCurrentTurn({ user: userTranscriptRef.current, assistant: assistantTranscriptRef.current, chartData: chartDataRef.current });
                        }
                        
                        if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
                            setStatus('speaking');
                        }

                        // Handle Function Calling
                        if (message.toolCall?.functionCalls) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'displayFinancialChart') {
                                    try {
                                        const args: any = fc.args;

                                        if (!args || typeof args !== 'object') throw new Error("Argumentos da função estão faltando ou não são um objeto.");
                                        const { title, data } = args;
                                        if (typeof title !== 'string' || !Array.isArray(data)) throw new Error("Tipos inválidos para título ou dados nos argumentos.");

                                        const isValidData = data.every((item: any) =>
                                            item && typeof item === 'object' &&
                                            typeof item.label === 'string' &&
                                            typeof item.value === 'number' &&
                                            !isNaN(item.value)
                                        );

                                        if (!isValidData) throw new Error("Estrutura inválida para itens no array de dados.");

                                        const newChartData = { title, data };
                                        chartDataRef.current = newChartData;
                                        setCurrentTurn(prev => ({ user: prev?.user ?? userTranscriptRef.current, assistant: assistantTranscriptRef.current, chartData: newChartData }));

                                        sessionPromiseRef.current?.then((session) => {
                                            session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: "ok, o gráfico foi exibido." } } });
                                        });

                                    } catch (error) {
                                        console.error("Erro ao processar a chamada de função displayFinancialChart:", error);
                                        sessionPromiseRef.current?.then((session) => {
                                            session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { error: (error as Error).message } } });
                                        });
                                    }
                                }
                            }
                        }

                        // Handle Audio
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

                        // Handle Turn Completion
                        if (message.serverContent?.turnComplete) {
                            const finalUserTranscript = userTranscriptRef.current;
                            const finalAssistantTranscript = assistantTranscriptRef.current;
                            const finalChartData = chartDataRef.current;

                            if (finalUserTranscript.trim() || finalAssistantTranscript.trim()) {
                                setHistory(prev => [...prev, { user: finalUserTranscript, assistant: finalAssistantTranscript, chartData: finalChartData }]);
                            }

                            // Reset for next turn
                            userTranscriptRef.current = '';
                            assistantTranscriptRef.current = '';
                            chartDataRef.current = null;
                            setCurrentTurn(null);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setStatus('error');
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Session closed');
                    },
                }
            });
        } catch (error) {
            console.error('Failed to start session:', error);
            setStatus('error');
        }
    }, [getSystemPrompt]);
    
    const stopSession = useCallback(() => {
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
        audioContextRef.current?.close();
        outputAudioContextRef.current?.close();

        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextAudioStartTimeRef.current = 0;
        
        setStatus('idle');
    }, []);

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
        setCurrentTurn(null);
    };

    const handleClear = () => {
        setHistory([]);
        setCurrentTurn(null);
        userTranscriptRef.current = '';
        assistantTranscriptRef.current = '';
        chartDataRef.current = null;
    };
    
    const getStatusIndicator = () => {
        switch (status) {
            case 'listening': return { text: 'Ouvindo...', color: 'border-cyan-500' };
            case 'processing': return { text: 'Processando...', color: 'border-yellow-500' };
            case 'speaking': return { text: 'Falando...', color: 'border-green-500' };
            case 'error': return { text: 'Erro na Conexão', color: 'border-red-500' };
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
                    {history.map((turn, index) => (
                        <div key={index}>
                            <p className="text-cyan-400 font-semibold mb-1">Você:</p>
                            <p className="ml-4 text-slate-300">{turn.user}</p>
                            <p className="text-green-400 font-semibold mt-3 mb-1">Assistente:</p>
                            <p className="ml-4 text-slate-300">{turn.assistant}</p>
                            {turn.chartData && <div className="mt-4 ml-4"><ChartComponent title={turn.chartData.title} data={turn.chartData.data} /></div>}
                        </div>
                    ))}
                    {currentTurn && (
                         <div>
                            <p className="text-cyan-400 font-semibold mb-1">Você:</p>
                            <p className="ml-4 text-slate-300">{currentTurn.user}</p>
                            <p className="text-green-400 font-semibold mt-3 mb-1">Assistente:</p>
                            <p className="ml-4 text-slate-300">{currentTurn.assistant}</p>
                             {currentTurn.chartData && <div className="mt-4 ml-4"><ChartComponent title={currentTurn.chartData.title} data={currentTurn.chartData.data} /></div>}
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
