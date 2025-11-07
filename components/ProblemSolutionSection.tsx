
import React from 'react';

const ProblemSolutionSection: React.FC = () => {
    return (
        <section className="py-20 bg-slate-800/50">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
                    A Ponte entre o Contador e a Gestão Ágil
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                    {/* Problem Column */}
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                        <div className="flex items-center justify-center w-16 h-16 bg-red-500/20 text-red-400 rounded-full mb-6 mx-auto">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white text-center mb-6">O Problema Atual</h3>
                        <ul className="space-y-4 text-slate-400 text-left">
                            <li className="flex items-start">
                                <span className="text-red-400 mr-3 text-lg">&bull;</span>
                                <div>
                                    <strong className="text-white">Atraso na Informação:</strong> Clientes dependem de relatórios mensais ou trimestrais, que já estão defasados.
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="text-red-400 mr-3 text-lg">&bull;</span>
                                <div>
                                    <strong className="text-white">Sobrecarga de Atendimento:</strong> Equipes de contabilidade gastam tempo respondendo a perguntas repetitivas e de baixo valor.
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="text-red-400 mr-3 text-lg">&bull;</span>
                                <div>
                                    <strong className="text-white">Dificuldade na Proatividade:</strong> É desafiador oferecer insights financeiros proativos sem um monitoramento constante e automatizado.
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="text-red-400 mr-3 text-lg">&bull;</span>
                                <div>
                                    <strong className="text-white">Desconexão:</strong> Clientes se sentem distantes dos seus dados financeiros e do valor estratégico do contador.
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Solution Column */}
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                        <div className="flex items-center justify-center w-16 h-16 bg-cyan-500/20 text-cyan-400 rounded-full mb-6 mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white text-center mb-6">A Solução Contaflux IA</h3>
                        <ul className="space-y-4 text-slate-400 text-left">
                            <li className="flex items-start">
                                <span className="text-cyan-400 mr-3 text-lg">&bull;</span>
                                <div>
                                    <strong className="text-white">Dados em Tempo Real:</strong> Clientes acessam informações financeiras atualizadas instantaneamente através de um assistente de IA.
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="text-cyan-400 mr-3 text-lg">&bull;</span>
                                <div>
                                    <strong className="text-white">Atendimento Escalável:</strong> A IA lida com perguntas rotineiras, liberando sua equipe para tarefas de maior valor.
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="text-cyan-400 mr-3 text-lg">&bull;</span>
                                <div>
                                    <strong className="text-white">Insights Proativos:</strong> O sistema identifica tendências e oferece dicas valiosas antes que o cliente precise perguntar.
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="text-cyan-400 mr-3 text-lg">&bull;</span>
                                <div>
                                    <strong className="text-white">Conexão e Valor:</strong> Seu cliente se sente mais conectado e percebe o valor estratégico contínuo da sua contabilidade.
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProblemSolutionSection;