const CACHE_NAME = 'kiosk-v6';
const ASSETS = [
    '/',
    '/style.css',
    '/script.js',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;800&family=Noto+Kufi+Arabic:wght@400;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

self.addEventListener('install', e => {
    self.skipWaiting(); // Force activate new worker immediately
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => 
            Promise.all(keys.map(k => {
                if (k !== CACHE_NAME) return caches.delete(k);
            }))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    // Network First strategy for everything
    e.respondWith(
        fetch(e.request).catch(() => {
            return caches.match(e.request).then(cached => {
                if (cached) return cached;
                if (e.request.url.includes('/api/')) {
                    return new Response(JSON.stringify({ error: 'أنت غير متصل بالإنترنت' }), 
                        { headers: { 'Content-Type': 'application/json' } });
                }
            });
        })
    );
});
