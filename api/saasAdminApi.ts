
// --- Types for SaaS Admin ---
export interface Accountant {
    id: string;
    name: string;
    email: string;
    plan: 'basic' | 'pro' | 'enterprise';
    clientCount: number;
    createdAt: string;
}

export interface Metric {
    name: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
}

// --- Mock Data ---

const mockAccountants: Accountant[] = [
    { id: 'acc1', name: 'Contabilidade Exemplo', email: 'contato@exemplo.com', plan: 'pro', clientCount: 4, createdAt: new Date('2023-01-15').toISOString() },
    { id: 'acc2', name: 'Foco Contábil', email: 'suporte@foco.com.br', plan: 'basic', clientCount: 12, createdAt: new Date('2023-03-22').toISOString() },
    { id: 'acc3', name: 'Alpha Contadores', email: 'admin@alpha.com', plan: 'enterprise', clientCount: 58, createdAt: new Date('2022-11-01').toISOString() },
];

const mockMetrics: Metric[] = [
    { name: 'Receita Mensal', value: 'R$ 12.450', change: '+5.2%', changeType: 'increase' },
    { name: 'Novos Clientes (Mês)', value: '18', change: '+2', changeType: 'increase' },
    { name: 'Contas Ativas', value: '132', change: '-1.1%', changeType: 'decrease' },
    { name: 'Taxa de Churn', value: '2.3%', change: '+0.5%', changeType: 'decrease' }, // increase in churn is bad
];

const LS_KEYS = {
    ACCOUNTANTS: 'saas_admin_accountants',
};

// --- Helper Functions ---

const simulateLatency = <T,>(data: T, delay: number = 700): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

const initializeLocalStorage = () => {
    if (!localStorage.getItem(LS_KEYS.ACCOUNTANTS)) {
        localStorage.setItem(LS_KEYS.ACCOUNTANTS, JSON.stringify(mockAccountants));
    }
};

initializeLocalStorage();

const getAccountantsFromStorage = (): Accountant[] => JSON.parse(localStorage.getItem(LS_KEYS.ACCOUNTANTS) || '[]');

// --- API Functions ---

export const fetchDashboardMetrics = async (): Promise<Metric[]> => {
    return simulateLatency(mockMetrics);
};

export const fetchAccountants = async (): Promise<Accountant[]> => {
    const accountants = getAccountantsFromStorage();
    return simulateLatency(accountants);
};
