import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifier } from '../contexts/NotificationContext';

interface RegisterPageProps {
    onNavigateToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
    const { register } = useAuth();
    const { addNotification } = useNotifier();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            addNotification('As senhas não coincidem.', 'error');
            return;
        }
        if (password.length < 6) {
            addNotification('A senha deve ter no mínimo 6 caracteres.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await register(name, email, password);
            setIsSuccess(true);
        } catch (error: any) {
            console.error(error);
            let message = 'Falha no cadastro.';
            if (error.code === 'auth/email-already-in-use') {
                message = 'Este e-mail já está em uso.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Formato de e-mail inválido.';
            }
            addNotification(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-300 flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
                     <h1 className="text-2xl font-bold text-green-400 mb-4">Cadastro Realizado com Sucesso!</h1>
                     <p className="text-slate-400 mb-6">Sua conta está aguardando aprovação do administrador. Você será notificado por e-mail quando seu acesso for liberado.</p>
                     <button onClick={onNavigateToLogin} className="w-full bg-cyan-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-cyan-600">
                         Voltar para o Login
                     </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-300 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <header className="text-center mb-8">
                     <h1 className="text-4xl font-extrabold text-white">Crie sua Conta de Contador</h1>
                     <p className="text-slate-400 mt-2">
                        Comece a transformar a gestão dos seus clientes.
                    </p>
                </header>
                <main className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 space-y-6">
                    <form onSubmit={handleRegister} className="space-y-4">
                         <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Nome da Contabilidade</label>
                            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
                            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </div>
                         <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">Confirmar Senha</label>
                            <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center bg-cyan-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-cyan-600 transition-colors duration-300 disabled:opacity-50"
                        >
                            {isLoading ? 'Cadastrando...' : 'Criar Conta'}
                        </button>
                    </form>
                    
                     <div className="text-center text-sm">
                        <span className="text-slate-400">Já tem uma conta? </span>
                        <button onClick={onNavigateToLogin} className="font-semibold text-cyan-400 hover:text-cyan-300">
                            Faça Login
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default RegisterPage;