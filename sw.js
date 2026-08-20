/**
 * ==========================================================================
 * SW.JS - ImgCon High-Performance PWA Service Worker (v4.4.0)
 * (Full Offline Caching, Instant Cache Cleanup & Zero Stale Bug Engine)
 * ==========================================================================
 */

const CACHE_NAME = 'imgcon-cache-v4.4.0';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/image-converter',
    '/image-compressor',
    '/image-resizer',
    '/image-watermark',
    '/exif-cleaner',
    '/about-us',
    '/blog',
    '/privacy-policy',
    '/terms-conditions',
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
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css'
];

self.addEventListener('install', event => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)).catch(err => console.warn('PWA Cache error:', err))
    );
});

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

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    if (
        url.hostname.includes('google') ||
        url.hostname.includes('googlesyndication') ||
        url.hostname.includes('googletagmanager') ||
        url.hostname.includes('nominatim.openstreetmap.org') ||
        event.request.method !== 'GET'
    ) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                return networkResponse;
            }).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
