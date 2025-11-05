import React from 'react';

interface HeaderProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, onLogout }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-slate-700/50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
           <svg className="w-8 h-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
           </svg>
          <h1 className="text-2xl font-bold text-white">
            Contaflux <span className="text-cyan-400">IA</span>
          </h1>
        </div>
        {isLoggedIn ? (
           <button 
              onClick={onLogout}
              className="hidden md:inline-block bg-red-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-300"
            >
              Sair
            </button>
        ) : (
          <a 
            href="mailto:contato@contaflux.ia" 
            className="hidden md:inline-block bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors duration-300"
          >
            Entrar em Contato
          </a>
        )}
      </nav>
    </header>
  );
};

export default Header;