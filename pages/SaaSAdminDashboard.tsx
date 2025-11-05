import React, { useState, useEffect, useCallback } from 'react';
import * as saasAdminApi from '../api/saasAdminApi';
import { useAuth } from '../contexts/AuthContext';
import { useNotifier } from '../contexts/NotificationContext';

const statusClasses = {
    active: 'bg-green-500/20 text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
};


const SaaSAdminDashboard: React.FC = () => {
    const { logout } = useAuth();
    const { addNotification } = useNotifier();
    const [metrics, setMetrics] = useState<saasAdminApi.Metric[]>([]);
    const [accountants, setAccountants] = useState<saasAdminApi.Accountant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [metricsData, accountantsData] = await Promise.all([
                saasAdminApi.fetchDashboardMetrics(),
                saasAdminApi.fetchAccountants(),
            ]);
            setMetrics(metricsData);
            setAccountants(accountantsData.sort((a, b) => a.status === 'pending' ? -1 : 1)); // Show pending first
        } catch (error) {
            console.error("Failed to load SaaS admin data", error);
            addNotification("Falha ao carregar dados do painel.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);
    
    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleApprove = async (userId: string) => {
        try {
            await saasAdminApi.updateUserStatus(userId, 'active');
            addNotification("Contador aprovado com sucesso!", "success");
            loadData(); // Refresh data
        } catch (error) {
            console.error("Failed to approve accountant", error);
            addNotification("Erro ao aprovar contador.", "error");
        }
    };

    return (
        <div className="bg-slate-900 text-slate-300">
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
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Clientes</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Ações</th>
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
                                             <td className="px-6 py-4 whitespace-nowrap">
                                                 <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[acc.status]}`}>
                                                    {acc.status === 'pending' ? 'Pendente' : 'Ativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-center">{acc.clientCount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                {acc.status === 'pending' && (
                                                    <button 
                                                        onClick={() => handleApprove(acc.id)}
                                                        className="bg-green-500 text-white font-semibold px-3 py-1 text-xs rounded-md hover:bg-green-600 transition-colors"
                                                    >
                                                        Aprovar
                                                    </button>
                                                )}
                                            </td>
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