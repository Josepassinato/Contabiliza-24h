
import React, { useState } from 'react';
// FIX: Added file extension to import for module resolution.
import { useAuth } from '../contexts/AuthContext.tsx';
import { useNotifier } from '../contexts/NotificationContext.tsx';
import { demoCredentials } from '../firebase/credentials.ts';

interface LoginPageProps {
    onNavigateToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
    const { login, bypassLogin } = useAuth();
    const { addNotification } = useNotifier();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setPageError(null); // Clear previous errors
        if (!email || !password) {
            addNotification('Por favor, preencha e-mail e senha.', 'error');
            return;
        }
        setIsLoading(true);

        try {
            await login(email, password);
            // O App irá redirecionar através do AuthContext
        } catch (error: any) {
            console.error("Login failed:", error);
            let message = 'Falha no login. Verifique suas credenciais.';

            if (error.message === 'USER_PENDING_APPROVAL') {
                message = 'Sua conta está pendente de aprovação pelo administrador.';
            } else if (error.message === 'INVALID_CREDENTIALS') {
                message = 'E-mail ou senha inválidos.';
            }
            
            addNotification(message, 'error');
            setPageError(message);
        } finally {
            setIsLoading(false);
        }
    };

    // Funções para login rápido de demonstração
    const handleDemoLogin = (role: 'contador' | 'admin') => {
       const demoEmails = {
            contador: demoCredentials.contadorEmail || 'contador@contaflux.ia',
            admin: demoCredentials.adminEmail || 'admin@contaflux.ia',
        };
       setEmail(demoEmails[role]);
       setPassword('123456'); // Senha padrão para os usuários de demonstração
    };


    return (
        <div className="min-h-screen bg-slate-900 text-slate-300 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <header className="text-center mb-8">
                     <h1 className="text-4xl font-extrabold text-white">Acesse sua Conta</h1>
                     <p className="text-slate-400 mt-2">
                        Bem-vindo(a) de volta.
                    </p>
                </header>
                <main className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 space-y-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
                            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </div>

                        {pageError && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-sm rounded-md p-3 text-center">
                                {pageError}
                            </div>
                        )}
                        
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center bg-cyan-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-cyan-600 transition-colors duration-300 disabled:opacity-50"
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-slate-800 text-slate-500">Ou</span>
                        </div>
                    </div>

                    <div className="text-center">
                         <button onClick={onNavigateToRegister} className="font-semibold text-cyan-400 hover:text-cyan-300 text-sm">
                            Não tem uma conta? Crie uma agora.
                        </button>
                    </div>
                     <div className="text-center text-xs text-slate-500 pt-4">
                        <p className="mb-2">Para demonstração, use as contas:</p>
                        <div className="flex justify-center gap-2">
                             <button onClick={() => handleDemoLogin('contador')} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">Contador</button>
                             <button onClick={() => handleDemoLogin('admin')} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">Admin</button>
                        </div>
                    </div>

                    {/* Bypass Section */}
                    <div className="text-center text-xs text-slate-500 pt-4 mt-4 border-t border-slate-700">
                        <p className="mb-2 font-bold text-yellow-400">Acesso Direto (Desenvolvimento)</p>
                        <p className="mb-3">Use estes botões para pular o login e ir direto para os painéis.</p>
                        <div className="flex justify-center gap-2">
                            <button onClick={() => bypassLogin('contador')} className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded">Painel Contador</button>
                            <button onClick={() => bypassLogin('gestor')} className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded">Painel Gestor</button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LoginPage;