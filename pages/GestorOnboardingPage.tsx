import React, { useState } from 'react';
import { Client } from '../contexts/ContadorContext';

interface GestorOnboardingPageProps {
    client: Client;
    onComplete: () => void;
}

const GestorOnboardingPage: React.FC<GestorOnboardingPageProps> = ({ client, onComplete }) => {
    const [step, setStep] = useState(1);
    const [isLinkCopied, setIsLinkCopied] = useState(false);

    const accessLink = `https://contabiliza.ai/chat/${client.id.substring(0, 8)}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(accessLink);
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
    };

    const renderStep = () => {
        switch (step) {
            case 1: // Welcome
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo(a), {client.name.split(' ')[0]}!</h2>
                        <p className="text-slate-400 mb-6">Você foi convidado para usar o assistente de IA da <span className="font-bold text-cyan-400">{client.name}</span>. Vamos configurar seu acesso seguro.</p>
                        <button onClick={() => setStep(2)} className="w-full bg-cyan-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-cyan-600 transition-colors duration-300">
                            Iniciar Configuração
                        </button>
                    </div>
                );
            case 2: // Facial Scan Simulation
                return (
                    <div>
                         <h2 className="text-2xl font-bold text-white mb-2">Passo 1: Segurança com Face ID</h2>
                         <p className="text-slate-400 mb-6">Para sua segurança, usaremos reconhecimento facial. É rápido e garante que só você acesse os dados.</p>
                         <div className="w-48 h-48 mx-auto rounded-full border-4 border-dashed border-cyan-500/50 flex items-center justify-center my-8 animate-pulse">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                         </div>
                         <button onClick={() => setStep(3)} className="w-full bg-cyan-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-cyan-600">
                             Simular Escaneamento Facial
                         </button>
                    </div>
                );
            case 3: // Final Step - Access Link and PWA instructions
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Passo 2: Seu Acesso Pessoal</h2>
                        <p className="text-slate-400 mb-6">Sua conta está pronta! Use o link abaixo para acessar seu assistente sempre que precisar.</p>
                        
                        <div className="relative mb-6">
                            <input type="text" readOnly value={accessLink} className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-3 pl-3 pr-28 text-slate-300"/>
                            <button onClick={handleCopyLink} className="absolute right-1 top-1 bottom-1 bg-cyan-500 text-white font-semibold px-4 rounded-md text-sm hover:bg-cyan-600">
                                {isLinkCopied ? 'Copiado!' : 'Copiar'}
                            </button>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                            <h3 className="font-bold text-white mb-3">Dica: Adicione à sua Tela de Início!</h3>
                            <p className="text-sm text-slate-400 mb-3">Tenha o assistente a um toque de distância, como se fosse um app.</p>
                             <ol className="text-sm space-y-2 text-slate-300">
                                <li className="flex items-center gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center font-bold">1</span>
                                    <span>No Safari, toque no ícone de <span className="font-bold">Compartilhar</span> <svg xmlns="http://www.w3.org/2000/svg" className="inline h-5 w-5 -mt-1" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>.</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center font-bold">2</span>
                                    <span>Role e selecione <span className="font-bold">"Adicionar à Tela de Início"</span>.</span>
                                </li>
                            </ol>
                        </div>
                        
                        <button onClick={onComplete} className="mt-8 w-full bg-green-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-green-600 transition-colors duration-300">
                            Acessar o Assistente Agora
                        </button>
                    </div>
                );
            default:
                return null;
        }
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
                        Contabiliza.<span className="text-cyan-400">AI</span>
                      </h1>
                    </div>
                    <h1 className="text-4xl font-extrabold text-white">Configuração de Acesso</h1>
                 </header>

                <main className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 transition-all duration-500">
                   {renderStep()}
                </main>
             </div>
        </div>
    );
};

export default GestorOnboardingPage;