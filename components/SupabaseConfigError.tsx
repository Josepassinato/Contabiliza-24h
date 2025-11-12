import React from 'react';

const SupabaseConfigError: React.FC = () => {

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-300">
            <div className="max-w-3xl w-full bg-slate-800 border border-red-500/50 rounded-2xl p-8 text-center shadow-lg">
                <svg className="w-16 h-16 text-red-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <h1 className="text-3xl font-extrabold text-white mb-3">Configuração do Backend (Supabase) Necessária</h1>
                <p className="text-slate-400 mb-6">
                    Para que a aplicação funcione, você precisa conectar ao seu projeto Supabase.
                </p>
                <div className="bg-slate-900/50 p-6 rounded-lg text-left">
                    <p className="text-lg font-semibold text-white mb-3">Ação Necessária (2 Passos):</p>
                    <ol className="list-decimal list-inside space-y-4 text-slate-300">
                        <li>
                            <strong>Abra o arquivo <code className="bg-slate-700 text-cyan-400 px-2 py-1 rounded text-sm">supabase/credentials.ts</code></strong> na lista de arquivos do projeto.
                        </li>
                        <li>
                            <strong>Siga as instruções dentro do arquivo</strong> para obter a URL e a Chave Pública (anon key) do seu projeto Supabase e colá-las no local indicado. A aplicação será atualizada automaticamente.
                        </li>
                    </ol>

                     <div className="mt-6 pt-4 border-t border-slate-700/50 text-sm text-slate-400">
                         <p><strong>Por que isso é necessário?</strong> Sua aplicação precisa se conectar ao Supabase para autenticar usuários e gerenciar os dados no banco de dados Postgres. Suas credenciais permitem essa conexão de forma segura.</p>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default SupabaseConfigError;