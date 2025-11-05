
import React, { useState } from 'react';
import GerenciarClientes from './GerenciarClientes';
import GerenciarConexoes from './GerenciarConexoes';
import Configuracoes from './Configuracoes';
import { useContador } from '../contexts/ContadorContext';
import VoiceAssistantModal from './VoiceAssistantModal'; // Import the new component

interface DashboardProps {
    onShowOnboarding: () => void;
    onOpenVoiceAssistant: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onShowOnboarding, onOpenVoiceAssistant }) => {
    const [activeComponent, setActiveComponent] = useState<'main' | 'clientes' | 'conexoes' | 'configuracoes'>('main');
    const { clients, platforms, isLoading } = useContador();

    const renderActiveComponent = () => {
        switch (activeComponent) {
            case 'clientes':
                return <GerenciarClientes onBack={() => setActiveComponent('main')} onOpenInvite={onShowOnboarding} />;
            case 'conexoes':
                return <GerenciarConexoes onBack={() => setActiveComponent('main')} />;
            case 'configuracoes':
                return <Configuracoes onBack={() => setActiveComponent('main')} />;
            default:
                return null;
        }
    };

    if (activeComponent !== 'main') {
        return renderActiveComponent();
    }

    const activeClients = clients.filter(c => c.status === 'Ativo').length;
    const connectedPlatforms = platforms.filter(p => p.connected).length;

    const ClientIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    const ConnectionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    const ArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>;

    return (
        <div className="container mx-auto px-6 py-16">
            <div className="mb-12">
                <h1 className="text-4xl font-extrabold text-white">Painel de Controle</h1>
                <p className="text-slate-400 mt-2">Bem-vindo de volta! Gerencie seus clientes e conexões aqui.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-500/50 transition-colors duration-300">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                           <ClientIcon />
                            <h2 className="text-xl font-bold text-white">Clientes</h2>
                        </div>
                        {isLoading ? <p className="text-slate-400">Carregando...</p> : <p className="text-5xl font-bold text-white">{activeClients}<span className="text-xl text-slate-400">/{clients.length} Ativos</span></p>}
                    </div>
                    <button onClick={() => setActiveComponent('clientes')} className="mt-6 text-cyan-400 font-semibold text-left flex items-center gap-2 hover:text-cyan-300">
                        Gerenciar Clientes
                        <ArrowIcon />
                    </button>
                </div>

                 <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-500/50 transition-colors duration-300">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                           <ConnectionIcon />
                            <h2 className="text-xl font-bold text-white">Conexões</h2>
                        </div>
                        {isLoading ? <p className="text-slate-400">Carregando...</p> : <p className="text-5xl font-bold text-white">{connectedPlatforms}<span className="text-xl text-slate-400">/{platforms.length} Ativas</span></p>}
                    </div>
                    <button onClick={() => setActiveComponent('conexoes')} className="mt-6 text-cyan-400 font-semibold text-left flex items-center gap-2 hover:text-cyan-300">
                        Gerenciar Conexões
                        <ArrowIcon />
                    </button>
                </div>
                
                 <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-500/50 transition-colors duration-300">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                           <SettingsIcon />
                            <h2 className="text-xl font-bold text-white">Configurações</h2>
                        </div>
                        <p className="text-slate-400">Ajuste as preferências da sua conta e integrações.</p>
                    </div>
                    <button onClick={() => setActiveComponent('configuracoes')} className="mt-6 text-cyan-400 font-semibold text-left flex items-center gap-2 hover:text-cyan-300">
                        Acessar Configurações
                        <ArrowIcon />
                    </button>
                </div>
            </div>

            {/* Floating Action Button for Voice Assistant */}
            <button
                onClick={onOpenVoiceAssistant}
                className="fixed bottom-8 right-8 bg-cyan-500 text-white w-16 h-16 rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:bg-cyan-600 transition-all duration-300 ease-in-out transform hover:scale-110 animate-pulse"
                aria-label="Iniciar assistente de voz"
                title="Iniciar assistente de voz"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </button>
        </div>
    );
};

export default Dashboard;