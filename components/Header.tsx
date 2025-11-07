
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    onLogin: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogin }) => {
    const { user, logout } = useAuth();

    return (
        <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <svg className="w-8 h-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                    <h1 className="text-xl font-bold text-white">
                        Contaflux <span className="text-cyan-400">IA</span>
                    </h1>
                </div>
                <nav>
                    {user ? (
                        <button
                            onClick={logout}
                            className="bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors duration-300 text-sm"
                        >
                            Sair
                        </button>
                    ) : (
                        <button
                            onClick={onLogin}
                            className="bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors duration-300 text-sm"
                        >
                            Acessar Painel
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
