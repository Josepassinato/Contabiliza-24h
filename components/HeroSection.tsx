
import React from 'react';
import MobileMockup from './MobileMockup';

interface HeroSectionProps {
    onLogin: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onLogin }) => {
    return (
        <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800/50"></div>
            <div className="container mx-auto px-6 py-24 sm:py-32 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                            Ofereça um <span className="text-cyan-400">contador 24h por dia</span> aos seus clientes.
                        </h1>
                        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0">
                            Transforme seu serviço com um assistente de IA que responde dúvidas em tempo real, dia e noite. Reduza em até 85% as chamadas de rotina ao escritório, elimine a perda de produtividade da sua equipe e foque no crescimento estratégico.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <button
                                onClick={onLogin}
                                className="w-full sm:w-auto bg-cyan-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-cyan-600 transition-colors duration-300 shadow-lg shadow-cyan-500/20"
                            >
                                Acessar o Painel (Demo)
                            </button>
                            <a 
                                href="mailto:contato@contabiliza.ai"
                                className="w-full sm:w-auto text-white font-semibold px-8 py-3 rounded-lg hover:bg-slate-800/50 transition-colors duration-300"
                            >
                                Fale com um especialista
                            </a>
                        </div>
                    </div>
                    <div>
                        <MobileMockup />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;