import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase/client.ts';
import { useNotifier } from '../contexts/NotificationContext.tsx';
import { User } from '../contexts/AuthContext.tsx';

// Expand the user type for our needs here
type Accountant = User & { clientCount: number };

const statusClasses = {
    active: 'bg-green-500/20 text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
};


const SaaSAdminDashboard: React.FC = () => {
    const { addNotification } = useNotifier();
    const [accountants, setAccountants] = useState<Accountant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            // Fetch all users with the role 'contador'
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .in('role', ['contador', 'admin']); // Fetch both to see admins too if needed
            
            if (error) throw error;

            // In a real app with many clients, this would be a performance bottleneck.
            // A better approach is to use a PostgreSQL function (RPC) or maintain a client count
            // on the users table that gets updated with triggers.
            // For this demo, we fetch counts client-side.
            const accountantsWithCounts = await Promise.all(
                data.map(async (acc) => {
                    const { count, error: countError } = await supabase
                        .from('clients')
                        .select('*', { count: 'exact', head: true })
                        .eq('contador_id', acc.id);
                    
                    return {
                        ...acc,
                        role: acc.role as 'contador' | 'admin',
                        status: acc.status as 'active' | 'pending',
                        clientCount: countError ? 0 : count || 0,
                    };
                })
            );
            
            setAccountants(accountantsWithCounts.sort((a, b) => a.status === 'pending' ? -1 : 1));

        } catch (error) {
            console.error("Failed to load SaaS admin data from Supabase", error);
            addNotification("Falha ao carregar dados do painel.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);
    
    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleApprove = async (userId: string) => {
        if (!isSupabaseConfigured) return;
        try {
            const { error } = await supabase
                .from('users')
                .update({ status: 'active' })
                .eq('id', userId);
            
            if (error) throw error;

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
                                                {acc.status === 'pending' && acc.role === 'contador' && (
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