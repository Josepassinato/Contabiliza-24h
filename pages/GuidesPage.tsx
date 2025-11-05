import React from 'react';

// This component acts as a hub for all help guides.

interface GuidesPageProps {
    onNavigate: (page: string) => void;
    onBack: () => void;
}

const GuidesPage: React.FC<GuidesPageProps> = ({ onNavigate, onBack }) => {
    return (
        <section className="py-16">
            <div className="container mx-auto px-6">
                <div className="mb-12">
                     <button onClick={onBack} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Voltar ao Painel
                    </button>
                    <h1 className="text-4xl font-extrabold text-white">Central de Ajuda</h1>
                    <p className="text-slate-400 mt-2">Encontre guias e tutoriais para aproveitar ao máximo o Contaflux IA.</p>
                </div>
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <GuideCard
                        title="Guia de Conexão de API"
                        description="Aprenda passo a passo como conectar seu ERP e outras plataformas de dados."
                        onClick={() => onNavigate('api_connection_guide')}
                    />
                    <GuideCard
                        title="Convidando seu Cliente (Onboarding)"
                        description="Veja como convidar seus clientes e o que eles precisam fazer para começar a usar o assistente de IA."
                        onClick={() => onNavigate('client_onboarding_guide')}
                    />
                    {/* Add more guides as needed */}
                </div>
            </div>
        </section>
    );
};


const GuideCard: React.FC<{ title: string; description: string; onClick: () => void }> = ({ title, description, onClick }) => (
    <button
        onClick={onClick}
        className="block p-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-left hover:bg-slate-800 hover:border-cyan-500/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
    >
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="mt-3 text-slate-400">{description}</p>
        <div className="mt-6 font-semibold text-cyan-400">
            Ver Guia &rarr;
        </div>
    </button>
);

export default GuidesPage;
