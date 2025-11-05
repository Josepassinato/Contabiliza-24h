import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifier } from '../contexts/NotificationContext';

interface LoginPageProps {
    onNavigateToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
    const { login } = useAuth();
    const { addNotification } = useNotifier();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            addNotification('Por favor, preencha e-mail e senha.', 'error');
            return;
        }
        setIsLoading(true);

        try {
            await login(email, password);
            // O App irá redirecionar através do AuthContext
        } catch (error: any) {
            console.error(error);
            let message = 'Falha no login.';
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                message = 'Email ou senha inválidos.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Formato de email inválido.';
            }
            addNotification(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Funções para login rápido de demonstração
    const handleDemoLogin = (role: 'contador' | 'gestor' | 'admin') => {
       const demoEmails = {
            contador: process.env.REACT_APP_CONTADOR_EMAIL || 'contador@contaflux.ia',
            gestor: process.env.REACT_APP_GESTOR_EMAIL || 'gestor@paoquente.com',
            admin: process.env.REACT_APP_ADMIN_EMAIL || 'admin@contaflux.ia',
        };
       setEmail(demoEmails[role]);
       setPassword('123456'); // Senha padrão para os usuários de demonstração
    };


    return (
        <div className="min-h-screen bg-slate-900 text-slate-300 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <header className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                       <svg className="w-8 h-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                       </svg>
                      <h1 className="text-3xl font-bold text-white">
                        Contaflux <span className="text-cyan-400">IA</span>
                      </h1>
                    </div>
                    <h1 className="text-4xl font-extrabold text-white">Acesso ao Painel</h1>
                    <p className="text-slate-400 mt-2">
                        Entre com sua conta ou use os logins de demonstração.
                    </p>
                </header>
                <main className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 space-y-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="******"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center bg-cyan-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-cyan-600 transition-colors duration-300 disabled:opacity-50"
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>
                    
                     <div className="text-center text-sm">
                        <span className="text-slate-400">Não tem uma conta? </span>
                        <button onClick={onNavigateToRegister} className="font-semibold text-cyan-400 hover:text-cyan-300">
                            Cadastre-se
                        </button>
                    </div>

                    <div className="relative">
                       <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-slate-700" /></div>
                       <div className="relative flex justify-center"><span className="bg-slate-800/50 px-2 text-sm text-slate-500">Ou use um perfil de demo</span></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                         <button onClick={() => handleDemoLogin('contador')} className="text-xs py-2 px-1 rounded-md bg-slate-700 hover:bg-slate-600">Contador</button>
                         <button onClick={() => handleDemoLogin('gestor')} className="text-xs py-2 px-1 rounded-md bg-slate-700 hover:bg-slate-600">Gestor</button>
                         <button onClick={() => handleDemoLogin('admin')} className="text-xs py-2 px-1 rounded-md bg-slate-700 hover:bg-slate-600">Admin</button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LoginPage;