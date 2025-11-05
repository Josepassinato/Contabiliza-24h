import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut, 
    createUserWithEmailAndPassword,
    User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

type UserRole = 'contador' | 'gestor' | 'saas_admin';
type UserStatus = 'active' | 'pending';

export interface User {
    id: string; // Firebase Auth UID
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper para buscar o perfil do usuário no Firestore
const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    if (!db) return null;
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const data = userDoc.data();
        return {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: data.name,
            role: data.role,
            status: data.status,
        };
    } else {
        // Fallback para admin, se o e-mail corresponder e o documento não existir
        const adminEmail = process.env.REACT_APP_ADMIN_EMAIL || 'admin@contaflux.ia';
        if(firebaseUser.email === adminEmail) {
            return {
                id: firebaseUser.uid,
                email: adminEmail,
                name: 'Admin',
                role: 'saas_admin',
                status: 'active',
            }
        }
    }
    return null;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setIsLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userProfile = await fetchUserProfile(firebaseUser);
                setUser(userProfile);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        if (!auth) throw new Error("Firebase Auth não foi configurado.");
        await signInWithEmailAndPassword(auth, email, password);
    };
    
    const register = async (name: string, email: string, password: string) => {
        if (!auth || !db) throw new Error("Firebase não foi configurado.");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Create a corresponding user document in Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        await setDoc(userDocRef, {
            name: name,
            email: email,
            role: 'contador', // New users are always 'contador'
            status: 'pending',   // They need approval from the admin
            createdAt: serverTimestamp(),
        });
    };

    const logout = async () => {
        if (!auth) throw new Error("Firebase Auth não foi configurado.");
        await signOut(auth);
    };

    const value = {
        user,
        isLoggedIn: !isLoading && !!user,
        isLoading,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};