import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import GestorOnboardingPage from './pages/GestorOnboardingPage';
import LoginPage from './pages/LoginPage';
import ClienteDashboard from './components/ClienteDashboard';
import { useContador } from './contexts/ContadorContext';
import { useAuth } from './contexts/AuthContext';
import { isFirebaseConfigured } from './firebase/config';
import FirebaseConfigError from './components/FirebaseConfigError';
import SaaSAdminDashboard from './pages/SaaSAdminDashboard';

type AppState = 'landing' | 'login' | 'dashboard' | 'onboarding';

const App: React.FC = () => {
    const { isLoggedIn, user, logout, isLoading } = useAuth();
    const { pendingInviteClient, setPendingInviteClient, updateClientStatus } = useContador();
    const [appState, setAppState] = useState<AppState>('landing');
    const [isVoiceModalOpen, setVoiceModalOpen] = useState(false);
    const [voiceModalMode, setVoiceModalMode] = useState<'demo' | 'real'>('demo');

    useEffect(() => {
        if (isLoggedIn) {
            setAppState('dashboard');
        } else {
            setAppState('landing');
        }
    }, [isLoggedIn]);

    const handleOpenVoiceAssistant = (mode: 'demo' | 'real') => {
        setVoiceModalMode(mode);
        setVoiceModalOpen(true);
    };

    const handleCompleteOnboarding = () => {
        if (pendingInviteClient) {
            updateClientStatus(pendingInviteClient.id, 'Ativo');
        }
        setPendingInviteClient(null);
        setAppState('dashboard'); // Or maybe redirect to a specific client dashboard
    };
    
    const handleShowOnboarding = () => {
        if (pendingInviteClient) {
            setAppState('onboarding');
        }
    };
    
    const handleLogout = () => {
        logout();
        setAppState('landing');
    };

    if (!isFirebaseConfigured) {
        return <FirebaseConfigError />;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <svg className="w-12 h-12 text-cyan-400 animate-spin mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-white text-xl mt-4">Carregando...</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if (appState === 'onboarding' && pendingInviteClient) {
            return <GestorOnboardingPage client={pendingInviteClient} onComplete={handleCompleteOnboarding} />;
        }
        
        if (!isLoggedIn) {
            if (appState === 'login') {
                return <LoginPage />;
            }
            return (
                <>
                    <Header isLoggedIn={false} onLogout={() => {}} />
                    <main>
                        <HeroSection 
                            onLogin={() => setAppState('login')} 
                            onOpenVoiceAssistant={() => handleOpenVoiceAssistant('demo')} 
                        />
                    </main>
                    <Footer />
                </>
            );
        }

        // User is logged in
        return (
             <>
                <Header isLoggedIn={true} onLogout={handleLogout} />
                <main>
                    {user?.role === 'saas_admin' ? (
                        <SaaSAdminDashboard />
                    ) : user?.role === 'contador' ? (
                        <Dashboard 
                            onShowOnboarding={handleShowOnboarding} 
                            onOpenVoiceAssistant={() => handleOpenVoiceAssistant('real')}
                        />
                    ) : (
                        <ClienteDashboard 
                            onOpenVoiceAssistant={() => handleOpenVoiceAssistant('real')}
                        />
                    )}
                </main>
            </>
        );
    };

    return (
        <>
            {renderContent()}
            {isVoiceModalOpen && (
                <VoiceAssistantModal
                    isOpen={isVoiceModalOpen}
                    onClose={() => setVoiceModalOpen(false)}
                    user={user}
                    isDemo={voiceModalMode === 'demo'}
                />
            )}
        </>
    );
};

export default App;
