// firebase/credentials.ts

// PASSO 1: Obtenha suas credenciais do Firebase
// 1. Vá para o Console do Firebase: https://console.firebase.google.com/
// 2. Selecione seu projeto (ou crie um novo).
// 3. Vá para "Configurações do Projeto" (ícone de engrenagem no canto superior esquerdo).
// 4. Na aba "Geral", role para baixo até "Seus aplicativos".
// 5. Se você ainda não tiver um aplicativo da Web, clique no ícone da Web (</>) para criar um.
// 6. Encontre o "Snippet de configuração do SDK" e selecione "Config".
// 7. Copie o objeto `firebaseConfig` inteiro (das chaves `{` até `}`).

// PASSO 2: Cole o objeto aqui
// Substitua o objeto `firebaseConfig` abaixo pelo que você copiou do Firebase.
// Exemplo:
// export const firebaseConfig = {
//   apiKey: "AIza...",
//   authDomain: "seu-projeto.firebaseapp.com",
//   projectId: "seu-projeto",
//   storageBucket: "seu-projeto.appspot.com",
//   messagingSenderId: "1234567890",
//   appId: "1:1234567890:web:abcdef123456",
//   measurementId: "G-ABCDEFGHIJ"
// };

export const firebaseConfig = {
  apiKey: "AIzaSyAq9EWFRjZbfx9qhdNpseddHmHOmQANFyw",
  authDomain: "contaflux-ia.firebaseapp.com",
  projectId: "contaflux-ia",
  storageBucket: "contaflux-ia.firebasestorage.app",
  messagingSenderId: "140831750091",
  appId: "1:140831750091:web:f6d1a9316195b3ad59e84e",
  measurementId: "G-T0Y8231LHT"
};

// --- (Opcional) Contas de Demonstração ---
// Se desejar, você pode definir e-mails específicos para os logins de demonstração.
// Se não, os valores padrão serão usados.
export const demoCredentials = {
    adminEmail: 'admin@contaflux.ia',
    contadorEmail: 'contador@contaflux.ia',
    // A senha para ambas as contas de demonstração é '123456'.
    // Você deve criar esses usuários manualmente no painel de Autenticação do Firebase.
};


// PASSO 3: É isso! A aplicação irá funcionar automaticamente após colar as credenciais.