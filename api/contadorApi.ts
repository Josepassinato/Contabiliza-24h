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
    writeBatch
} from 'firebase/firestore';

// --- Types ---
export interface Client {
    id: string;
    name: string;
    email: string;
    status: 'Ativo' | 'Pendente' | 'Inativo';
    createdAt: any; // Can be Firebase Timestamp
    contadorId: string;
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


export const fetchClients = async (contadorId: string): Promise<Client[]> => {
    if (!db) return []; // Guard clause
    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, where('contadorId', '==', contadorId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
};

export const fetchPlatforms = async (contadorId: string): Promise<Platform[]> => {
    if (!db) return []; // Guard clause
    const platformsRef = collection(db, 'platforms');
    const q = query(platformsRef, where('contadorId', '==', contadorId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Platform));
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
    });
    return {
        id: newDoc.id,
        name,
        email,
        status: 'Pendente',
        createdAt: new Date().toISOString(), // Return a temporary date for immediate UI update
        contadorId,
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