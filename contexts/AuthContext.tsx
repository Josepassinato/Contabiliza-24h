
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase/config';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { Client } from './ContadorContext';
import { demoCredentials } from '../firebase/credentials';

// --- Types ---
export type UserRole = 'contador' | 'gestor' | 'admin';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: 'active' | 'pending';
    clientDetails?: Client | null; // For 'gestor' role
}

interface AuthContextType {
    user: User | null;
    authLoading: boolean;
    pendingApproval: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (name: string, email: string, pass: string) => Promise<void>;
    registerAndActivateGestor: (name: string, email: string, pass: string, clientId: string) => Promise<void>;
    logout: () => Promise<void>;
    bypassLogin: (role: UserRole) => void;
}

// --- Context Definition ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [pendingApproval, setPendingApproval] = useState(false);

    useEffect(() => {
        if (!auth || !db) {
            setAuthLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            // FIX: Wrapped in try/catch/finally to gracefully handle offline errors
            // when fetching user data from Firestore after auth state changes.
            try {
                if (firebaseUser) {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data() as Omit<User, 'id'>;
                        
                        if (userData.status === 'pending') {
                            setPendingApproval(true);
                            setUser(null);
                        } else {
                            let clientDetails: Client | null = null;
                            if (userData.role === 'gestor' && userData.clientDetails) {
                               const clientRef = doc(db, 'clients', (userData.clientDetails as any).id);
                               const clientDoc = await getDoc(clientRef);
                               if(clientDoc.exists()) {
                                   clientDetails = {id: clientDoc.id, ...clientDoc.data()} as Client;
                               }
                            }
                            
                            setUser({ id: firebaseUser.uid, ...userData, clientDetails });
                            setPendingApproval(false);
                        }
                    } else {
                        // This case might happen if a user exists in Auth but not Firestore
                        setUser(null);
                    }
                } else {
                    setUser(null);
                    setPendingApproval(false);
                }
            } catch (error) {
                console.error("Failed to fetch user data, possibly offline:", error);
                // If we can't fetch user data, treat the user as logged out.
                setUser(null);
                setPendingApproval(false);
            } finally {
                setAuthLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => {
        if (!auth) throw new Error("Firebase Auth not configured");
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const logout = async () => {
        if (!auth) return;
        await signOut(auth);
    };
    
    const register = async (name: string, email: string, pass: string) => {
        if (!auth || !db) throw new Error("Firebase not configured");
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUser = userCredential.user;

        // Create user document in Firestore
        await setDoc(doc(db, 'users', newUser.uid), {
            name,
            email,
            role: 'contador',
            status: 'pending',
        });
        
        // Sign out user until admin approves
        await signOut(auth);
    };

    const registerAndActivateGestor = async (name: string, email: string, pass: string, clientId: string) => {
        if (!auth || !db) throw new Error("Firebase not configured");
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUser = userCredential.user;

        const clientRef = doc(db, 'clients', clientId);

        // Create user document in Firestore
        await setDoc(doc(db, 'users', newUser.uid), {
            name,
            email,
            role: 'gestor',
            status: 'active',
            clientDetails: {
                id: clientId,
                // store a reference or minimal data
            }
        });
        
        // Update client status to 'Ativo'
        await updateDoc(clientRef, {
            status: 'Ativo'
        });

        // Sign out user so they can log in fresh
        await signOut(auth);
    };

    const bypassLogin = (role: UserRole) => {
        setAuthLoading(true);
        const mockClient: Client = {
             id: 'client_123_mock',
             name: 'Padaria Pão Quente LTDA',
             email: 'gestor@paoquente.com',
             contadorId: 'contador_123_mock',
             status: 'Ativo',
             createdAt: new Date().toISOString(),
             financialData: {
                month: 'Maio/2024',
                revenue: 85000,
                expenses: 53310,
                topExpenseCategory: 'Fornecedores',
                topExpenseValue: 34000
            }
        };

        const mockUsers: Record<UserRole, User> = {
            contador: { id: 'contador_123_mock', email: demoCredentials.contadorEmail, name: 'Contabilidade Exemplo', role: 'contador', status: 'active' },
            gestor: { id: 'gestor_456_mock', email: 'gestor@paoquente.com', name: 'Gestor Pão Quente', role: 'gestor', status: 'active', clientDetails: mockClient },
            admin: { id: 'admin_789_mock', email: demoCredentials.adminEmail, name: 'Admin Contaflux', role: 'admin', status: 'active' },
        };
        setUser(mockUsers[role]);
        setPendingApproval(false);
        setAuthLoading(false);
    };

    const value = { user, authLoading, pendingApproval, login, register, registerAndActivateGestor, logout, bypassLogin };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- Custom Hook ---
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
