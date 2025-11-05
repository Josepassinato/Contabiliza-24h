
import { Client, Platform } from '../contexts/ContadorContext';

// --- Mock Data ---

const initialPlatforms: Platform[] = [
    { id: 'p1', name: 'Sistema ERP Local', logo: 'https://img.icons8.com/fluency/48/database.png', connected: true },
    { id: 'p2', name: 'Banco Inter Empresas', logo: 'https://img.icons8.com/color/48/inter-butt.png', connected: false },
    { id: 'p3', name: 'Conta Azul', logo: 'https://img.icons8.com/color/48/contaazul.png', connected: true },
    { id: 'p4', name: 'Omie', logo: 'https://img.icons8.com/dusk/64/o.png', connected: false },
];

const initialClients: Client[] = [
    { id: 'c1', name: 'Padaria Pão Quente', email: 'contato@paoquente.com', status: 'Ativo', lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'c2', name: 'Oficina do Zé', email: 'ze@oficina.com', status: 'Ativo', lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'c3', name: 'Mercado da Esquina', email: 'compras@mercadoesquina.com.br', status: 'Pendente', lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'c4', name: 'Consultoria Tech', email: 'ceo@techconsult.io', status: 'Inativo', lastActivity: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
];

const LS_KEYS = {
    CLIENTS: 'contabiliza_clients',
    PLATFORMS: 'contabiliza_platforms',
};

// --- Helper Functions ---

const simulateLatency = <T,>(data: T, delay: number = 500): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

const initializeLocalStorage = () => {
    if (!localStorage.getItem(LS_KEYS.CLIENTS)) {
        localStorage.setItem(LS_KEYS.CLIENTS, JSON.stringify(initialClients));
    }
    if (!localStorage.getItem(LS_KEYS.PLATFORMS)) {
        localStorage.setItem(LS_KEYS.PLATFORMS, JSON.stringify(initialPlatforms));
    }
};

initializeLocalStorage();

const getClientsFromStorage = (): Client[] => JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
const getPlatformsFromStorage = (): Platform[] => JSON.parse(localStorage.getItem(LS_KEYS.PLATFORMS) || '[]');

// --- API Functions ---

export const fetchClients = async (): Promise<Client[]> => {
    const clients = getClientsFromStorage();
    return simulateLatency(clients);
};

export const fetchPlatforms = async (): Promise<Platform[]> => {
    const platforms = getPlatformsFromStorage();
    return simulateLatency(platforms);
};

export const addClient = async (name: string, email: string): Promise<Client> => {
    const clients = getClientsFromStorage();
    const newClient: Client = {
        id: `c${Date.now()}`,
        name,
        email,
        status: 'Pendente',
        lastActivity: new Date().toISOString(),
    };
    const updatedClients = [...clients, newClient];
    localStorage.setItem(LS_KEYS.CLIENTS, JSON.stringify(updatedClients));
    return simulateLatency(newClient);
};

export const updateClient = async (clientId: string, updates: Partial<Client>): Promise<Client> => {
    let clients = getClientsFromStorage();
    let clientToUpdate: Client | undefined;
    clients = clients.map(c => {
        if (c.id === clientId) {
            clientToUpdate = { ...c, ...updates };
            return clientToUpdate;
        }
        return c;
    });
    if (!clientToUpdate) throw new Error('Client not found');

    localStorage.setItem(LS_KEYS.CLIENTS, JSON.stringify(clients));
    return simulateLatency(clientToUpdate);
};

export const updatePlatformConnection = async (platformId: string, connected: boolean): Promise<Platform> => {
    let platforms = getPlatformsFromStorage();
    let platformToUpdate: Platform | undefined;
    platforms = platforms.map(p => {
        if (p.id === platformId) {
            platformToUpdate = { ...p, connected };
            return platformToUpdate;
        }
        return p;
    });
    if (!platformToUpdate) throw new Error('Platform not found');

    localStorage.setItem(LS_KEYS.PLATFORMS, JSON.stringify(platforms));
    return simulateLatency(platformToUpdate);
};
