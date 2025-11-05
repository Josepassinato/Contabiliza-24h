import React from 'react';

// FIX: Refactored to use a dedicated interface for props and React.FC for better type safety.
interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, children }) => (
    <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center text-cyan-400 mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{children}</p>
    </div>
);

const FeaturesSection: React.FC = () => {
    return (
        <section className="py-20">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">A Ferramenta Definitiva para a Contabilidade Moderna</h2>
                    <p className="mt-4 text-slate-400">Vá além dos relatórios. Entregue valor contínuo e proativo para seus clientes.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
                    <FeatureCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                        title="Dados Instantâneos e Dicas"
                    >
                        Seu cliente pergunta sobre faturamento, despesas e performance, recebendo respostas e gráficos na hora, baseados nos dados mais recentes da empresa.
                    </FeatureCard>
                    <FeatureCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                        title="Acompanhamento Fiscal Proativo"
                    >
                        A IA monitora a saúde fiscal da empresa, podendo alertar sobre tendências preocupantes ou oportunidades de otimização, agindo como um verdadeiro parceiro de negócios.
                    </FeatureCard>
                     <FeatureCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.757 14.757a3 3 0 014.242 0 3 3 0 014.243 0M3 8.25V3.75A1.5 1.5 0 014.5 2.25h15A1.5 1.5 0 0121 3.75v4.5m-7.5 12V10.5M12 10.5l-2.25-2.25M12 10.5l2.25-2.25" /></svg>}
                        title="Especialista Tributário Sob Demanda"
                    >
                        Se inquirida, a IA responde a dúvidas sobre alíquotas, ICMS, ou PIS/COFINS, considerando a legislação federal e estadual para fornecer orientações confiáveis.
                    </FeatureCard>
                    <FeatureCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h4.5M12 3v12" /></svg>}
                        title="Menos Interrupções, Mais Estratégia"
                    >
                        Reduza drasticamente as chamadas e e-mails de rotina. Com as dúvidas comuns resolvidas pela IA, sua equipe se liberta da carga operacional para focar em consultoria de alto valor.
                    </FeatureCard>
                    <FeatureCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4m-4 0a1 1 0 01-1-1v-1a1 1 0 011-1h4a1 1 0 011 1v1a1 1 0 01-1 1m-4 0h4m-6 6v-3a1 1 0 011-1h2a1 1 0 011 1v3m-4 0h4" /></svg>}
                        title="Sua Marca em Evidência"
                    >
                        Personalize a plataforma com o logo e as cores da sua contabilidade. Mostre ao seu cliente que seu escritório investe em tecnologia de ponta para oferecer o melhor serviço.
                    </FeatureCard>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;