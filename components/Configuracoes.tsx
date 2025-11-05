import React from 'react';

interface ConfiguracoesProps {
    onBack: () => void;
}

const Configuracoes: React.FC<ConfiguracoesProps> = ({ onBack }) => {
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
                    <h1 className="text-4xl font-extrabold text-white">Configurações</h1>
                    <p className="text-slate-400 mt-2">Ajuste as configurações da sua conta e integrações.</p>
                </div>
                <div className="max-w-2xl mx-auto bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Configurações da Conta</h2>
                     <div className="space-y-6">
                        <div>
                            <label htmlFor="accountName" className="block text-sm font-medium text-slate-300">Nome da Contabilidade</label>
                            <input
                                type="text"
                                id="accountName"
                                defaultValue="Contabilidade Exemplo"
                                className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="accountEmail" className="block text-sm font-medium text-slate-300">Email de Contato</label>
                            <input
                                type="email"
                                id="accountEmail"
                                defaultValue="contato@exemplo.com"
                                className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        </div>
                         <div className="pt-4">
                            <button className="w-full sm:w-auto flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 transition-colors duration-300">
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Configuracoes;
