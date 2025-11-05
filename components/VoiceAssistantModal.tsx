import React, { useState, useEffect, useRef, useCallback } from 'react';
// Corrected import to follow Gemini API guidelines
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { User } from '../contexts/AuthContext';
import { Client, FinancialData } from '../api/contadorApi';
import { isFirebaseConfigured } from '../firebase/config';

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


const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose, user, isDemo, clientContext }) => {
    const [status, setStatus] = useState<AssistantStatus>('idle');
    const userTranscriptRef = useRef('');
    const assistantTranscriptRef = useRef('');
    const [currentTurn, setCurrentTurn] = useState({ user: '', assistant: '' });
    const [history, setHistory] = useState<{ user: string; assistant: string }[]>([]);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const getSystemInstruction = () => {
        const baseIntro = `Você é o Contaflux IA, um assistente contador especialista. Sua persona é direta, confiável e prestativa.`;

        if (isDemo) {
            return `Você é o Contaflux IA para uma demonstração. Responda brevemente a perguntas sobre dados da 'Padaria Pão Quente'. O faturamento em Maio foi R$50.000, e a maior despesa foi com 'Fornecedores' (R$20.000). Diga que não é uma boa ideia contratar agora. Inicie a conversa se apresentando.`;
        }

        const dataContext = clientContext?.financialData
            ? `Você está atendendo a empresa '${clientContext.name}'. Use os seguintes dados para embasar suas respostas: ${formatFinancialDataForPrompt(clientContext.financialData)}`
            : `Você está no modo geral. Se perguntado sobre dados específicos de um cliente, informe que precisa que o contador selecione um cliente e sincronize os dados primeiro.`;

        const functionHierarchy = `
Suas funções, em ordem de prioridade, são:
1.  **Assistente de Dados Instantâneos**: Sua principal função é entregar dados financeiros e de performance de forma clara e instantânea quando solicitado. Ofereça dicas baseadas nos dados.
2.  **Monitor Fiscal Proativo**: Sua segunda função é agir como um monitor da saúde fiscal. Se identificar uma tendência ou ponto de atenção nos dados, mencione-o.
3.  **Especialista Tributário**: Sua terceira função, APENAS quando inquirida sobre impostos, é responder a dúvidas tributárias. Nestes casos, sempre considere a legislação federal e estadual aplicável.`;

        return `${baseIntro}\n${dataContext}\n${functionHierarchy}`;
    };
    
    const cleanup = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close()).catch(console.error);
        sessionPromiseRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
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
                // Read the Gemini API key from environment variables, with a fallback for demo environments.
                // This is the correct and safe way to handle API keys on the client-side.
                const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY || "AIzaSyCHG3sQEtMHHOidAAzFBGmbtL607yM6O-c";

                if (!isFirebaseConfigured || !geminiApiKey) {
                    console.error("Firebase or Gemini API Key is not configured.");
                    setStatus('error');
                    return;
                }
                
                const ai = new GoogleGenAI({ apiKey: geminiApiKey });

                inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                
                mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

                sessionPromiseRef.current = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    config: {
                        responseModalities: [Modality.AUDIO],
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        systemInstruction: getSystemInstruction(),
                    },
                    callbacks: {
                        onopen: () => {
                            if (!isMounted) return;
                            setStatus('listening');

                            mediaStreamSourceRef.current = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                            scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                            
                            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const int16 = new Int16Array(inputData.length);
                                for (let i = 0; i < inputData.length; i++) {
                                    int16[i] = inputData[i] * 32768;
                                }
                                const pcmBlob: Blob = {
                                    data: encode(new Uint8Array(int16.buffer)),
                                    mimeType: 'audio/pcm;rate=16000',
                                };
                                // Per guidelines, use promise to avoid stale closures
                                sessionPromiseRef.current?.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            };

                            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                            scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                        },
                        onmessage: async (message: LiveServerMessage) => {
                             if (!isMounted) return;
                            if (message.serverContent) {
                                if (message.serverContent.inputTranscription) {
                                    userTranscriptRef.current += message.serverContent.inputTranscription.text;
                                    setCurrentTurn(prev => ({...prev, user: userTranscriptRef.current}));
                                }
                                if (message.serverContent.outputTranscription) {
                                    if(status !== 'speaking') setStatus('speaking');
                                    assistantTranscriptRef.current += message.serverContent.outputTranscription.text;
                                     setCurrentTurn(prev => ({...prev, assistant: assistantTranscriptRef.current}));
                                }
                                if (message.serverContent.turnComplete) {
                                    setHistory(prev => [...prev, {user: userTranscriptRef.current, assistant: assistantTranscriptRef.current}]);
                                    userTranscriptRef.current = '';
                                    assistantTranscriptRef.current = '';
                                    setCurrentTurn({ user: '', assistant: '' });
                                    setStatus('listening');
                                }
                                const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                                if (audioData && outputAudioContextRef.current) {
                                    const oac = outputAudioContextRef.current;
                                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, oac.currentTime);
                                    const audioBuffer = await decodeAudioData(decode(audioData), oac, 24000, 1);
                                    const source = oac.createBufferSource();
                                    source.buffer = audioBuffer;
                                    source.connect(oac.destination);
                                    
                                    source.addEventListener('ended', () => {
                                        audioSourcesRef.current.delete(source);
                                    });
                                    
                                    source.start(nextStartTimeRef.current);
                                    nextStartTimeRef.current += audioBuffer.duration;
                                    audioSourcesRef.current.add(source);
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
        error: { text: "Erro. Verifique a configuração da API Key ou a permissão do microfone.", color: "text-red-400" },
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg h-[80vh] max-h-[700px] flex flex-col shadow-2xl shadow-cyan-500/10" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 flex justify-between items-center border-b border-slate-700/50">
                    <h2 className="text-lg font-bold text-white">Assistente de Voz Contaflux IA</h2>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
                </main>

                <footer className="p-6 border-t border-slate-700/50 flex flex-col items-center justify-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'listening' ? 'bg-cyan-500/20' : ''}`}>
                         <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'listening' ? 'bg-cyan-500/30' : ''}`}>
                             <div className="bg-cyan-500 text-white w-16 h-16 rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                         </div>
                    </div>
                    <p className={`mt-4 text-sm font-medium ${statusInfo[status].color}`}>{statusInfo[status].text}</p>
                    {isDemo ? <p className="text-xs text-slate-500 mt-2">Modo Demonstração</p> : clientContext ? <p className="text-xs text-slate-500 mt-2">Contexto: {clientContext.name}</p> : null}
                </footer>
            </div>
        </div>
    );
};

export default VoiceAssistantModal;