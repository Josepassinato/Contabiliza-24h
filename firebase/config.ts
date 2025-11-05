import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Lê as credenciais do Firebase a partir das variáveis de ambiente,
// com valores de fallback para facilitar a execução em ambientes de demonstração.
// CORREÇÃO: A chave de API foi corrigida para corresponder à da captura de tela do usuário.
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCHG3sQEfMHHOidAAzFBGmbtL607yM6O-c",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "app-contaflux.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "app-contaflux",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "app-contaflux.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1040140307029",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1040140307029:web:924761f9055cdc2ea662dc",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-J1GSS3KM8Y"
};

// --- Initialization ---
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Verifica se as variáveis de ambiente essenciais foram configuradas.
export let isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (e) {
        console.error("Falha ao inicializar o Firebase. Verifique as credenciais no seu arquivo .env.", e);
        isFirebaseConfigured = false;
        auth = null;
        db = null;
    }
} else {
     console.error("Configuração do Firebase não encontrada. Crie um arquivo .env a partir do .env.example e preencha as credenciais.");
}


export { auth, db };