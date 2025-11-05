import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { auth } from '../firebase/config';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut, 
    User as FirebaseUser 
} from 'firebase/auth';

type UserRole = 'contador' | 'gestor' | 'saas_admin';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper para determinar o nome e o perfil do usuário a partir do e-mail
const getUserProfile = (firebaseUser: FirebaseUser): Omit<User, 'id'> => {
    const email = firebaseUser.email || '';
    
    // Lê e-mails dos perfis das variáveis de ambiente, com fallbacks para demonstração.
    const contadorEmail = process.env.REACT_APP_CONTADOR_EMAIL || 'contador@contaflux.ia';
    const gestorEmail = process.env.REACT_APP_GESTOR_EMAIL || 'gestor@paoquente.com';
    const adminEmail = process.env.REACT_APP_ADMIN_EMAIL || 'admin@contaflux.ia';

    if (email === adminEmail) {
        return { name: 'Admin', email, role: 'saas_admin' };
    }
    if (email === contadorEmail) {
        return { name: 'Contador Exemplo', email, role: 'contador' };
    }
    if (email === gestorEmail) {
        return { name: 'Gestor Pão Quente', email, role: 'gestor' };
    }

    // Fallback padrão. Em um app real, a role viria de Custom Claims.
    return { name: firebaseUser.displayName || 'Usuário', email, role: 'gestor' };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Para lidar com a verificação de autenticação inicial

    useEffect(() => {
        // Se o auth não foi inicializado, não faz nada e para de carregar.
        if (!auth) {
            setIsLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // Em um ambiente de produção real, as 'roles' viriam de Custom Claims do ID Token.
                // Ex: const idTokenResult = await firebaseUser.getIdTokenResult();
                // const userRole = idTokenResult.claims.role || 'gestor';
                const userProfile = getUserProfile(firebaseUser);
                setUser({
                    id: firebaseUser.uid,
                    ...userProfile,
                });
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        // Limpa a inscrição ao desmontar
        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        if (!auth) throw new Error("Firebase Auth não foi configurado.");
        await signInWithEmailAndPassword(auth, email, password);
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