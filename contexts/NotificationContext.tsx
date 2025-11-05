
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';

// --- Types ---
export type NotificationType = 'success' | 'error';

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    addNotification: (message: string, type?: NotificationType) => void;
}

// --- Context Definition ---
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// --- State Management ---
const useNotificationState = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((message: string, type: NotificationType = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000); // Notifications disappear after 5 seconds
    }, []);
    
    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return { notifications, addNotification, removeNotification };
};


// --- Provider Component ---
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { notifications, addNotification, removeNotification } = useNotificationState();

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            <NotificationContainer notifications={notifications} onRemove={removeNotification} />
        </NotificationContext.Provider>
    );
};

// --- Custom Hook ---
export const useNotifier = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifier must be used within a NotificationProvider');
    }
    return context;
};

// --- UI Component for Notifications ---
const Notification: React.FC<{ notification: Notification; onRemove: (id: number) => void }> = ({ notification, onRemove }) => {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => onRemove(notification.id), 300);
        }, 4700);

        return () => clearTimeout(timer);
    }, [notification.id, onRemove]);

    const handleClose = () => {
        setExiting(true);
        setTimeout(() => onRemove(notification.id), 300);
    };
    
    const baseClasses = "relative w-full max-w-sm p-4 pr-10 my-2 overflow-hidden rounded-lg shadow-lg transition-all duration-300 ease-in-out";
    const typeClasses = {
        success: "bg-green-500 text-white",
        error: "bg-red-500 text-white",
    };
    const animationClasses = exiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0";

    const Icon = () => {
        if (notification.type === 'success') {
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        }
        return null;
    }

    return (
        <div className={`${baseClasses} ${typeClasses[notification.type]} ${animationClasses}`}>
            <div className="flex items-center">
                <Icon />
                <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button onClick={handleClose} className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
};

const NotificationContainer: React.FC<{ notifications: Notification[]; onRemove: (id: number) => void; }> = ({ notifications, onRemove }) => {
    return (
        <div className="fixed top-5 right-5 z-[100]">
            {notifications.map(n => (
                <Notification key={n.id} notification={n} onRemove={onRemove} />
            ))}
        </div>
    );
};
