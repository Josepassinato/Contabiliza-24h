// api/contadorApi.ts
// Este arquivo agora define principalmente os tipos de dados compartilhados pela aplicação.
// A lógica de busca de dados foi movida para o `backendApiClient` para simular
// uma arquitetura cliente-servidor.

// --- Types ---
export type ConnectionType = 'api_key' | 'sync_agent' | 'generic_api';

export interface Client {
    id: string;
    name: string;
    email: string;
    contador_id: string;
    gestor_id?: string | null; // ID do usuário gestor que ativou a conta
    status: 'Ativo' | 'Pendente' | 'Inativo';
    created_at: string; // ISO string
    financial_data?: FinancialData | null;
}

export interface Platform {
    id: string;
    name: string;
    logo: string;
    connected: boolean;
    contador_id: string;
    connection_type: ConnectionType;
    platform_ref_id: string;
}

export interface FinancialData {
    month: string;
    revenue: number;
    expenses: number;
    topExpenseCategory: string;
    topExpenseValue: number;
}
