import React from 'react';
import MobileMockup from './MobileMockup';

interface HeroSectionProps {
    onLogin: () => void;
    onOpenVoiceAssistant: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onLogin, onOpenVoiceAssistant }) => {
    return (
        <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800/50"></div>
            <div className="container mx-auto px-6 py-24 sm:py-32 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                            A IA que entrega <span className="text-cyan-400">dados, proatividade e expertise</span> para seus clientes.
                        </h1>
                        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0">
                           Transforme a gestão do seu cliente com um assistente que apresenta dados instantaneamente, monitora a saúde fiscal da empresa e responde a complexas dúvidas tributárias, 24 horas por dia.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <button
                                onClick={onLogin}
                                className="w-full sm:w-auto bg-cyan-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-cyan-600 transition-colors duration-300 shadow-lg shadow-cyan-500/20"
                            >
                                Acessar o Painel
                            </button>
                            <a 
                                href="mailto:contato@contaflux.ia"
                                className="w-full sm:w-auto text-white font-semibold px-8 py-3 rounded-lg hover:bg-slate-800/50 transition-colors duration-300"
                            >
                                Fale com um especialista
                            </a>
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <p className="text-center text-slate-400 mb-4 text-sm font-medium animate-pulse">
                            ↓ Veja como seu cliente vai interagir com o contador 24h ↓
                        </p>
                        <MobileMockup onOpenVoiceAssistant={onOpenVoiceAssistant} />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;