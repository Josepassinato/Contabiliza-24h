
import React, { useState } from 'react';
import { useContador, Client } from '../contexts/ContadorContext';
import { useNotifier } from '../contexts/NotificationContext';

interface GerenciarClientesProps {
    onBack: () => void;
    onOpenInvite: () => void;
}

const GerenciarClientes: React.FC<GerenciarClientesProps> = ({ onBack, onOpenInvite }) => {
    const { clients, isLoading, inviteClient, setPendingInviteClient } = useContador();
    const { addNotification } = useNotifier();
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientEmail, setNewClientEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClientName || !newClientEmail) {
            addNotification('Por favor, preencha nome e email.', 'error');
            return;
        }
        setIsInviting(true);
        try {
            await inviteClient(newClientName, newClientEmail);
            addNotification(`Convite enviado para ${newClientName}!`, 'success');
            setNewClientName('');
            setNewClientEmail('');
            setInviteModalOpen(false);
        } catch (error) {
            addNotification('Falha ao enviar convite.', 'error');
        } finally {
            setIsInviting(false);
        }
    };
    
    const handleOpenOnboarding = (client: Client) => {
        if (client.status === 'Pendente') {
            setPendingInviteClient(client);
            onOpenInvite();
        }
    };
    
    const StatusBadge: React.FC<{ status: 'Ativo' | 'Pendente' | 'Inativo' }> = ({ status }) => {
        const colors = {
            Ativo: 'bg-green-500/20 text-green-400',
            Pendente: 'bg-yellow-500/20 text-yellow-400',
            Inativo: 'bg-slate-500/20 text-slate-400',
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>{status}</span>;
    };

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
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-extrabold text-white">Gerenciar Clientes</h1>
                            <p className="text-slate-400 mt-2">Visualize e gerencie os clientes da sua contabilidade.</p>
                        </div>
                        <button onClick={() => setInviteModalOpen(true)} className="bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors duration-300">
                            Convidar Cliente
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Nome</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Última Atividade</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                                {isLoading ? (
                                    <tr><td colSpan={4} className="text-center py-8 text-slate-400">Carregando clientes...</td></tr>
                                ) : (
                                    clients.map(client => (
                                        <tr key={client.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-white">{client.name}</div>
                                                <div className="text-sm text-slate-400">{client.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={client.status} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(client.lastActivity).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {client.status === 'Pendente' && (
                                                    <button onClick={() => handleOpenOnboarding(client)} className="text-cyan-400 hover:text-cyan-300">Abrir Onboarding</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isInviteModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                        <h2 className="text-xl font-bold text-white mb-4">Convidar Novo Cliente</h2>
                        <form onSubmit={handleInviteSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="clientName" className="block text-sm font-medium text-slate-300">Nome do Cliente</label>
                                    <input type="text" id="clientName" value={newClientName} onChange={e => setNewClientName(e.target.value)} className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                                </div>
                                <div>
                                    <label htmlFor="clientEmail" className="block text-sm font-medium text-slate-300">Email do Cliente</label>
                                    <input type="email" id="clientEmail" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-4">
                                <button type="button" onClick={() => setInviteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">Cancelar</button>
                                <button type="submit" disabled={isInviting} className="px-4 py-2 text-sm font-medium text-white bg-cyan-500 rounded-md hover:bg-cyan-600 disabled:opacity-50">
                                    {isInviting ? 'Enviando...' : 'Enviar Convite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default GerenciarClientes;
