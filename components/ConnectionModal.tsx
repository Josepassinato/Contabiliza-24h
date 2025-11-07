

import React, { useState } from 'react';
// FIX: Added file extension to import for module resolution.
import { Platform } from '../contexts/ContadorContext.tsx';

interface ConnectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    platform: Platform | null;
    onConnect: (platformId: string, connect: boolean) => void;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose, platform, onConnect }) => {
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    if (!isOpen || !platform) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsConnecting(true);
        // In a real app, this would validate and save the keys
        await new Promise(resolve => setTimeout(resolve, 1000));
        onConnect(platform.id, true);
        setIsConnecting(false);
    };
    
    const handleDisconnect = () => {
        onConnect(platform.id, false);
    };

    const renderContent = () => {
        switch (platform.connectionType) {
            case 'api_key':
                return (
                    <form onSubmit={handleSubmit}>
                        <main className="p-6 space-y-4">
                            <p className="text-slate-400 text-sm">
                                Acesse seu painel na <span className="font-bold">{platform.name}</span>, vá para a seção de 'Integrações' ou 'API', gere suas credenciais e cole-as abaixo.
                            </p>
                            <div>
                                <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-1">App Key / Client ID</label>
                                <input
                                    type="text"
                                    id="apiKey"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Cole a primeira chave aqui"
                                    required
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                             <div>
                                <label htmlFor="apiSecret" className="block text-sm font-medium text-slate-300 mb-1">App Secret / Client Secret</label>
                                <input
                                    type="password"
                                    id="apiSecret"
                                    value={apiSecret}
                                    onChange={(e) => setApiSecret(e.target.value)}
                                    placeholder="Cole a segunda chave aqui"
                                    required
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                        </main>
                        <footer className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-between items-center">
                             {platform.connected && (
                                <button type="button" onClick={handleDisconnect} className="text-red-400 hover:text-red-300 text-sm font-semibold">
                                    Desconectar
                                </button>
                            )}
                            <div className="flex-grow flex justify-end gap-3">
                                <button type="button" onClick={onClose} className="bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-500">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isConnecting || !apiKey || !apiSecret || platform.connected}
                                    className="bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600 disabled:opacity-50"
                                >
                                    {platform.connected ? 'Conectado' : (isConnecting ? 'Conectando...' : 'Conectar')}
                                </button>
                            </div>
                        </footer>
                    </form>
                );
            case 'sync_agent':
                 return (
                    <div>
                         <main className="p-6 space-y-4">
                            <p className="text-slate-400 text-sm">
                                 Sistemas desktop como o <span className="font-bold">{platform.name}</span> precisam de um Agente de Sincronização para enviar dados para a nuvem de forma segura.
                            </p>
                            <div className="bg-slate-900/50 p-4 rounded-lg">
                                <h4 className="font-bold text-white">Instruções</h4>
                                <ol className="list-decimal list-inside text-slate-300 text-sm mt-2 space-y-1">
                                    <li>Clique no botão abaixo para baixar o agente.</li>
                                    <li>Instale no computador ou servidor onde o Domínio está.</li>
                                    <li>Siga os passos do instalador para autenticar sua conta.</li>
                                    <li>O agente irá sincronizar os dados automaticamente.</li>
                                </ol>
                            </div>
                        </main>
                        <footer className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-between items-center">
                            {platform.connected && (
                                <button type="button" onClick={handleDisconnect} className="text-red-400 hover:text-red-300 text-sm font-semibold">
                                    Desconectar
                                </button>
                            )}
                            <div className="flex-grow flex justify-end gap-3">
                                <button type="button" onClick={onClose} className="bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-500">
                                    Fechar
                                </button>
                                <a href="#" download className="bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600">
                                    Baixar Agente
                                </a>
                            </div>
                        </footer>
                    </div>
                 );
            case 'generic_api':
                return (
                    <div>
                         <main className="p-6 space-y-4">
                            <p className="text-slate-400 text-sm">
                                Use nossa API Genérica para enviar dados de qualquer sistema que não esteja listado.
                            </p>
                            <p className="text-slate-300 text-sm">
                                Ideal para sistemas de ERP locais ou customizados. Sua equipe de TI pode seguir nossa documentação para configurar o envio de dados via requisições POST seguras.
                            </p>
                         </main>
                        <footer className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3">
                             <button type="button" onClick={onClose} className="bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-500">
                                Fechar
                            </button>
                            <button onClick={() => alert("Navegando para a documentação...")} className="bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600">
                                Ver Documentação
                            </button>
                        </footer>
                    </div>
                );
        }
    };


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md flex flex-col shadow-lg">
                <header className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                         <img src={platform.logo} alt={`${platform.name} logo`} className="h-8 w-8 object-contain bg-white p-1 rounded-md" />
                         <h2 className="text-lg font-bold text-white">Configurar {platform.name}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">&times;</button>
                </header>
                {renderContent()}
            </div>
        </div>
    );
};

export default ConnectionModal;
