import React from 'react';

interface ChartData {
    label: string;
    value: number;
}

interface ChartComponentProps {
    title: string;
    data: ChartData[];
}

const ChartComponent: React.FC<ChartComponentProps> = ({ title, data }) => {
    // 1. Filtra os dados para obter apenas entradas válidas para calcular o valor máximo, evitando NaN.
    const validData = Array.isArray(data) 
        ? data.filter(item => typeof item.value === 'number' && isFinite(item.value))
        : [];
        
    const maxValue = Math.max(...validData.map(item => item.value), 0);
    
    const formatCurrency = (value: number) => {
        // Esta função agora só será chamada com números válidos.
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600/50 w-full">
            <h3 className="text-sm font-bold text-white mb-4 text-center">{title}</h3>
            <div className="space-y-3">
                {/* 2. Mapeia sobre o array de dados original para renderizar todas as linhas, tratando as inválidas de forma elegante. */}
                {(Array.isArray(data) ? data : []).map((item, index) => {
                    const hasValidValue = typeof item.value === 'number' && isFinite(item.value);
                    // Calcula a largura de forma segura. Se o valor for inválido ou o maxValue for 0, a largura é 0.
                    const widthPercentage = hasValidValue && maxValue > 0 ? (item.value / maxValue) * 100 : 0;

                    return (
                        <div key={index} className="flex items-center gap-3 text-xs">
                            <div className="w-28 text-right text-slate-300 truncate">{item.label || "Dado inválido"}</div>
                            <div className="flex-1 bg-slate-600 rounded-full h-5">
                                <div
                                    className="bg-cyan-500 h-5 rounded-full flex items-center justify-end pr-2 text-white font-bold"
                                    style={{ width: `${widthPercentage}%` }}
                                >
                                    <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                       {/* 3. Só chama formatCurrency se o valor for válido. */}
                                       {hasValidValue ? formatCurrency(item.value) : ""}
                                    </span>
                                </div>
                            </div>
                             <div className="w-20 text-left font-semibold text-slate-200">
                                {hasValidValue ? formatCurrency(item.value) : "N/A"}
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChartComponent;
