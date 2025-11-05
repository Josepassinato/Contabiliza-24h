import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ClienteDashboardProps {
    onOpenVoiceAssistant: () => void;
}

const ClienteDashboard: React.FC<ClienteDashboardProps> = ({ onOpenVoiceAssistant }) => {
    const { user } = useAuth();
    
    return (
        <div className="container mx-auto px-6 py-16 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center mb-6 ring-4 ring-indigo-500/30">
                <span className="text-4xl font-bold text-white">{(user?.name || ' ').charAt(0)}</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white">Bem-vindo(a), {user?.name.split(' ')[0]}!</h1>
            <p className="text-slate-400 mt-2 max-w-2xl">
                Este é o seu painel de controle financeiro. Para começar, clique no botão abaixo e faça uma pergunta ao seu assistente de IA.
            </p>

            <button
                onClick={onOpenVoiceAssistant}
                className="mt-10 bg-cyan-500 text-white font-semibold px-8 py-4 rounded-lg hover:bg-cyan-600 transition-colors duration-300 shadow-lg shadow-cyan-500/20 flex items-center gap-3 text-lg"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Falar com o Assistente de IA
            </button>

            <div className="mt-16 w-full max-w-3xl bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
                 <h2 className="text-xl font-bold text-white mb-4">Sugestões de Perguntas</h2>
                 <ul className="space-y-3 text-left text-slate-300">
                     <li className="p-3 bg-slate-700/50 rounded-md">"Qual foi o faturamento bruto este mês?"</li>
                     <li className="p-3 bg-slate-700/50 rounded-md">"Compare o faturamento com o mês anterior."</li>
                     <li className="p-3 bg-slate-700/50 rounded-md">"Quais foram minhas maiores despesas?"</li>
                     <li className="p-3 bg-slate-700/50 rounded-md">"É uma boa ideia contratar um novo funcionário agora?"</li>
                 </ul>
            </div>
        </div>
    );
};

export default ClienteDashboard;
