import React from 'react';

interface MobileMockupProps {
    onOpenVoiceAssistant: () => void;
}

const MobileMockup: React.FC<MobileMockupProps> = ({ onOpenVoiceAssistant }) => {
    return (
        <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-slate-900 flex flex-col">
                {/* Header */}
                <div className="flex-shrink-0 p-3 bg-slate-800/50 flex items-center gap-3 border-b border-slate-700/50">
                    <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center">
                         <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 20V4L12 14L4 20Z" fill="#FFFFFF"/>
                            <path d="M20 20V4L12 14L20 20Z" fill="#0891b2"/>
                         </svg>
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm pt-1">Medeiros S. Contábeis</p>
                        <p className="text-xs text-green-400">Online</p>
                    </div>
                </div>

                {/* Chat content (Static) */}
                <div className="flex-grow p-4 space-y-3 flex flex-col scroll-smooth">
                    <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-slate-700 text-slate-300 self-start rounded-bl-lg">
                        Olá! Sou seu contador 24h. Como posso ajudar com os dados de Maio?
                    </div>
                     <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-slate-700 text-slate-300 self-start rounded-bl-lg">
                        Clique no microfone abaixo para fazer uma pergunta por voz.
                    </div>
                </div>

                {/* Input -> Now just a button to launch the modal */}
                 <div className="flex-shrink-0 p-2 bg-slate-800/50 border-t border-slate-700/50 flex items-center justify-center h-[72px] transition-all duration-300">
                    <button
                        onClick={onOpenVoiceAssistant}
                        className="bg-cyan-500 text-white w-14 h-14 rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:bg-cyan-600 transition-all duration-300 ease-in-out transform hover:scale-110"
                        aria-label="Iniciar assistente de voz"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileMockup;