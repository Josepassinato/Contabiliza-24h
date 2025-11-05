import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// A chave de API foi atualizada para uma alternativa fornecida pelo usuário para corrigir o erro 'auth/api-key-not-valid'.
export const firebaseConfig = {
  apiKey: "AIzaSyAq9EWFRjZbfx9qhdNpseddHmHOmQANFyw",
  authDomain: "app-contaflux.firebaseapp.com",
  projectId: "app-contaflux",
  storageBucket: "app-contaflux.appspot.com",
  messagingSenderId: "1040140307029",
  appId: "1:1040140307029:web:924761f9055cdc2ea662dc",
  measurementId: "G-J1GSS3KM8Y"
};

// --- Initialization ---
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// The configuration is now guaranteed to be present.
export let isFirebaseConfigured = true;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Falha ao inicializar o Firebase.", e);
    isFirebaseConfigured = false;
    auth = null;
    db = null;
}

export { auth, db };