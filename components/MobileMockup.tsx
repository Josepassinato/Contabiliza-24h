import React from 'react';

const MobileMockup: React.FC = () => {
    return (
        <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-slate-900">
                {/* Screen content */}
                <div className="p-4 text-white text-sm">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold">Dashboard</span>
                        <div className="w-6 h-6 bg-cyan-400 rounded-full"></div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-slate-400">Receita Mensal</p>
                            <p className="text-xl font-bold">R$ 15.780,50</p>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-slate-400">Despesas</p>
                            <p className="text-xl font-bold">R$ 4.320,00</p>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-slate-400">Lucro</p>
                            <p className="text-xl font-bold text-green-400">R$ 11.460,50</p>
                        </div>
                         <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-slate-400">Próximo Imposto</p>
                            <p className="text-lg font-bold text-yellow-400">DAS - Vence 20/07</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileMockup;
