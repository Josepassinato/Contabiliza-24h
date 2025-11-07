
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
// FIX: Added file extension to import for module resolution.
import { User } from '../contexts/AuthContext.tsx';


// --- Types for SaaS Admin ---
// Re-using the User type from AuthContext as it's more comprehensive now.
export type Accountant = User & { clientCount?: number };

export interface Metric {
    name: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
}

// --- Mock Data for Metrics (Accountants are now fetched from Firestore) ---
const mockMetrics: Metric[] = [
    { name: 'Receita Mensal', value: 'R$ 12.450', change: '+5.2%', changeType: 'increase' },
    { name: 'Contas Pendentes', value: '1', change: '+1', changeType: 'increase' },
    { name: 'Contas Ativas', value: '132', change: '-1.1%', changeType: 'decrease' },
    { name: 'Taxa de Churn', value: '2.3%', change: '+0.5%', changeType: 'decrease' }, // increase in churn is bad
];

// --- Helper Functions ---

const simulateLatency = <T,>(data: T, delay: number = 700): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
};


// --- API Functions ---

export const fetchDashboardMetrics = async (): Promise<Metric[]> => {
    // In a real app, you would calculate these metrics, possibly with Cloud Functions.
    // For now, we return mock data but could enhance it to show real pending accounts count.
    return simulateLatency(mockMetrics);
};

/**
 * Fetches all users with the role 'contador' from Firestore.
 */
export const fetchAccountants = async (): Promise<Accountant[]> => {
    if (!db) return [];
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'contador'));
    const snapshot = await getDocs(q);
    
    const accountants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Accountant));

    // In a real app, you'd fetch client counts for each accountant.
    // This is a heavy operation, so we'll mock it for now.
    accountants.forEach(acc => {
        acc.clientCount = Math.floor(Math.random() * 50);
    });
    
    return simulateLatency(accountants);
};


/**
 * Updates a user's status in Firestore. Used by admin to approve accountants.
 * @param userId The ID of the user to update.
 * @param status The new status to set.
 */
export const updateUserStatus = async (userId: string, status: 'active' | 'pending'): Promise<void> => {
    if (!db) throw new Error("Database not configured");
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { status });
};
