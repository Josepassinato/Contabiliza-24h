import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ContadorProvider } from './contexts/ContadorContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <NotificationProvider>
      <AuthProvider>
        <ContadorProvider>
          <App />
        </ContadorProvider>
      </AuthProvider>
    </NotificationProvider>
  </React.StrictMode>
);