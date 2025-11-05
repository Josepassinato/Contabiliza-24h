import { db } from '../firebase/config';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    updateDoc, 
    doc, 
    serverTimestamp,
    writeBatch,
    setDoc
} from 'firebase/firestore';

// --- Types ---

// Represents financial data synced from an external platform
export interface FinancialData {
    month: string;
    revenue: number;
    expenses: number;
    topExpenseCategory: string;
    topExpenseValue: number;
}

export interface Client {
    id: string;
    name:string;
    email: string;
    status: 'Ativo' | 'Pendente' | 'Inativo';
    createdAt: any; // Can be Firebase Timestamp
    contadorId: string;
    financialData?: FinancialData | null; // Optional synced data
}

export interface Platform {
    id: string;
    name: string;
    logo: string; // URL to logo
    connected: boolean;
    contadorId: string;
}

// --- Default Data for Seeding ---
const defaultPlatforms = [
    { name: 'ERP Local (desktop)', logo: 'https://cdn-icons-png.flaticon.com/512/2305/2305885.png', connected: true },
    { name: 'ContaAzul', logo: 'https://pbs.twimg.com/profile_images/1491135894165213192/pU9POk1K_400x400.jpg', connected: true },
    { name: 'Omie', logo: 'https://play-lh.googleusercontent.com/AEa2xFhAb5l-h3-5D702D9s_4Zf-WVEs35tpr0sE2xUflQ-3Q72i_4j_v821-39Eun0', connected: false },
    { name: 'QuickBooks', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Intuit_QuickBooks_logo.svg/1200px-Intuit_QuickBooks_logo.svg.png', connected: false },
];


// --- MOCK FINANCIAL DATA ---
const mockFinancialApi = (clientName: string): Promise<FinancialData> => {
    // This function simulates calling an external API like ContaAzul.
    // In a real application, this would be a Firebase Cloud Function.
    console.log(`Simulating API call for ${clientName}...`);
    const revenue = Math.floor(Math.random() * (150000 - 30000 + 1)) + 30000;
    const expenses = Math.floor(revenue * (Math.random() * (0.8 - 0.5) + 0.5));
    const categories = ['Fornecedores', 'Aluguel', 'Marketing', 'Folha de Pagamento'];
    const topCategory = categories[Math.floor(Math.random() * categories.length)];
    
    const data: FinancialData = {
        month: 'Maio/2024',
        revenue,
        expenses,
        topExpenseCategory: topCategory,
        topExpenseValue: Math.floor(expenses * (Math.random() * (0.5 - 0.3) + 0.3)),
    };
    return new Promise(resolve => setTimeout(() => resolve(data), 1500));
};


// --- API Functions for Firestore ---

/**
 * Checks if a contador has any platforms, and if not, seeds their account with the default ones.
 * This is crucial for onboarding new accountants.
 * @param contadorId The ID of the logged-in accountant.
 */
export const checkAndSeedPlatforms = async (contadorId: string): Promise<void> => {
    if (!db) return; // Guard clause
    const platformsRef = collection(db, 'platforms');
    const q = query(platformsRef, where('contadorId', '==', contadorId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        console.log(`No platforms found for contador ${contadorId}. Seeding default platforms.`);
        const batch = writeBatch(db);
        defaultPlatforms.forEach(platform => {
            const newPlatRef = doc(collection(db, 'platforms'));
            batch.set(newPlatRef, { ...platform, contadorId });
        });
        await batch.commit();
    }
};

/**
 * SIMULATION of a Cloud Function that would connect to a third-party API,
 * fetch financial data, and store it in our Firestore.
 * @param client The client object.
 */
export const syncFinancialData = async (client: Client): Promise<FinancialData> => {
    if (!db) throw new Error("Database not configured");
    
    // 1. (REAL SCENARIO) Call a Cloud Function with client credentials.
    // const result = await functions.httpsCallable('syncContaAzul')({ clientId: client.id });
    
    // 2. (SIMULATION) Call our mock API.
    const data = await mockFinancialApi(client.name);

    // 3. Store the synced data in a subcollection or on the client document itself.
    // For simplicity, we'll store it on the client document.
    const clientRef = doc(db, 'clients', client.id);
    await updateDoc(clientRef, { financialData: data });

    return data;
};

/**
 * Fetches the synced financial data for a specific client.
 * @param clientId The ID of the client.
 */
export const fetchFinancialData = async (clientId: string): Promise<FinancialData | null> => {
    // This function is for demonstration. In the main app, we pass the client object
    // which may already contain the data, reducing reads.
    if (!db) return null;
    // In a real app, you would fetch from the subcollection.
    // For now, we assume it's on the client doc, but this illustrates the separation.
    // This function isn't used in the current flow but is good practice to have.
    return null; 
};


export const addClient = async (name: string, email: string, contadorId: string): Promise<Client> => {
    if (!db) throw new Error("Database not configured"); // Throw error as we need to return a client
    const clientsRef = collection(db, 'clients');
    const newDoc = await addDoc(clientsRef, {
        name,
        email,
        status: 'Pendente',
        createdAt: serverTimestamp(),
        contadorId,
        financialData: null, // Initialize with no data
    });
    return {
        id: newDoc.id,
        name,
        email,
        status: 'Pendente',
        createdAt: new Date().toISOString(), // Return a temporary date for immediate UI update
        contadorId,
        financialData: null,
    };
};

export const updateClientStatus = async (clientId: string, status: Client['status']): Promise<void> => {
    if (!db) return; // Guard clause
    const clientRef = doc(db, 'clients', clientId);
    await updateDoc(clientRef, { status });
};

export const togglePlatformConnection = async (platformId: string, currentStatus: boolean): Promise<void> => {
    if (!db) return; // Guard clause
    const platformRef = doc(db, 'platforms', platformId);
    await updateDoc(platformRef, { connected: !currentStatus });
};