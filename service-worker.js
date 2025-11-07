// service-worker.js

const CACHE_NAME = 'contaflux-ia-cache-v1';
// Apenas os recursos essenciais do shell do aplicativo são pré-armazenados em cache.
// Outros recursos (como scripts de CDN, fontes) serão armazenados em cache dinamicamente na primeira solicitação.
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/apple-touch-icon.png',
];

// Evento de Instalação: Pré-armazena em cache o shell do aplicativo.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Armazenando o shell do aplicativo em cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Evento de Ativação: Limpa caches antigos para manter tudo atualizado.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Excluindo cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento de Fetch: Intercepta as solicitações de rede.
self.addEventListener('fetch', (event) => {
  // CORREÇÃO: Permite que as solicitações do Firebase/Google passem diretamente para a rede, sem interceptação.
  // O Firestore tem seu próprio e robusto mecanismo de cache e persistência offline.
  // Interceptar essas solicitações impede que ele funcione corretamente. Simplesmente retornando,
  // deixamos o navegador lidar com a solicitação como se o service worker não existisse para ela.
  if (event.request.url.includes('firebase') || event.request.url.includes('googleapis')) {
    return;
  }

  // Para todas as outras solicitações, aplica a estratégia "cache, falling back to network".
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Se a resposta for encontrada no cache, retorna-a.
      if (response) {
        return response;
      }

      // Caso contrário, busca na rede.
      return fetch(event.request).then((response) => {
        // Se recebermos uma resposta válida da rede, nós a armazenamos em cache para uso futuro.
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});
