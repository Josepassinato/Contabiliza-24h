import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase/client.ts';
import { useAuth } from './AuthContext.tsx';
import type { Client, Platform, FinancialData } from '../api/contadorApi.ts';

export type { Client, Platform, FinancialData, ConnectionType } from '../api/contadorApi.ts';

// --- Default platforms for a new accountant ---
const INITIAL_PLATFORMS = [
    { platform_ref_id: 'p1', name: 'Domínio Sistemas', logo: 'https://seeklogo.com/images/D/dominio-sistemas-logo-BBE2C464DE-seeklogo.com.png', connection_type: 'sync_agent' },
    { platform_ref_id: 'p2', name: 'Conta Azul', logo: 'https://theme.zdassets.com/theme_assets/9339399/6579f15757913346452f33f67185061444f1240a.png', connection_type: 'api_key' },
    { platform_ref_id: 'p3', name: 'Omie', logo: 'https://assets-global.website-files.com/61fe607f35754982635a9f5c/61fe607f35754955c45a9fa1_omie-logo-2-500x281.png', connection_type: 'api_key' },
    { platform_ref_id: 'p4', name: 'QuickBooks', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Intuit_QuickBooks_logo.svg/2560px-Intuit_QuickBooks_logo.svg.png', connection_type: 'api_key' },
    { platform_ref_id: 'p5', name: 'Bling', logo: 'https://cdn.bling.com.br/bling-logos/bling-icon-100.png', connection_type: 'api_key' },
    { platform_ref_id: 'p6', name: 'Tiny ERP', logo: 'https://tiny.com.br/images/logo/tiny-symbol-blue.svg', connection_type: 'api_key' },
    { platform_ref_id: 'p7', name: 'Sage Brasil', logo: 'https://www.sage.com/pt-br/static-assets/images/sage_com_logo.svg', connection_type: 'api_key' },
    { platform_ref_id: 'p8', name: 'API Genérica', logo: 'https://cdn-icons-png.flaticon.com/512/2164/2164828.png', connection_type: 'generic_api' },
];

interface ContadorContextType {
    clients: Client[];
    platforms: Platform[];
    isLoading: boolean;
    inviteClient: (name: string, email: string) => Promise<Client | null>;
    saveApiConnection: (platformId: string, credentials: { apiKey: string; apiSecret: string }) => Promise<void>;
    disconnectPlatform: (platformId: string) => Promise<void>;
    syncClientData: (clientId: string) => Promise<FinancialData | null>;
}

const ContadorContext = createContext<ContadorContextType | undefined>(undefined);

export const ContadorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadData = useCallback(async (contadorId: string) => {
        if (!isSupabaseConfigured) return;
        setIsLoading(true);
        try {
            // Fetch clients and platforms in parallel
            const clientPromise = supabase.from('clients').select('*').eq('contador_id', contadorId).order('created_at', { ascending: false });
            const platformPromise = supabase.from('platforms').select('*').eq('contador_id', contadorId);

            const [{ data: clientsData, error: clientError }, { data: platformsData, error: platformError }] = await Promise.all([clientPromise, platformPromise]);

            if (clientError) throw clientError;
            if (platformError) throw platformError;

            setClients(clientsData || []);

            // If the accountant has no platforms, it's likely their first login. Let's create them.
            if (platformsData && platformsData.length === 0) {
                const newPlatforms = INITIAL_PLATFORMS.map(p => ({ ...p, contador_id: contadorId }));
                const { data: insertedPlatforms, error: insertError } = await supabase.from('platforms').insert(newPlatforms).select();
                if (insertError) throw insertError;
                setPlatforms(insertedPlatforms || []);
            } else {
                setPlatforms(platformsData || []);
            }
        } catch (error) {
            console.error("Failed to load contador data from Supabase:", error);
            setClients([]);
            setPlatforms([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user && user.role === 'contador' && isSupabaseConfigured) {
            loadData(user.id);
        } else {
            setClients([]);
            setPlatforms([]);
            setIsLoading(false);
        }
    }, [user, loadData]);

    const inviteClient = async (name: string, email: string): Promise<Client | null> => {
        if (!user || user.role !== 'contador' || !isSupabaseConfigured) return null;
        
        try {
            const { data, error } = await supabase
                .from('clients')
                .insert({
                    name,
                    email,
                    contador_id: user.id,
                    status: 'Pendente',
                })
                .select()
                .single();
            
            if (error) throw error;

            setClients(prev => [data, ...prev]);
            return data;
        } catch (error) {
            console.error("Failed to invite client:", error);
            return null;
        }
    };
    
    const saveApiConnection = async (platformId: string, credentials: { apiKey: string; apiSecret: string }) => {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase
            .from('platforms')
            .update({ connected: true, credentials })
            .eq('id', platformId);
        
        if (error) throw error;
        setPlatforms(prev => prev.map(p => p.id === platformId ? { ...p, connected: true } : p));
    };

    const disconnectPlatform = async (platformId: string) => {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase
            .from('platforms')
            .update({ connected: false, credentials: null })
            .eq('id', platformId);
            
        if (error) throw error;
        setPlatforms(prev => prev.map(p => p.id === platformId ? { ...p, connected: false } : p));
    };

    const syncClientData = async (clientId: string): Promise<FinancialData | null> => {
        if (!isSupabaseConfigured) return null;
        try {
            const clientName = clients.find(c => c.id === clientId)?.name || 'Cliente';
            // Logic from backendApiClient to generate mock data, as we don't have a real external API
            const nameHash = clientName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const baseRevenue = 80000 + (nameHash % 50000);
            const revenue = baseRevenue + Math.floor(Math.random() * 20000) - 10000;
            const expenses = revenue * (0.65 + Math.random() * 0.2);
            const topExpenseValue = expenses * (0.3 + Math.random() * 0.2);
            const expenseCategories = ['Fornecedores', 'Folha de Pagamento', 'Marketing', 'Aluguel', 'Impostos'];
            const topExpenseCategory = expenseCategories[nameHash % expenseCategories.length];
            
            const financialData: FinancialData = {
                month: 'Maio/2024',
                revenue: parseFloat(revenue.toFixed(2)),
                expenses: parseFloat(expenses.toFixed(2)),
                topExpenseCategory,
                topExpenseValue: parseFloat(topExpenseValue.toFixed(2)),
            };

            const { data, error } = await supabase
                .from('clients')
                .update({ financial_data: financialData })
                .eq('id', clientId)
                .select()
                .single();

            if (error) throw error;

            setClients(prev => prev.map(c => c.id === clientId ? data : c));
            return financialData;
        } catch (error) {
            console.error("Failed to sync client data:", error);
            return null;
        }
    };

    const value = {
        clients,
        platforms,
        isLoading,
        inviteClient,
        saveApiConnection,
        disconnectPlatform,
        syncClientData,
    };

    return <ContadorContext.Provider value={value}>{children}</ContadorContext.Provider>;
};

export const useContador = (): ContadorContextType => {
    const context = useContext(ContadorContext);
    if (context === undefined) {
        throw new Error('useContador must be used within a ContadorProvider');
    }
    return context;
};