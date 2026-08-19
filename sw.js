const CACHE_NAME = 'imgcon-cache-v4.2.0';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/imageconverter.js',
    '/imagecompressor.js',
    '/imageresizer.js',
    '/imagewatermark.js',
    '/ExifData.js',
    '/imgconblog.js',
    '/script.js',
    '/style.css',
    '/manifest.json',
    '/logo.png',
    '/Deepak.png',
    'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// 1. Install Event - Caching App Shell
self.addEventListener('install', event => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Activate Event - Cleaning Old Caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Fetch Event - Cache First with Network Fallback
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
