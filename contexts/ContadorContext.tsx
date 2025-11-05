import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import * as contadorApi from '../api/contadorApi';
import { useNotifier } from './NotificationContext';
import { useAuth } from './AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, getDocs, limit, startAfter, orderBy, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

// Re-export types from API
export type { Client, Platform } from '../api/contadorApi';
import { Client, Platform } from '../api/contadorApi';

const CLIENTS_PAGE_SIZE = 15;

// --- Context Interface ---
interface ContadorContextType {
    clients: Client[];
    platforms: Platform[];
    isLoading: boolean;
    isFetchingMore: boolean;
    hasMoreClients: boolean;
    loadMoreClients: () => void;
    pendingInviteClient: Client | null;
    setPendingInviteClient: (client: Client | null) => void;
    inviteClient: (name: string, email: string) => Promise<Client | null>;
    updateClientStatus: (clientId: string, status: Client['status']) => Promise<void>;
    togglePlatformConnection: (platformId: string) => Promise<void>;
}

// --- Context Definition ---
const ContadorContext = createContext<ContadorContextType | undefined>(undefined);

// --- Provider Component ---
export const ContadorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Pagination state
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasMoreClients, setHasMoreClients] = useState(false);
    const [lastClientDoc, setLastClientDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

    const [pendingInviteClient, setPendingInviteClient] = useState<Client | null>(null);
    const { addNotification } = useNotifier();
    const { user } = useAuth();

    const fetchInitialClients = useCallback(async (userId: string) => {
        if (!db) return;
        setIsLoading(true);
        try {
            const clientsQuery = query(
                collection(db, "clients"), 
                where("contadorId", "==", userId),
                orderBy("createdAt", "desc"),
                limit(CLIENTS_PAGE_SIZE)
            );
            const documentSnapshots = await getDocs(clientsQuery);
            
            const clientsData = documentSnapshots.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
            })) as Client[];

            setClients(clientsData);
            setLastClientDoc(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setHasMoreClients(documentSnapshots.docs.length === CLIENTS_PAGE_SIZE);
        } catch (error) {
            console.error("Error fetching initial clients:", error);
            addNotification("Erro ao carregar clientes.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);


    const loadMoreClients = useCallback(async () => {
        if (!db || !user || !lastClientDoc || isFetchingMore) return;
        setIsFetchingMore(true);
        try {
            const clientsQuery = query(
                collection(db, "clients"),
                where("contadorId", "==", user.id),
                orderBy("createdAt", "desc"),
                startAfter(lastClientDoc),
                limit(CLIENTS_PAGE_SIZE)
            );

            const documentSnapshots = await getDocs(clientsQuery);
            const newClientsData = documentSnapshots.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
            })) as Client[];

            setClients(prevClients => [...prevClients, ...newClientsData]);
            setLastClientDoc(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setHasMoreClients(documentSnapshots.docs.length === CLIENTS_PAGE_SIZE);
        } catch (error) {
            console.error("Error fetching more clients:", error);
            addNotification("Erro ao carregar mais clientes.", "error");
        } finally {
            setIsFetchingMore(false);
        }
    }, [user, lastClientDoc, isFetchingMore, addNotification]);


    // Initial data load and real-time listener for platforms
    useEffect(() => {
        if (user && user.role === 'contador' && db) {
            // Seed platforms if it's the first time
            contadorApi.checkAndSeedPlatforms(user.id);

            // Fetch initial batch of clients
            fetchInitialClients(user.id);
            
            // Real-time listener for Platforms (usually a smaller dataset)
            const platformsQuery = query(collection(db, "platforms"), where("contadorId", "==", user.id));
            const unsubscribePlatforms = onSnapshot(platformsQuery, (querySnapshot) => {
                const platformsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Platform[];
                setPlatforms(platformsData);
            }, (error) => {
                console.error("Error fetching platforms:", error);
                addNotification("Erro ao carregar plataformas.", "error");
            });

            // Cleanup listener
            return () => {
                unsubscribePlatforms();
            };
        } else {
            // Not a contador, not logged in, or db not ready. Clear data.
            setClients([]);
            setPlatforms([]);
            setLastClientDoc(null);
            setHasMoreClients(false);
            setIsLoading(false);
        }
    }, [user, addNotification, fetchInitialClients]);
    
    const inviteClient = useCallback(async (name: string, email: string) => {
        if (!user || user.role !== 'contador') {
            addNotification('Você precisa ser um contador para convidar clientes.', 'error');
            return null;
        }
        try {
            const newClient = await contadorApi.addClient(name, email, user.id);
            // Add new client to the top of the list for immediate feedback
            setClients(prev => [newClient, ...prev]);
            setPendingInviteClient(newClient); 
            addNotification(`Convite enviado para ${name}!`, 'success');
            return newClient;
        } catch (error) {
            console.error("Failed to invite client", error);
            addNotification('Falha ao convidar cliente.', 'error');
            return null;
        }
    }, [user, addNotification]);

    const updateClientStatus = useCallback(async (clientId: string, status: Client['status']) => {
        try {
            await contadorApi.updateClientStatus(clientId, status);
            // Update local state for immediate feedback
            setClients(prev => prev.map(c => c.id === clientId ? {...c, status} : c));
            addNotification(`Status do cliente atualizado.`, 'success');
        } catch (error) {
            console.error("Failed to update client status", error);
            addNotification('Falha ao atualizar status do cliente.', 'error');
        }
    }, [addNotification]);

    const togglePlatformConnection = useCallback(async (platformId: string) => {
        const platform = platforms.find(p => p.id === platformId);
        if (!platform) return;

        try {
            await contadorApi.togglePlatformConnection(platformId, platform.connected);
             addNotification(
                `${platform.name} ${platform.connected ? 'desconectado' : 'conectado'} com sucesso!`,
                'success'
            );
            // Real-time listener will handle the state update
        } catch (error) {
            console.error("Failed to toggle platform connection", error);
            addNotification('Falha ao atualizar conexão.', 'error');
        }
    }, [platforms, addNotification]);

    const value: ContadorContextType = {
        clients,
        platforms,
        isLoading,
        isFetchingMore,
        hasMoreClients,
        loadMoreClients,
        pendingInviteClient,
        setPendingInviteClient,
        inviteClient,
        updateClientStatus,
        togglePlatformConnection,
    };

    return (
        <ContadorContext.Provider value={value}>
            {children}
        </ContadorContext.Provider>
    );
};

// --- Custom Hook ---
export const useContador = (): ContadorContextType => {
    const context = useContext(ContadorContext);
    if (context === undefined) {
        throw new Error('useContador must be used within a ContadorProvider');
    }
    return context;
};
