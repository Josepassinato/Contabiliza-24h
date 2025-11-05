import React, { useState } from 'react';
import { useContador, Platform } from '../contexts/ContadorContext';
import { useNotifier } from '../contexts/NotificationContext';

interface GerenciarConexoesProps {
    onBack: () => void;
}

const PlatformCard: React.FC<{ platform: Platform; onToggle: (id: string) => Promise<void> }> = ({ platform, onToggle }) => {
    const [isToggling, setIsToggling] = useState(false);

    const handleToggle = async () => {
        setIsToggling(true);
        await onToggle(platform.id);
        setIsToggling(false);
    };

    return (
        <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="flex items-center gap-4">
                <img src={platform.logo} alt={`${platform.name} logo`} className="h-10 w-10 object-contain bg-white p-1 rounded-md" />
                <span className="font-semibold text-white">{platform.name}</span>
            </div>
            <button
                onClick={handleToggle}
                disabled={isToggling}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 disabled:opacity-50 ${platform.connected ? 'bg-cyan-500' : 'bg-slate-600'}`}
            >
                <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${platform.connected ? 'translate-x-6' : 'translate-x-1'}`}
                />
            </button>
        </div>
    );
};


const GerenciarConexoes: React.FC<GerenciarConexoesProps> = ({ onBack }) => {
    const { platforms, togglePlatformConnection, isLoading } = useContador();
    const { addNotification } = useNotifier();

    const handleToggleConnection = async (platformId: string) => {
        const platform = platforms.find(p => p.id === platformId);
        if (!platform) return;

        try {
            await togglePlatformConnection(platformId);
            addNotification(
                `${platform.name} ${platform.connected ? 'desconectado' : 'conectado'} com sucesso!`,
                'success'
            );
        } catch (error) {
            addNotification('Falha ao atualizar conexão.', 'error');
        }
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
                    <h1 className="text-4xl font-extrabold text-white">Gerenciar Conexões</h1>
                    <p className="text-slate-400 mt-2">Conecte e desconecte as plataformas de dados dos seus clientes.</p>
                </div>

                <div className="max-w-2xl mx-auto space-y-4">
                    {isLoading ? (
                        <p className="text-center text-slate-400">Carregando conexões...</p>
                    ) : (
                        platforms.map(platform => (
                            <PlatformCard key={platform.id} platform={platform} onToggle={handleToggleConnection} />
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default GerenciarConexoes;
