import React from 'react';

interface ApiConnectionGuidePageProps {
    onBack: () => void;
}

const ApiConnectionGuidePage: React.FC<ApiConnectionGuidePageProps> = ({ onBack }) => {
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
                    <h1 className="text-4xl font-extrabold text-white">Guia de Conexão: API Genérica</h1>
                    <p className="text-slate-400 mt-2">Siga os passos abaixo para conectar seu sistema via API.</p>
                </div>
                <div className="max-w-4xl mx-auto bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Passo 1: Obtenha suas Credenciais</h2>
                        <p className="text-slate-400">Na seção 'Configurações' do seu painel Contaflux IA, navegue até 'Integrações de API' e gere uma nova chave de API. Guarde esta chave em um local seguro, ela não será exibida novamente.</p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Passo 2: Configure o Endpoint</h2>
                        <p className="text-slate-400">Envie os dados financeiros mensais dos seus clientes para o seguinte endpoint via requisição POST:</p>
                        <code className="block bg-slate-900/50 p-3 rounded-md mt-2 text-cyan-400 text-sm overflow-x-auto">https://api.contaflux.ia/v1/financial-data/sync</code>
                    </div>
                     <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Passo 3: Autenticação</h2>
                        <p className="text-slate-400">Inclua sua chave de API no cabeçalho da requisição da seguinte forma:</p>
                        <code className="block bg-slate-900/50 p-3 rounded-md mt-2 text-cyan-400 text-sm">Authorization: Bearer SUA_CHAVE_DE_API_AQUI</code>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Passo 4: Formato dos Dados (JSON)</h2>
                        <p className="text-slate-400">O corpo da requisição deve ser um JSON contendo um objeto com os dados de um cliente para um mês específico. Use o ID do cliente da plataforma Contaflux IA.</p>
                        <pre className="block bg-slate-900/50 p-3 rounded-md mt-2 text-white text-xs overflow-x-auto">
{`{
  "clientId": "firestore_client_id_123",
  "month": "Maio/2024",
  "revenue": 125000.50,
  "expenses": 89000.75,
  "topExpenseCategory": "Fornecedores",
  "topExpenseValue": 35000.00
}`}
                        </pre>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ApiConnectionGuidePage;
