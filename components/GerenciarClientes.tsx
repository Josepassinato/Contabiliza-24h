
import React, { useState } from 'react';
// FIX: Added file extension to import for module resolution.
import { useContador, Client } from '../contexts/ContadorContext.tsx';

interface GerenciarClientesProps {
    onBack: () => void;
    onOpenInvite: () => void;
    onSelectClient: (client: Client) => void;
}

const statusClasses = {
    Ativo: 'bg-green-500/20 text-green-400',
    Pendente: 'bg-yellow-500/20 text-yellow-400',
    Inativo: 'bg-slate-600/50 text-slate-400',
};

const ClientRow: React.FC<{ client: Client, onSelect: (client: Client) => void }> = ({ client, onSelect }) => (
    <tr className="hover:bg-slate-700/50 transition-colors duration-200">
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-white">{client.name}</div>
            <div className="text-sm text-slate-400">{client.email}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
             <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[client.status]}`}>
                {client.status}
            </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
            {new Date(client.createdAt).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button onClick={() => onSelect(client)} className="text-cyan-400 hover:text-cyan-300">Detalhes</button>
        </td>
    </tr>
);

const InviteClientForm: React.FC<{ onInviteSent: () => void }> = ({ onInviteSent }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const { inviteClient } = useContador();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) return;

        setIsInviting(true);
        const newClient = await inviteClient(name, email);
        setIsInviting(false);

        if (newClient) {
            setName('');
            setEmail('');
            onInviteSent();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Convidar Novo Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="clientName" className="block text-sm font-medium text-slate-300 mb-1">Nome da Empresa</label>
                    <input
                        type="text"
                        id="clientName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Padaria Pão Quente"
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="clientEmail" className="block text-sm font-medium text-slate-300 mb-1">Email do Gestor</label>
                    <input
                        type="email"
                        id="clientEmail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: gestor@paoquente.com"
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                    />
                </div>
            </div>
             <button
                type="submit"
                disabled={isInviting}
                className="w-full md:w-auto bg-cyan-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-cyan-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isInviting ? 'Enviando...' : 'Enviar Convite e Configurar'}
            </button>
        </form>
    );
};

const GerenciarClientes: React.FC<GerenciarClientesProps> = ({ onBack, onOpenInvite, onSelectClient }) => {
    const { clients, isLoading } = useContador();

    return (
         <section className="py-16">
            <div className="container mx-auto px-6">
                 <div className="mb-8">
                    <button onClick={onBack} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Voltar ao Painel
                    </button>
                    <h1 className="text-4xl font-extrabold text-white">Gerenciar Clientes</h1>
                    <p className="text-slate-400 mt-2">Veja a lista dos seus clientes e envie novos convites.</p>
                </div>

                <div className="mb-12">
                    <InviteClientForm onInviteSent={onOpenInvite} />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-6">Lista de Clientes</h2>
                 <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Cliente</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Desde</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-slate-700">
                                {isLoading && clients.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-8 text-slate-400">Carregando clientes...</td></tr>
                                ) : clients.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-8 text-slate-400">Nenhum cliente encontrado. Convide um novo cliente acima.</td></tr>
                                ) : (
                                    clients.map(client => <ClientRow key={client.id} client={client} onSelect={onSelectClient} />)
                                )}
                            </tbody>
                        </table>
                    </div>
                 </div>
            </div>
        </section>
    );
};

export default GerenciarClientes;
