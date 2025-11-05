import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, User } from './contexts/AuthContext';
import { useContador, Client } from './contexts/ContadorContext';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import Dashboard from './components/Dashboard';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import ClienteDashboard from './components/ClienteDashboard';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SaaSAdminDashboard from './pages/SaaSAdminDashboard';
import GestorOnboardingPage from './pages/GestorOnboardingPage';

// Firebase config check
import { isFirebaseConfigured } from './firebase/config';
import FirebaseConfigError from './components/FirebaseConfigError';

// A simple enum for app pages/views
enum Page {
    Landing,
    Login,
    Register,
    Dashboard,
    Onboarding,
}

const App: React.FC = () => {
    const { user, isLoggedIn, isLoading, logout } = useAuth();
    const { pendingInviteClient, setPendingInviteClient } = useContador();
    
    // State for navigation and modals
    const [currentPage, setCurrentPage] = useState<Page>(Page.Landing);
    const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
    const [voiceAssistantClientContext, setVoiceAssistantClientContext] = useState<Client | null>(null);
    const [isDemoVoiceAssistant, setIsDemoVoiceAssistant] = useState(false);

    // Effect to handle routing based on auth state
    useEffect(() => {
        if (!isLoading) {
            if (isLoggedIn) {
                // If a gestor was just invited and is now logged in, they should see their dashboard.
                if (user?.role === 'gestor') {
                    setPendingInviteClient(null); // Clear any pending client since they are now logged in
                }
                setCurrentPage(Page.Dashboard);
            } else {
                // If there's a pending invite, show the onboarding page.
                // Otherwise, show the landing page.
                if (pendingInviteClient) {
                    setCurrentPage(Page.Onboarding);
                } else {
                    setCurrentPage(Page.Landing);
                }
            }
        }
    }, [isLoggedIn, isLoading, user, pendingInviteClient, setPendingInviteClient]);
    
    // Voice Assistant controls
    const handleOpenVoiceAssistant = useCallback((context?: Client | null, isDemo: boolean = false) => {
        setVoiceAssistantClientContext(context || null);
        setIsDemoVoiceAssistant(isDemo);
        setIsVoiceAssistantOpen(true);
    }, []);

    const handleCloseVoiceAssistant = () => {
        setIsVoiceAssistantOpen(false);
        setVoiceAssistantClientContext(null);
        setIsDemoVoiceAssistant(false);
    };

    const handleLogout = async () => {
        await logout();
        setCurrentPage(Page.Landing);
    };

    // Render loading state
    if (isLoading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando...</div>;
    }
    
    // Render Firebase config error if not configured
    if (!isFirebaseConfigured) {
        return <FirebaseConfigError />;
    }

    // Render based on auth status and current page
    const renderContent = () => {
        if (!isLoggedIn) {
            switch (currentPage) {
                case Page.Login:
                    return <LoginPage onNavigateToRegister={() => setCurrentPage(Page.Register)} />;
                case Page.Register:
                    return <RegisterPage onNavigateToLogin={() => setCurrentPage(Page.Login)} />;
                case Page.Onboarding:
                     // This case is for a new gestor who isn't logged in yet but has a link
                     if (pendingInviteClient) {
                         return <GestorOnboardingPage client={pendingInviteClient} onComplete={() => {
                             setPendingInviteClient(null);
                             setCurrentPage(Page.Login);
                         }} />
                     }
                    // Fallback to landing if no pending client
                    setCurrentPage(Page.Landing);
                    return null; // Will re-render with landing page
                default: // Landing page
                    return (
                        <>
                            <Header isLoggedIn={false} onLogout={() => {}} />
                            <main>
                                <HeroSection onLogin={() => setCurrentPage(Page.Login)} onOpenVoiceAssistant={() => handleOpenVoiceAssistant(null, true)} />
                                <FeaturesSection />
                            </main>
                            <Footer />
                        </>
                    );
            }
        }
        
        // --- User is Logged In ---
        if (user) {
            if (user.status === 'pending') {
                return (
                     <div className="min-h-screen bg-slate-900 text-slate-300 flex items-center justify-center p-4">
                        <div className="w-full max-w-md text-center bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
                            <h1 className="text-2xl font-bold text-yellow-400 mb-4">Aguardando Aprovação</h1>
                            <p className="text-slate-400 mb-6">Sua conta foi criada e está aguardando aprovação do administrador. Você será notificado por e-mail quando seu acesso for liberado.</p>
                            <button onClick={handleLogout} className="w-full bg-cyan-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-cyan-600">
                                Sair
                            </button>
                        </div>
                    </div>
                );
            }

            switch (user.role) {
                case 'saas_admin':
                    return <SaaSAdminDashboard />;
                case 'contador':
                    return <Dashboard onOpenVoiceAssistant={handleOpenVoiceAssistant} />;
                case 'gestor':
                    // We can find the client data from the contador context if needed, but for now, we assume gestor doesn't need to pass a specific client object to the assistant.
                    return <ClienteDashboard onOpenVoiceAssistant={() => handleOpenVoiceAssistant(null, false)} />;
                default:
                    return <div>Função de usuário desconhecida.</div>;
            }
        }
        
        // Fallback if something goes wrong
        return <LoginPage onNavigateToRegister={() => setCurrentPage(Page.Register)} />;
    };

    return (
        <div className="bg-slate-900 text-slate-200 min-h-screen font-sans">
            {isLoggedIn && user?.status === 'active' && <Header isLoggedIn={true} onLogout={handleLogout} />}
            {renderContent()}
            <VoiceAssistantModal 
                isOpen={isVoiceAssistantOpen} 
                onClose={handleCloseVoiceAssistant} 
                user={user}
                isDemo={isDemoVoiceAssistant}
                clientContext={voiceAssistantClientContext}
            />
        </div>
    );
};

export default App;
