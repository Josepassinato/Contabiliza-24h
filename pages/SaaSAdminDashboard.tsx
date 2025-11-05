
import React, { useState, useEffect } from 'react';
import * as saasAdminApi from '../api/saasAdminApi';

const SaaSAdminDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<saasAdminApi.Metric[]>([]);
    const [accountants, setAccountants] = useState<saasAdminApi.Accountant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [metricsData, accountantsData] = await Promise.all([
                    saasAdminApi.fetchDashboardMetrics(),
                    saasAdminApi.fetchAccountants(),
                ]);
                setMetrics(metricsData);
                setAccountants(accountantsData);
            } catch (error) {
                console.error("Failed to load SaaS admin data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-300">
             <header className="sticky top-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-slate-700/50">
              <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                   <svg className="w-8 h-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                   </svg>
                  <h1 className="text-2xl font-bold text-white">
                    Contaflux <span className="text-cyan-400">IA</span> <span className="text-sm font-light text-slate-400">Admin</span>
                  </h1>
                </div>
                 <button className="bg-red-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-300">
                    Sair
                </button>
              </nav>
            </header>
            <main className="container mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold text-white mb-8">Painel do Administrador SaaS</h1>
                
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                         <div key={i} className="bg-slate-800/50 p-6 rounded-2xl animate-pulse"><div className="h-24 bg-slate-700 rounded"></div></div>
                    )) : metrics.map(metric => (
                        <div key={metric.name} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                            <p className="text-sm text-slate-400">{metric.name}</p>
                            <p className="text-3xl font-bold text-white mt-2">{metric.value}</p>
                            <p className={`text-sm mt-1 ${metric.changeType === 'increase' ? 'text-green-400' : 'text-red-400'}`}>
                                {metric.change}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Accountants Table */}
                <h2 className="text-2xl font-bold text-white mb-6">Contabilidades Cadastradas</h2>
                 <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Nome</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Plano</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Clientes</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Data de Cadastro</th>
                                </tr>
                            </thead>
                             <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                                {isLoading ? (
                                    <tr><td colSpan={4} className="text-center py-8 text-slate-400">Carregando...</td></tr>
                                ) : (
                                    accountants.map(acc => (
                                        <tr key={acc.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-white">{acc.name}</div>
                                                <div className="text-sm text-slate-400">{acc.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{acc.plan}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{acc.clientCount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(acc.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SaaSAdminDashboard;