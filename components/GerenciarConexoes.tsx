

import React, { useState } from 'react';
// FIX: Added file extension to import for module resolution.
import { useContador, Platform } from '../contexts/ContadorContext.tsx';
import { useNotifier } from '../contexts/NotificationContext';
import ConnectionModal from './ConnectionModal';

interface GerenciarConexoesProps {
    onBack: () => void;
}

const PlatformRow: React.FC<{ platform: Platform, onConfigure: (platform: Platform) => void }> = ({ platform, onConfigure }) => (
    <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg border border-slate-700">
        <div className="flex items-center gap-4">
            <img src={platform.logo} alt={`${platform.name} logo`} className="h-10 w-10 object-contain bg-white p-1 rounded-md" />
            <span className="font-semibold text-white">{platform.name}</span>
        </div>
        <div className="flex items-center gap-4">
            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${platform.connected ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-400'}`}>
                {platform.connected ? 'Ativa' : 'Inativa'}
            </span>
            <button
                onClick={() => onConfigure(platform)}
                className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
            >
                {platform.connected ? 'Verificar' : 'Configurar'}
            </button>
        </div>
    </div>
);


const GerenciarConexoes: React.FC<GerenciarConexoesProps> = ({ onBack }) => {
    const { platforms, isLoading, togglePlatformConnection } = useContador();
    const { addNotification } = useNotifier();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

    const handleConfigure = (platform: Platform) => {
        setSelectedPlatform(platform);
        setIsModalOpen(true);
    };

    const handleConnect = async (platformId: string, isConnecting: boolean) => {
         // This function now just toggles the state for demo purposes.
         // In a real app, it would save API keys etc.
        const platform = platforms.find(p => p.id === platformId);
        if (!platform) return;
        
        // We only toggle if the intention is to connect (isConnecting = true)
        // or disconnect (isConnecting = false)
        if (platform.connected !== isConnecting) {
             await togglePlatformConnection(platformId);
             const action = isConnecting ? 'conectada' : 'desconectada';
             addNotification(`Plataforma ${platform.name} ${action} com sucesso!`, 'success');
        }
        setIsModalOpen(false);
    };


    return (
        <>
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
                        <p className="text-slate-400 mt-2">
                            Conecte sistemas via Chave de API ou baixe nosso agente de sincronização para sistemas desktop.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-6">
                        {isLoading ? (
                            <p className="text-center text-slate-400">Carregando plataformas...</p>
                        ) : platforms.length === 0 ? (
                            <p className="text-center text-slate-400">Nenhuma plataforma encontrada.</p>
                        ) : (
                            platforms.map(platform => (
                                <PlatformRow key={platform.id} platform={platform} onConfigure={handleConfigure} />
                            ))
                        )}
                    </div>
                </div>
            </section>

            <ConnectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                platform={selectedPlatform}
                onConnect={handleConnect}
            />
        </>
    );
};

export default GerenciarConexoes;
