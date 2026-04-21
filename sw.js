/**
 * 🔧 Service Worker для офлайн-работы и PWA
 */

/*const CACHE_NAME = 'finance-app-v' + Date.now();*/
const CACHE_NAME = 'finance-app-v1.2';
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/config.js',
    '/js/data.js',
    '/js/ui.js',
    '/js/app.js',
    '/manifest.json',
];

// Установка: кэшируем статику
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Активация: чистим старые кэши
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((names) =>
            Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
        )
    );
    self.clients.claim();
});

// Запрос: сначала кэш, потом сеть
self.addEventListener('fetch', (e) => {
    // Google Apps Script запросы пропускаем
    if (e.request.url.includes('script.google.com')) {
        e.respondWith(fetch(e.request));
        return;
    }

    e.respondWith(
        caches.match(e.request).then((res) =>
            res || fetch(e.request).then((network) => {
                // Кэшируем успешные ответы
                if (network.ok && e.request.method === 'GET') {
                    const clone = network.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                }
                return network;
            })
        )
    );
});