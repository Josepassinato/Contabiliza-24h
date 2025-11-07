
import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Added .tsx extension to ensure module resolution.
import App from './App.tsx';
import { NotificationProvider } from './contexts/NotificationContext';
// FIX: Added .tsx extension to ensure module resolution.
import { AuthProvider } from './contexts/AuthContext.tsx';

// Registra o Service Worker para habilitar a funcionalidade PWA (offline)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registrado com sucesso com o escopo: ', registration.scope);
      })
      .catch(err => {
        console.log('Falha no registro do ServiceWorker: ', err);
      });
  });
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <NotificationProvider>
      <AuthProvider>
          <App />
      </AuthProvider>
    </NotificationProvider>
  </React.StrictMode>
);
