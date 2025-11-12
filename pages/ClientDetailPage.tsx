
import React, { useState, useEffect } from 'react';
import { Client, Platform, FinancialData } from '../api/contadorApi.ts';
// FIX: Added file extension to import for module resolution.
import { useContador } from '../contexts/ContadorContext.tsx';
import { useNotifier } from '../contexts/NotificationContext.tsx';
import ChartComponent from '../components/ChartComponent.tsx';

interface ClientDetailPageProps {
    client: Client;
    onBack: () => void;
    onOpenVoiceAssistant: (client: Client) => void;
}

const ClientDetailPage: React.FC<ClientDetailPageProps> = ({ client: initialClient, onBack, onOpenVoiceAssistant }) => {
    // We get the full, up-to-date client list from the context
    const { platforms, syncClientData, clients } = useContador();
    const { addNotification } = useNotifier();
    
    // Find the latest version of the client from the context to ensure data is fresh
    const client = clients.find(c => c.id === initialClient.id) || initialClient;
    
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSyncData = async () => {
        setIsSyncing(true);
        addNotification(`Sincronizando dados para ${client.name}...`, 'success');
        try {
            const financialData = await syncClientData(client.id);
            if (financialData) {
                addNotification(`Dados de ${client.name} sincronizados com sucesso!`, 'success');
            } else {
                 throw new Error("Sync returned no data");
            }
        } catch (error) {
            console.error("Failed to sync data", error);
            addNotification("Falha ao sincronizar dados.", "error");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDownloadPdf = () => {
        // FIX: Changed client.financialData to client.financial_data to match the data model.
        if (!client.financial_data) {
            addNotification('Dados financeiros não estão disponíveis para gerar o relatório.', 'error');
            return;
        }

        // FIX: Changed client.financialData to client.financial_data to match the data model.
        const data = client.financial_data;
        const formattedRevenue = data.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const formattedExpenses = data.expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const formattedTopExpense = data.topExpenseValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const formattedResult = (data.revenue - data.expenses).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


        const reportHtml = `
            <html>
                <head>
                    <title>relatorio_financeiro_${client.name.replace(/\s+/g, '_').toLowerCase()}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 2rem; color: #333; }
                        h1 { color: #005f73; border-bottom: 2px solid #005f73; padding-bottom: 10px; }
                        h2 { color: #0a9396; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .total { font-weight: bold; background-color: #e9ecef; }
                    </style>
                </head>
                <body>
                    <h1>Relatório Financeiro</h1>
                    <h2>${client.name}</h2>
                    <p><strong>Período de Referência:</strong> ${data.month}</p>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Faturamento Bruto</td>
                                <td>${formattedRevenue}</td>
                            </tr>
                            <tr>
                                <td>Total de Despesas</td>
                                <td>${formattedExpenses}</td>
                            </tr>
                            <tr>
                                <td>Principal Categoria de Despesa (${data.topExpenseCategory})</td>
                                <td>${formattedTopExpense}</td>
                            </tr>
                            <tr class="total">
                                <td>Resultado (Faturamento - Despesas)</td>
                                <td>${formattedResult}</td>
                            </tr>
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(reportHtml);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 250); // Delay to ensure content is rendered
        } else {
            addNotification('Não foi possível abrir a janela de impressão. Verifique se os pop-ups estão bloqueados.', 'error');
        }
    };
    
    // FIX: Changed client.financialData to client.financial_data to match the data model.
    const chartData = client.financial_data ? [
        // FIX: Changed client.financialData to client.financial_data to match the data model.
        { label: 'Faturamento', value: client.financial_data.revenue },
        // FIX: Changed client.financialData to client.financial_data to match the data model.
        { label: 'Despesas', value: client.financial_data.expenses },
        // FIX: Changed client.financialData to client.financial_data to match the data model.
        { label: `Principal Desp. (${client.financial_data.topExpenseCategory})`, value: client.financial_data.topExpenseValue },
    ] : [];


    return (
        <section className="py-16">
            <div className="container mx-auto px-6">
                 <div className="mb-8">
                    <button onClick={onBack} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Voltar para Clientes
                    </button>
                    <div className="md:flex md:items-center md:justify-between">
                        <div>
                            <h1 className="text-4xl font-extrabold text-white">{client.name}</h1>
                            <p className="text-slate-400 mt-2">Detalhes do cliente e dados financeiros.</p>
                        </div>
                         <div className="mt-4 md:mt-0 flex-shrink-0 flex items-center gap-2">
                             <button
                                onClick={handleDownloadPdf}
                                // FIX: Changed client.financialData to client.financial_data to match the data model.
                                disabled={!client.financial_data || isSyncing}
                                className="bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                Baixar PDF
                            </button>
                             <button
                                onClick={() => onOpenVoiceAssistant(client)}
                                className="bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors duration-300 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                Falar com Assistente
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Financial Data Section */}
                    <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Dados Financeiros</h2>
                        {/* FIX: Changed client.financialData to client.financial_data to match the data model. */}
                        {client.financial_data ? (
                           <div>
                                {/* FIX: Changed client.financialData to client.financial_data to match the data model. */}
                                <p className="text-slate-400 mb-6">Resumo financeiro para <span className="font-bold text-cyan-400">{client.financial_data.month}</span>.</p>
                                <ChartComponent title="Visão Geral Financeira" data={chartData} />
                           </div>
                        ) : (
                            <div className="text-center py-12 flex flex-col items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s0 0 0 0m16 0s0 0 0 0M12 11c-3.473 0-6.354.66-8 1.5M12 11c3.473 0 6.354.66 8 1.5" /></svg>
                                <h3 className="mt-2 text-lg font-medium text-white">Nenhum dado financeiro encontrado</h3>
                                <p className="mt-1 text-sm text-slate-400 mb-6">Sincronize os dados para carregar o resumo financeiro do cliente.</p>
                                <button
                                    onClick={handleSyncData}
                                    disabled={isSyncing}
                                    className="bg-cyan-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-cyan-600 transition-colors duration-300 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSyncing ? (
                                         <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7V9a1 1 0 01-2 0V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13V11a1 1 0 112 0v6a1 1 0 01-1 1h-6a1 1 0 110-2h2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                                    )}
                                    {isSyncing ? 'Sincronizando...' : 'Sincronizar Dados'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Connections Section */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                         <h2 className="text-2xl font-bold text-white mb-4">Conexões Ativas</h2>
                         <div className="space-y-4">
                            {platforms.map(platform => (
                                 <div key={platform.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <img src={platform.logo} alt={`${platform.name} logo`} className="h-8 w-8 object-contain bg-white p-1 rounded-md" />
                                        <span className="font-semibold text-white text-sm">{platform.name}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${platform.connected ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-400'}`}>
                                        {platform.connected ? 'Ativa' : 'Inativa'}
                                    </span>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ClientDetailPage;