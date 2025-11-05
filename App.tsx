
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import HeroSection from './components/HeroSection';
import GestorOnboardingPage from './pages/GestorOnboardingPage';
import { useContador } from './contexts/ContadorContext';
import { useNotifier } from './contexts/NotificationContext';
import ProblemSolutionSection from './components/ProblemSolutionSection';
import FeaturesSection from './components/FeaturesSection';
import TechStackSection from './components/TechStackSection';
import RoadmapSection from './components/RoadmapSection';
import ArchitectureSection from './components/ArchitectureSection';

const App: React.FC = () => {
    // For demonstration, we'll simulate a login state.
    // In a real app, this would come from a context, auth service, etc.
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    // Onboarding state
    const [showOnboarding, setShowOnboarding] = useState(false);
    const { pendingInviteClient, setPendingInviteClient, updateClientStatus } = useContador();
    const { addNotification } = useNotifier();

    // Check for pending client to start onboarding automatically
    useEffect(() => {
        if (pendingInviteClient) {
            setShowOnboarding(true);
        }
    }, [pendingInviteClient]);

    const handleLogin = () => {
        // Here you would have your login logic
        setIsLoggedIn(true);
        addNotification('Login bem-sucedido!', 'success');
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
    };

    const handleShowOnboarding = () => {
        setShowOnboarding(true);
    };

    const handleOnboardingComplete = async () => {
        if (pendingInviteClient) {
            await updateClientStatus(pendingInviteClient.id, 'Ativo');
            addNotification(`${pendingInviteClient.name} agora está ativo!`, 'success');
        }
        setShowOnboarding(false);
        setPendingInviteClient(null);
    };

    if (showOnboarding && pendingInviteClient) {
        return <GestorOnboardingPage client={pendingInviteClient} onComplete={handleOnboardingComplete} />;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-300 font-sans">
            <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
            <main className="flex-grow">
                {isLoggedIn ? (
                    <Dashboard onShowOnboarding={handleShowOnboarding} />
                ) : (
                    <>
                        <HeroSection onLogin={handleLogin} />
                        <ProblemSolutionSection />
                        <FeaturesSection />
                        <ArchitectureSection />
                        <TechStackSection />
                        <RoadmapSection />
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default App;
