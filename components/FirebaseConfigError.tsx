import React from 'react';

const FirebaseConfigError: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-300">
            <div className="max-w-2xl w-full bg-slate-800 border border-red-500/50 rounded-2xl p-8 text-center shadow-lg">
                <svg className="w-16 h-16 text-red-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <h1 className="text-3xl font-extrabold text-white mb-3">Configuração Incompleta</h1>
                <p className="text-slate-400 mb-6">
                    A aplicação não encontrou as credenciais do Firebase. É necessário configurar suas variáveis de ambiente.
                </p>
                <div className="bg-slate-900/50 p-4 rounded-lg text-left">
                    <p className="text-lg font-semibold text-white mb-2">Ação Necessária:</p>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300">
                        <li>Na raiz do projeto, encontre o arquivo <code className="bg-slate-700 text-cyan-400 px-2 py-1 rounded text-sm">.env.example</code>.</li>
                        <li>Crie uma cópia deste arquivo e renomeie-a para <code className="bg-slate-700 text-cyan-400 px-2 py-1 rounded text-sm">.env</code>.</li>
                        <li>Abra o novo arquivo <code className="bg-slate-700 text-cyan-400 px-2 py-1 rounded text-sm">.env</code> e preencha com as credenciais do seu projeto Firebase.</li>
                        <li>Salve o arquivo e reinicie o servidor de desenvolvimento.</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default FirebaseConfigError;
