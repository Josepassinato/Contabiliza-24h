
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as contadorApi from '../api/contadorApi';
import { useAuth } from './AuthContext';

// Re-export types from API module
export type { Client, Platform, FinancialData } from '../api/contadorApi';

interface ContadorContextType {
    clients: contadorApi.Client[];
    platforms: contadorApi.Platform[];
    isLoading: boolean;
    inviteClient: (name: string, email: string) => Promise<contadorApi.Client | null>;
    togglePlatformConnection: (platformId: string) => Promise<void>;
}

const ContadorContext = createContext<ContadorContextType | undefined>(undefined);

// --- Mock Data for Demo/Bypass Mode ---
const MOCK_PLATFORMS: contadorApi.Platform[] = [
    { id: 'p1', name: 'Domínio Sistemas', logo: 'https://seeklogo.com/images/D/dominio-sistemas-logo-BBE2C464DE-seeklogo.com.png', connected: false, connectionType: 'sync_agent', contadorId: 'contador_123_mock' },
    { id: 'p2', name: 'Conta Azul', logo: 'https://theme.zdassets.com/theme_assets/9339399/6579f15757913346452f33f67185061444f1240a.png', connected: true, connectionType: 'api_key', contadorId: 'contador_123_mock' },
    { id: 'p3', name: 'Omie', logo: 'https://assets-global.website-files.com/61fe607f35754982635a9f5c/61fe607f35754955c45a9fa1_omie-logo-2-500x281.png', connected: false, connectionType: 'api_key', contadorId: 'contador_123_mock' },
    { id: 'p4', name: 'QuickBooks', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Intuit_QuickBooks_logo.svg/2560px-Intuit_QuickBooks_logo.svg.png', connected: false, connectionType: 'api_key', contadorId: 'contador_123_mock' },
];

const MOCK_CLIENTS: contadorApi.Client[] = [
    { id: 'c1', name: 'Padaria Pão Quente LTDA', email: 'gestor@paoquente.com', status: 'Ativo', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), contadorId: 'contador_123_mock' },
    { id: 'c2', name: 'Oficina do Zé Reparos', email: 'ze@oficina.com', status: 'Pendente', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), contadorId: 'contador_123_mock' },
    { id: 'c3', name: 'Mercado da Esquina', email: 'compras@mercado.com', status: 'Ativo', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(), contadorId: 'contador_123_mock' },
];


export const ContadorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [clients, setClients] = useState<contadorApi.Client[]>([]);
    const [platforms, setPlatforms] = useState<contadorApi.Platform[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadData = useCallback(async (contadorId: string) => {
        setIsLoading(true);
        // FIX: Detects if the user is a "mock" user from the bypass login system.
        // If so, it loads pre-defined mock data instead of calling Firestore.
        // This creates a stable, fast, and isolated "demo mode".
        if (contadorId.endsWith('_mock')) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
            setClients(MOCK_CLIENTS);
            setPlatforms(MOCK_PLATFORMS);
            setIsLoading(false);
            return;
        }

        // Original logic for real, authenticated users.
        try {
            const [clientsData, platformsData] = await Promise.all([
                contadorApi.fetchClients(contadorId),
                contadorApi.fetchPlatforms(contadorId)
            ]);
            setClients(clientsData);
            setPlatforms(platformsData);
        } catch (error) {
            console.error("Failed to load contador data:", error);
            setClients([]);
            setPlatforms([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user && user.role === 'contador') {
            loadData(user.id);
        } else {
            setClients([]);
            setPlatforms([]);
            setIsLoading(false);
        }
    }, [user, loadData]);

    const inviteClient = async (name: string, email: string): Promise<contadorApi.Client | null> => {
        if (!user || user.role !== 'contador') return null;
        
        // Handle mock user in demo mode
        if (user.id.endsWith('_mock')) {
            const newClient: contadorApi.Client = {
                id: `mock_client_${Date.now()}`,
                name,
                email,
                contadorId: user.id,
                status: 'Pendente',
                createdAt: new Date().toISOString(),
            };
            setClients(prev => [...prev, newClient].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            return newClient;
        }
        
        // Original logic for real users
        const newClient = await contadorApi.inviteClient(user.id, name, email);
        if (newClient) {
            setClients(prev => [...prev, newClient].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
        return newClient;
    };
    
    const togglePlatformConnection = async (platformId: string) => {
        if (!user || user.role !== 'contador') return;

        // Handle mock user in demo mode
        if (user.id.endsWith('_mock')) {
            setPlatforms(prev => 
                prev.map(p => p.id === platformId ? { ...p, connected: !p.connected } : p)
            );
            return;
        }

        // Original logic for real users
        const platform = platforms.find(p => p.id === platformId);
        if (!platform) return;

        const newConnectedState = !platform.connected;
        await contadorApi.updatePlatformConnection(user.id, platformId, newConnectedState);
        setPlatforms(prev => 
            prev.map(p => p.id === platformId ? { ...p, connected: newConnectedState } : p)
        );
    };


    const value = {
        clients,
        platforms,
        isLoading,
        inviteClient,
        togglePlatformConnection,
    };

    return (
        <ContadorContext.Provider value={value}>
            {children}
        </ContadorContext.Provider>
    );
};

export const useContador = (): ContadorContextType => {
    const context = useContext(ContadorContext);
    if (context === undefined) {
        throw new Error('useContador must be used within a ContadorProvider');
    }
    return context;
};
