import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDoc } from 'firebase/firestore';

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
    } catch (e) {
        const error = e as Error;
        console.error("Falha ao inicializar o Firebase. Verifique se as credenciais no arquivo 'firebase/credentials.ts' estão corretas.", error);
        configError = `Erro na inicialização do Firebase: ${error.message}. Verifique suas credenciais.`;
        auth = null;
        db = null;
    }
}

export const isConfigured = !configError;

/**
 * Tenta realizar uma operação de leitura de baixo custo para verificar a conexão com o Firestore.
 * @returns Um objeto indicando o sucesso e uma mensagem de erro, se houver.
 */
export const testFirebaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
    if (!db) {
        return { success: false, error: 'O cliente do Firestore não foi inicializado. Verifique as credenciais.' };
    }
    try {
        // Tenta ler um documento que provavelmente não existe. É uma operação de baixo custo.
        // Se a promessa for resolvida (mesmo que o doc não exista), a conexão está OK.
        const testDocRef = doc(db, '_internal_test_collection', '_connection_test_doc');
        await getDoc(testDocRef);
        return { success: true };
    } catch (e) {
        const error = e as Error;
        console.error('Falha no teste de conexão com o Firebase:', error);
        
        let userMessage = 'Falha na conexão. Verifique se as credenciais estão corretas e se você tem acesso à internet.';
        if (error.message.includes('permission-denied')) {
            // Se as regras de segurança negarem, a conexão em si foi bem-sucedida.
            return { success: true, error: 'Conectado, mas as Regras de Segurança negaram o acesso de leitura para o teste.' };
        }
        if (error.message.includes('Could not reach Firestore backend')) {
            userMessage = 'Não foi possível conectar ao Firebase. Verifique sua conexão com a internet.';
        }

        return { success: false, error: userMessage };
    }
};


export { auth, db, configError };