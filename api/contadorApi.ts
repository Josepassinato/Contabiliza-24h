

// api/contadorApi.ts

import { db } from '../firebase/config';
import { collection, getDocs, doc, addDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';

// --- Types ---
export type ConnectionType = 'api_key' | 'sync_agent' | 'generic_api';

export interface Client {
    id: string;
    name: string;
    email: string;
    contadorId: string;
    status: 'Ativo' | 'Pendente' | 'Inativo';
    createdAt: string; // ISO string
    financialData?: FinancialData | null;
}

export interface Platform {
    id: string;
    name: string;
    logo: string;
    connected: boolean;
    contadorId: string;
    connectionType: ConnectionType;
}

export interface FinancialData {
    month: string;
    revenue: number;
    expenses: number;
    topExpenseCategory: string;
    topExpenseValue: number;
}


// --- API Functions ---

const INITIAL_PLATFORMS: Omit<Platform, 'id' | 'contadorId'>[] = [
    { name: 'Domínio Sistemas', logo: 'https://seeklogo.com/images/D/dominio-sistemas-logo-BBE2C464DE-seeklogo.com.png', connected: false, connectionType: 'sync_agent' },
    { name: 'Conta Azul', logo: 'https://theme.zdassets.com/theme_assets/9339399/6579f15757913346452f33f67185061444f1240a.png', connected: true, connectionType: 'api_key' },
    { name: 'Omie', logo: 'https://assets-global.website-files.com/61fe607f35754982635a9f5c/61fe607f35754955c45a9fa1_omie-logo-2-500x281.png', connected: false, connectionType: 'api_key' },
    { name: 'QuickBooks', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Intuit_QuickBooks_logo.svg/2560px-Intuit_QuickBooks_logo.svg.png', connected: false, connectionType: 'api_key' },
    { name: 'Bling', logo: 'https://cdn.bling.com.br/bling-logos/bling-icon-100.png', connected: false, connectionType: 'api_key' },
    { name: 'Tiny ERP', logo: 'https://tiny.com.br/images/logo/tiny-symbol-blue.svg', connected: false, connectionType: 'api_key' },
    { name: 'Sage Brasil', logo: 'https://www.sage.com/pt-br/static-assets/images/sage_com_logo.svg', connected: false, connectionType: 'api_key' },
    { name: 'API Genérica', logo: 'https://cdn-icons-png.flaticon.com/512/2164/2164828.png', connected: false, connectionType: 'generic_api' },
];


/**
 * Fetches clients associated with a specific accountant.
 */
export const fetchClients = async (contadorId: string): Promise<Client[]> => {
    if (!db) return [];
    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, where('contadorId', '==', contadorId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
    } as Client));
};

/**
 * Fetches and potentially creates default platforms for a specific accountant.
 */
export const fetchPlatforms = async (contadorId: string): Promise<Platform[]> => {
    if (!db) return [];
    
    const platformsRef = collection(db, 'platforms');
    const q = query(platformsRef, where('contadorId', '==', contadorId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        // First-time setup: create default platforms and return them directly
        // This avoids a second database read, making the initial load faster.
        const createdPlatforms = await Promise.all(
            INITIAL_PLATFORMS.map(async (platformData) => {
                const docRef = await addDoc(platformsRef, { ...platformData, contadorId });
                return {
                    ...platformData,
                    id: docRef.id,
                    contadorId,
                } as Platform;
            })
        );
        return createdPlatforms;
    }
    
    const platforms = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Platform
    );

    return platforms;
};

/**
 * Creates a new client invitation.
 */
export const inviteClient = async (contadorId: string, name: string, email: string): Promise<Client | null> => {
     if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, 'clients'), {
            name,
            email,
            contadorId,
            status: 'Pendente',
            createdAt: serverTimestamp(),
        });
        
        const newClient: Client = {
            id: docRef.id,
            name,
            email,
            contadorId,
            status: 'Pendente',
            createdAt: new Date().toISOString(),
        };
        return newClient;
    } catch (error) {
        console.error("Error inviting client:", error);
        return null;
    }
};

/**
 * Updates a platform's connection status.
 */
export const updatePlatformConnection = async (contadorId: string, platformId: string, connected: boolean): Promise<void> => {
    if (!db) throw new Error("Database not configured");
    // Although contadorId is passed, we only need platformId to update the doc
    const platformRef = doc(db, 'platforms', platformId);
    await updateDoc(platformRef, { connected });
};

/**
 * Simulates syncing financial data for a client.
 * In a real app, this would fetch from an external API.
 */
export const syncFinancialData = async (client: Client): Promise<FinancialData> => {
    // Simulate API call latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate somewhat realistic mock data based on client name hash
    const nameHash = client.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseRevenue = 80000 + (nameHash % 50000);
    const revenue = baseRevenue + Math.floor(Math.random() * 20000) - 10000;
    const expenses = revenue * (0.65 + Math.random() * 0.2); // 65% to 85% of revenue
    const topExpenseValue = expenses * (0.3 + Math.random() * 0.2); // 30% to 50% of total expenses

    const expenseCategories = ['Fornecedores', 'Folha de Pagamento', 'Marketing', 'Aluguel', 'Impostos'];
    const topExpenseCategory = expenseCategories[nameHash % expenseCategories.length];
    
    return {
        month: 'Maio/2024',
        revenue: parseFloat(revenue.toFixed(2)),
        expenses: parseFloat(expenses.toFixed(2)),
        topExpenseCategory,
        topExpenseValue: parseFloat(topExpenseValue.toFixed(2)),
    };
};
