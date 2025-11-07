
import { initializeApp, FirebaseApp, deleteApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDoc, enableIndexedDbPersistence } from 'firebase/firestore';

// As credenciais do Firebase agora são importadas de um arquivo dedicado.
// Edite o arquivo 'firebase/credentials.ts' para configurar seu projeto.
import { firebaseConfig } from './credentials';

// --- Initialization ---
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let configError: string | null = null;

// Verifica se as credenciais essenciais do Firebase foram preenchidas no arquivo credentials.ts.
const essentialKeys = ['apiKey', 'authDomain', 'projectId'];
const missingKeys = essentialKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0 || !firebaseConfig.apiKey) { // Adicionada verificação explícita para apiKey
    configError = `As credenciais do Firebase não foram preenchidas em 'firebase/credentials.ts'.`;
    console.warn(configError);
} else {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        // Habilita a persistência de dados offline para o Firestore.
        // Isso armazena os dados localmente, permitindo que o app funcione offline
        // e sincronize as alterações quando a conexão for restaurada.
        enableIndexedDbPersistence(db)
            .catch((err) => {
                if (err.code == 'failed-precondition') {
                    // Múltiplas abas abertas, a persistência só pode ser ativada em uma.
                    console.warn('A persistência do Firestore falhou: múltiplas abas estão abertas.');
                } else if (err.code == 'unimplemented') {
                    // O navegador atual não suporta os recursos necessários para a persistência.
                    console.warn('A persistência do Firestore não é suportada neste navegador.');
                }
            });

    } catch (e) {
        const error = e as Error;
        console.error("Falha ao inicializar o Firebase. Verifique se as credenciais no arquivo 'firebase/credentials.ts' estão corretas.", error);
        configError = `Erro na inicialização do Firebase: ${error.message}. Verifique suas credenciais.`;
        auth = null;
        db = null;
    }
}

export const isConfigured = !configError;

// FIX: Added and exported the testFirebaseConnection function.
export const testFirebaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
    const essentialKeys = ['apiKey', 'authDomain', 'projectId'];
    const missingKeys = essentialKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
    
    if (missingKeys.length > 0 || !firebaseConfig.apiKey) {
        return { success: false, error: "As credenciais do Firebase parecem estar incompletas no arquivo `firebase/credentials.ts`." };
    }
    
    const testAppName = `test-app-${Date.now()}`;
    let testApp: FirebaseApp | null = null;
    
    try {
        testApp = initializeApp(firebaseConfig, testAppName);
        const testDb = getFirestore(testApp);
        
        await getDoc(doc(testDb, '_test_connection', 'doc'));
        
        return { success: true };
    } catch (error: any) {
        console.error("Firebase connection test failed:", error);
        
        let errorMessage = `Falha na conexão: ${error.message || 'Erro desconhecido'}`;

        if (error.message && (error.message.includes('API key not valid') || error.message.includes('invalid-api-key'))) {
            errorMessage = 'A Chave de API (apiKey) parece ser inválida. Verifique suas credenciais.';
        } else if (error.message && error.message.includes('project ID')) {
            errorMessage = 'O ID do Projeto (projectId) parece estar incorreto. Verifique suas credenciais.';
        } else if (error.message && error.message.includes('permission-denied')) {
            errorMessage = 'Conexão bem-sucedida, mas a permissão foi negada. Verifique suas Regras de Segurança do Firestore.';
        } else if (error.message && error.message.includes('Failed to fetch')) {
            errorMessage = 'Falha na conexão de rede. Verifique seu acesso à internet e se o domínio está autorizado no Firebase.';
        }
        
        return { success: false, error: errorMessage };
    } finally {
        if (testApp) {
            await deleteApp(testApp);
        }
    }
};

export { auth, db, configError };