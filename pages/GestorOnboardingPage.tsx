
import React, { useState } from 'react';
// FIX: Added file extensions to imports for module resolution.
import { Client } from '../contexts/ContadorContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useNotifier } from '../contexts/NotificationContext';

interface GestorOnboardingPageProps {
    client: Client;
    onComplete: () => void;
}

const GestorOnboardingPage: React.FC<GestorOnboardingPageProps> = ({ client, onComplete }) => {
    const { registerAndActivateGestor } = useAuth();
    const { addNotification } = useNotifier();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPageError(null);
        if (password !== confirmPassword) {
            const msg = 'As senhas não coincidem.';
            addNotification(msg, 'error');
            setPageError(msg);
            return;
        }
        if (password.length < 6) {
            const msg = 'A senha deve ter no mínimo 6 caracteres.';
            addNotification(msg, 'error');
            setPageError(msg);
            return;
        }
        setIsLoading(true);
        try {
            await registerAndActivateGestor(client.name, client.email, password, client.id);
            setIsSuccess(true);
        } catch (error: any) {
            console.error("Failed to register gestor:", error);
            let message = "Falha ao criar conta. Tente novamente.";
            if (error.code === 'auth/email-already-in-use') {
                message = 'Este e-mail já está em uso por outra conta.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'O formato do e-mail é inválido.';
            } else if (error.code === 'auth/weak-password') {
                message = 'A senha é muito fraca. Tente uma combinação mais forte.';
            }
            addNotification(message, "error");
            setPageError(message);
            setIsLoading(false); // Only set loading to false on error
        }
    };
    
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-300 flex items-center justify-center p-4">
                 <div className="w-full max-w-md text-center bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
                     <h1 className="text-2xl font-bold text-green-400 mb-4">Conta Criada com Sucesso!</h1>
                     <p className="text-slate-400 mb-6">Seu acesso ao assistente de IA foi configurado. Você já pode fazer o login.</p>
                     <button onClick={onComplete} className="w-full bg-cyan-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-cyan-600">
                         Ir para a Página de Login
                     </button>
                </div>
            </div>
        );
    }


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
                    <h1 className="text-4xl font-extrabold text-white">Finalize seu Cadastro</h1>
                 </header>

                <main className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 transition-all duration-500">
                   <p className="text-center text-slate-400 mb-6">
                       Bem-vindo(a), <span className="font-bold text-white">{client.name}</span>! Defina uma senha para acessar seu assistente de IA.
                   </p>
                   <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={client.email}
                                readOnly
                                className="w-full bg-slate-700/80 border border-slate-600 rounded-md py-2 px-3 text-slate-400 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Crie uma Senha</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                         <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">Confirme a Senha</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
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
                            {isLoading ? 'Configurando...' : 'Criar Conta e Acessar'}
                        </button>
                   </form>
                </main>
             </div>
        </div>
    );
};

export default GestorOnboardingPage;
