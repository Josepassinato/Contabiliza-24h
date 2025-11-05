
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import * as api from '../api/contadorApi';

// --- Types ---
export interface Client {
    id: string;
    name: string;
    email: string;
    status: 'Ativo' | 'Pendente' | 'Inativo';
    lastActivity: string;
}

export interface Platform {
    id: string;
    name: string;
    logo: string;
    connected: boolean;
}


interface ContadorContextType {
    clients: Client[];
    platforms: Platform[];
    isLoading: boolean;
    pendingInviteClient: Client | null;
    fetchClients: () => Promise<void>;
    fetchPlatforms: () => Promise<void>;
    updateClientStatus: (clientId: string, status: Client['status']) => Promise<void>;
    togglePlatformConnection: (platformId: string) => Promise<void>;
    inviteClient: (name: string, email: string) => Promise<Client | undefined>;
    setPendingInviteClient: (client: Client | null) => void;
}

const ContadorContext = createContext<ContadorContextType | undefined>(undefined);

export const ContadorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingInviteClient, setPendingInviteClient] = useState<Client | null>(null);

    const fetchClients = useCallback(async () => {
        try {
            const data = await api.fetchClients();
            setClients(data);
        } catch (error) {
            console.error("Failed to fetch clients", error);
        }
    }, []);

    const fetchPlatforms = useCallback(async () => {
        try {
            const data = await api.fetchPlatforms();
            setPlatforms(data);
        } catch (error) {
            console.error("Failed to fetch platforms", error);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([fetchClients(), fetchPlatforms()]);
            setIsLoading(false);
        };
        loadData();
    }, [fetchClients, fetchPlatforms]);

    const updateClientStatus = async (clientId: string, status: Client['status']) => {
        await api.updateClient(clientId, { status });
        setClients(prevClients => 
            prevClients.map(c => c.id === clientId ? { ...c, status } : c)
        );
    };
    
    const inviteClient = async (name: string, email: string) => {
        try {
            const newClient = await api.addClient(name, email);
            setClients(prev => [...prev, newClient]);
            return newClient;
        } catch(error) {
            console.error("Failed to invite client", error);
        }
    };

    const togglePlatformConnection = async (platformId: string) => {
        const platform = platforms.find(p => p.id === platformId);
        if (!platform) return;
        
        await api.updatePlatformConnection(platformId, !platform.connected);
        setPlatforms(prevPlatforms => 
            prevPlatforms.map(p => p.id === platformId ? { ...p, connected: !p.connected } : p)
        );
    };

    const value = {
        clients,
        platforms,
        isLoading,
        pendingInviteClient,
        fetchClients,
        fetchPlatforms,
        updateClientStatus,
        togglePlatformConnection,
        inviteClient,
        setPendingInviteClient,
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
