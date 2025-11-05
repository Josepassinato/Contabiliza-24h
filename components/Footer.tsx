import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-900">
            <div className="container mx-auto px-6 py-8">
                <div className="text-center">
                    <p className="text-slate-500">
                        &copy; {new Date().getFullYear()} Contaflux IA. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;