
import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext.tsx';
import { ContadorProvider, Client } from './contexts/ContadorContext.tsx';
import { isSupabaseConfigured } from './supabase/client.ts';

// Pages
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import GestorOnboardingPage from './pages/GestorOnboardingPage.tsx';
import SaaSAdminDashboard from './pages/SaaSAdminDashboard.tsx';

// Components
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import Dashboard from './components/Dashboard.tsx';
import ClienteDashboard from './components/ClienteDashboard.tsx';
import VoiceAssistantModal from './components/VoiceAssistantModal.tsx';
import SupabaseConfigError from './components/SupabaseConfigError.tsx';
import HeroSection from './components/HeroSection.tsx';
import FeaturesSection from './components/FeaturesSection.tsx';
import ProblemSolutionSection from './components/ProblemSolutionSection.tsx';

type AppView = 'landing' | 'login' | 'register' | 'onboarding';

const App: React.FC = () => {
    if (!isSupabaseConfigured) {
        return <SupabaseConfigError />;
    }

    const { user, authLoading, pendingApproval, logout } = useAuth();
    const [view, setView] = useState<AppView>('landing');
    const [onboardingClient, setOnboardingClient] = useState<Client | null>(null);

    const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
    const [assistantClientContext, setAssistantClientContext] = useState<Client | null>(null);
    const [isDemo, setIsDemo] = useState(false);

    // This effect will check for an onboarding token in the URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            try {
                // In a real app, you would verify the token against a backend.
                // Here, we'll just decode it for the demo.
                const clientData = JSON.parse(atob(token));
                if (clientData.id && clientData.email) {
                    setOnboardingClient(clientData);
                    setView('onboarding');
                }
            } catch (error) {
                console.error("Invalid onboarding token:", error);
            }
        }
    }, []);

    const openVoiceAssistant = (client?: Client) => {
        setIsDemo(false);
        setAssistantClientContext(client || null);
        setIsVoiceAssistantOpen(true);
    };

    const openDemoVoiceAssistant = () => {
        setIsDemo(true);
        setAssistantClientContext(null);
        setIsVoiceAssistantOpen(true);
    };
    
    if (authLoading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando...</div>;
    }

    if (!user) {
        switch (view) {
            case 'login':
                return <LoginPage onNavigateToRegister={() => setView('register')} />;
            case 'register':
                return <RegisterPage onNavigateToLogin={() => setView('login')} />;
            case 'onboarding':
                 if (onboardingClient) {
                    return <GestorOnboardingPage client={onboardingClient} onComplete={() => {
                        setOnboardingClient(null);
                        setView('login');
                    }} />;
                 }
                 // fallthrough to login if no client
                 setView('login');
                 return null;
            case 'landing':
            default:
                return (
                    <div className="bg-slate-900 text-slate-300">
                        <Header onLogin={() => setView('login')} />
                        <main>
                            <HeroSection onLogin={() => setView('login')} onOpenVoiceAssistant={openDemoVoiceAssistant} />
                            <ProblemSolutionSection />
                            <FeaturesSection />
                        </main>
                        <Footer />
                        <VoiceAssistantModal 
                            isOpen={isVoiceAssistantOpen} 
                            onClose={() => setIsVoiceAssistantOpen(false)} 
                            user={null} 
                            isDemo={isDemo} 
                            clientContext={assistantClientContext} 
                        />
                    </div>
                );
        }
    }

    if (pendingApproval) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
                    <h1 className="text-2xl font-bold text-yellow-400 mb-4">Aguardando Aprovação</h1>
                    <p className="text-slate-400 mb-6">Sua conta foi criada e está aguardando a aprovação do administrador. Você será notificado por e-mail.</p>
                     <button
                        onClick={logout}
                        className="bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors duration-300 text-sm"
                    >
                        Sair
                    </button>
                </div>
            </div>
        );
    }
    
    const renderDashboard = () => {
        switch (user.role) {
            case 'contador':
                return (
                    <ContadorProvider>
                        <Dashboard onOpenVoiceAssistant={openVoiceAssistant} />
                    </ContadorProvider>
                );
            case 'gestor':
                 return <ClienteDashboard onOpenVoiceAssistant={() => openVoiceAssistant(user.clientDetails)} />;
            case 'admin':
                return <SaaSAdminDashboard />;
            default:
                return <div>Papel de usuário desconhecido.</div>;
        }
    };
    
    return (
        <div className="bg-slate-900 text-slate-300 min-h-screen">
            <Header onLogin={() => setView('login')} />
            {renderDashboard()}
            <Footer />
            <VoiceAssistantModal 
                isOpen={isVoiceAssistantOpen} 
                onClose={() => setIsVoiceAssistantOpen(false)} 
                user={user}
                isDemo={isDemo}
                clientContext={assistantClientContext}
            />
        </div>
    );
};

export default App;