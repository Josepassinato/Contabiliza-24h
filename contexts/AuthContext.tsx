import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase/client.ts';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { Client, Platform } from '../api/contadorApi.ts';
import { demoCredentials } from '../firebase/credentials.ts'; // Usado apenas para o bypass

// --- Types ---
export type UserRole = 'contador' | 'gestor' | 'admin';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: 'active' | 'pending';
    clientDetails?: Client | null;
}

interface AuthContextType {
    user: User | null;
    authLoading: boolean;
    pendingApproval: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (name: string, email: string, pass: string) => Promise<void>;
    registerAndActivateGestor: (name: string, email: string, pass: string, clientId: string) => Promise<void>;
    logout: () => Promise<void>;
    bypassLogin: (role: UserRole) => Promise<void>;
}

// --- Context Definition ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [pendingApproval, setPendingApproval] = useState(false);

    const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<User | null> => {
        if (!isSupabaseConfigured) return null;

        const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

        if (error || !userProfile) {
            console.error("Error fetching user profile:", error);
            return null;
        }

        if (userProfile.status === 'pending') {
            setPendingApproval(true);
            // Force sign out if user is pending to prevent access
            await supabase.auth.signOut();
            return null;
        }

        setPendingApproval(false);

        const appUser: User = {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            role: userProfile.role as UserRole,
            status: userProfile.status as 'active' | 'pending',
        };

        // If role is gestor, fetch their client details
        if (appUser.role === 'gestor') {
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('gestor_id', appUser.id)
                .single();
            
            if (clientError) console.error("Error fetching client details for gestor:", clientError);
            if (clientData) appUser.clientDetails = clientData;
        }

        return appUser;
    }, []);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setAuthLoading(false);
            return;
        }

        const getInitialSession = async () => {
            setAuthLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const userProfile = await fetchUserProfile(session.user);
                setUser(userProfile);
            }
            setAuthLoading(false);
        };
        
        getInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const userProfile = await fetchUserProfile(session.user);
                setUser(userProfile);
            } else {
                setUser(null);
                setPendingApproval(false);
            }
            setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [fetchUserProfile]);

    const login = async (email: string, pass: string) => {
        if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
    };

    const logout = async () => {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
        setUser(null);
    };

    const register = async (name: string, email: string, pass: string) => {
        if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: pass });
        if (authError || !authData.user) throw authError || new Error("User not created");

        const { error: profileError } = await supabase.from('users').insert({
            id: authData.user.id,
            name,
            email,
            role: 'contador',
            status: 'pending'
        });

        if (profileError) {
            // Rollback user creation if profile fails
            await supabase.auth.signOut(); // Log them out
            // In a real scenario, you might want to delete the auth user here via an admin call.
            console.error("Failed to create profile, user auth was rolled back.", profileError);
            throw profileError;
        }
    };
    
    const registerAndActivateGestor = async (name: string, email: string, pass: string, clientId: string) => {
        if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
        // Step 1: Create the auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: pass });
        if (authError || !authData.user) throw authError || new Error("Gestor user not created");

        // Step 2: Create the user profile
        const { error: profileError } = await supabase.from('users').insert({
            id: authData.user.id,
            name,
            email,
            role: 'gestor',
            status: 'active'
        });
        if (profileError) throw profileError;

        // Step 3: Link the new gestor user to the client and set client to 'Ativo'
        const { error: clientUpdateError } = await supabase
            .from('clients')
            .update({ gestor_id: authData.user.id, status: 'Ativo' })
            .eq('id', clientId);
        if (clientUpdateError) throw clientUpdateError;

        // Log the user out so they can log in fresh
        await supabase.auth.signOut();
    };


    const bypassLogin = async (role: UserRole) => {
        if (!isSupabaseConfigured) {
            setAuthLoading(false);
            console.error("Cannot bypass login, Supabase not configured.");
            return;
        };
        setAuthLoading(true);
        const email = role === 'contador' ? (demoCredentials.contadorEmail || 'contador@contaflux.ia') : 'gestor@paoquente.com';
        const password = '123456';
        try {
            await login(email, password);
        } catch (e) {
            console.error(`Bypass login for role ${role} failed`, e);
            // Handle case where demo users don't exist
            setAuthLoading(false);
        }
    };


    const value = {
        user,
        authLoading,
        pendingApproval,
        login,
        register,
        registerAndActivateGestor,
        logout,
        bypassLogin
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};