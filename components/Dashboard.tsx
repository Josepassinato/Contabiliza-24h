import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useContador, Client } from '../contexts/ContadorContext';

// Import sub-components/pages for the dashboard
import GerenciarClientes from './GerenciarClientes';
import GerenciarConexoes from './GerenciarConexoes';
import Configuracoes from './Configuracoes';
import ClientDetailPage from '../pages/ClientDetailPage';
import GuidesPage from '../pages/GuidesPage';
import ApiConnectionGuidePage from '../pages/ApiConnectionGuidePage';
import ClientOnboardingGuidePage from '../pages/ClientOnboardingGuidePage';


// A simple type for dashboard views
type DashboardView = 'overview' | 'clientes' | 'conexoes' | 'configuracoes' | 'cliente_detalhe' | 'guides' | 'guide_api' | 'guide_onboarding';

const Dashboard: React.FC<{ onOpenVoiceAssistant: (client: Client) => void; }> = ({ onOpenVoiceAssistant }) => {
    const { user } = useAuth();
    const { clients, platforms, isLoading } = useContador();
    const [currentView, setCurrentView] = useState<DashboardView>('overview');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setCurrentView('cliente_detalhe');
    };

    const navigateToGuide = (guide: string) => {
        if (guide === 'api_connection_guide') {
            setCurrentView('guide_api');
        } else if (guide === 'client_onboarding_guide') {
            setCurrentView('guide_onboarding');
        }
    }

    const renderView = () => {
        switch (currentView) {
            case 'clientes':
                return <GerenciarClientes onBack={() => setCurrentView('overview')} onSelectClient={handleSelectClient} onOpenInvite={() => { /* maybe open a modal or navigate */ }} />;
            case 'conexoes':
                return <GerenciarConexoes onBack={() => setCurrentView('overview')} />;
            case 'configuracoes':
                return <Configuracoes onBack={() => setCurrentView('overview')} />;
            case 'cliente_detalhe':
                if (selectedClient) {
                    return <ClientDetailPage client={selectedClient} onBack={() => setCurrentView('clientes')} onOpenVoiceAssistant={onOpenVoiceAssistant} />;
                }
                // Fallback if no client is selected
                setCurrentView('clientes');
                return null;
            case 'guides':
                return <GuidesPage onBack={() => setCurrentView('overview')} onNavigate={navigateToGuide} />;
            case 'guide_api':
                return <ApiConnectionGuidePage onBack={() => setCurrentView('guides')} />;
            case 'guide_onboarding':
                 return <ClientOnboardingGuidePage onBack={() => setCurrentView('guides')} />;
            case 'overview':
            default:
                return (
                    <section className="py-16">
                        <div className="container mx-auto px-6">
                            <h1 className="text-4xl font-extrabold text-white">Painel do Contador</h1>
                            <p className="text-slate-400 mt-2">Bem-vindo(a) de volta, {user?.name.split(' ')[0]}!</p>
                            
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                                <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                                    <h3 className="text-slate-400 text-sm font-medium">Total de Clientes</h3>
                                    <p className="text-3xl font-bold text-white mt-2">{isLoading ? '...' : clients.length}</p>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                                    <h3 className="text-slate-400 text-sm font-medium">Conexões Ativas</h3>
                                    <p className="text-3xl font-bold text-white mt-2">{isLoading ? '...' : platforms.filter(p => p.connected).length}</p>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                                    <h3 className="text-slate-400 text-sm font-medium">Convites Pendentes</h3>
                                    <p className="text-3xl font-bold text-white mt-2">{isLoading ? '...' : clients.filter(c => c.status === 'Pendente').length}</p>
                                </div>
                            </div>

                            {/* Navigation Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                                <Card title="Gerenciar Clientes" description="Adicione, visualize e gerencie seus clientes." onClick={() => setCurrentView('clientes')} />
                                <Card title="Gerenciar Conexões" description="Conecte e desconecte as plataformas de dados." onClick={() => setCurrentView('conexoes')} />
                                <Card title="Configurações" description="Ajuste as preferências da sua conta." onClick={() => setCurrentView('configuracoes')} />
                                <Card title="Guias de Ajuda" description="Aprenda a conectar plataformas e usar o sistema." onClick={() => setCurrentView('guides')} />
                            </div>
                        </div>
                    </section>
                );
        }
    };

    return <main>{renderView()}</main>;
};

// Helper component for navigation cards
const Card: React.FC<{ title: string; description: string; onClick: () => void }> = ({ title, description, onClick }) => (
    <button onClick={onClick} className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl text-left hover:bg-slate-800 hover:border-cyan-500/50 transition-all duration-300">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-slate-400 mt-2 text-sm">{description}</p>
    </button>
);


export default Dashboard;
