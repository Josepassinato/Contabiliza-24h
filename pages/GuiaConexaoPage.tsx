
import React from 'react';

const GuiaConexaoPage: React.FC = () => {
    // This is a placeholder page.
    // In a real app, this would show a step-by-step guide on how to connect a specific platform.

    return (
        <div className="min-h-screen bg-slate-900 text-slate-300">
            <header className="sticky top-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-slate-700/50">
              <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                   <svg className="w-8 h-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                   </svg>
                  <h1 className="text-2xl font-bold text-white">
                    Contaflux <span className="text-cyan-400">IA</span>
                  </h1>
                </div>
              </nav>
            </header>
            <main>
                <section className="py-16">
                    <div className="container mx-auto px-6">
                        <div className="mb-12">
                            <a href="/" className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 mb-4">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                                Voltar ao Painel
                            </a>
                            <h1 className="text-4xl font-extrabold text-white">Guia de Conexão: ERP Local</h1>
                            <p className="text-slate-400 mt-2">Siga os passos abaixo para conectar seu sistema.</p>
                        </div>
                        <div className="max-w-4xl mx-auto bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Passo 1: Gere uma Chave de API</h2>
                                <p>No seu sistema ERP, navegue até a seção de 'Integrações' ou 'Configurações de Desenvolvedor' e crie uma nova chave de API com permissões de leitura de dados financeiros.</p>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Passo 2: Insira a Chave na Plataforma</h2>
                                <p>Copie a chave gerada e cole no campo correspondente na tela de 'Gerenciar Conexões' da Contaflux IA ao adicionar uma nova conexão do tipo 'ERP Local'.</p>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Passo 3: Teste a Conexão</h2>
                                <p>Clique em 'Salvar e Testar Conexão' para verificar se a integração foi bem-sucedida. Se tudo estiver correto, o status da plataforma mudará para 'Conectado' e a sincronização inicial começará.</p>
                            </div>
                             <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Solução de Problemas</h3>
                                <p className="text-slate-400">Se a conexão falhar, verifique se a chave de API foi copiada corretamente e se ela possui as permissões necessárias. Consulte a documentação do seu ERP para mais detalhes.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default GuiaConexaoPage;