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
    const maxValue = Math.max(...data.map(item => item.value), 0);
    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600/50 w-full">
            <h3 className="text-sm font-bold text-white mb-4 text-center">{title}</h3>
            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 text-xs">
                        <div className="w-28 text-right text-slate-300 truncate">{item.label}</div>
                        <div className="flex-1 bg-slate-600 rounded-full h-5">
                            <div
                                className="bg-cyan-500 h-5 rounded-full flex items-center justify-end pr-2 text-white font-bold"
                                style={{ width: `${(item.value / maxValue) * 100}%` }}
                            >
                                <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">{formatCurrency(item.value)}</span>
                            </div>
                        </div>
                         <div className="w-20 text-left font-semibold text-slate-200">{formatCurrency(item.value)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChartComponent;
