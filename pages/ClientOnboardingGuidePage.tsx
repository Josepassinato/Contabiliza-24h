import React from 'react';

interface ClientOnboardingGuidePageProps {
    onBack: () => void;
}

const ClientOnboardingGuidePage: React.FC<ClientOnboardingGuidePageProps> = ({ onBack }) => {
    return (
        <section className="py-16">
            <div className="container mx-auto px-6">
                <div className="mb-12">
                     <button onClick={onBack} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Voltar para Guias
                    </button>
                    <h1 className="text-4xl font-extrabold text-white">Guia: Onboarding de Clientes</h1>
                    <p className="text-slate-400 mt-2">Entenda o fluxo desde o convite até o primeiro uso do assistente pelo seu cliente.</p>
                </div>
                <div className="max-w-4xl mx-auto bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Passo 1: Envie o Convite</h2>
                        <p className="text-slate-400">Na tela 'Gerenciar Clientes', preencha o nome da empresa e o e-mail do gestor responsável e clique em 'Enviar Convite'. O status do cliente mudará para 'Pendente'.</p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Passo 2: O Cliente Configura o Acesso</h2>
                        <p className="text-slate-400">O gestor receberá um e-mail com um link único para configurar seu acesso. Ele passará por um rápido processo de onboarding que simula uma verificação de segurança (Face ID) e, ao final, receberá seu link pessoal de acesso ao assistente.</p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Passo 3: Sincronize os Dados</h2>
                        <p className="text-slate-400">Após o cliente configurar o acesso, o status dele mudará para 'Ativo'. Agora, é crucial que você, contador, acesse a página de 'Detalhes do Cliente' e clique em 'Sincronizar Dados'. Isso garante que o assistente de IA tenha as informações financeiras mais recentes para responder às perguntas do cliente.</p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Passo 4: Acesso Contínuo</h2>
                        <p className="text-slate-400">O cliente pode usar o link de acesso pessoal a qualquer momento para falar com o assistente. É recomendado que ele adicione o link à tela inicial do celular (PWA) para ter uma experiência similar a um aplicativo nativo.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ClientOnboardingGuidePage;
