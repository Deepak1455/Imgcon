const CACHE_NAME = 'imgcon-cache-v4.7';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/imgconblog.js',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/logo.png', // ऑफ़लाइन PWA इंस्टॉलेशन सपोर्ट के लिए लोगो जोड़ा गया है
    'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// 1. Install Event - Caching App Shell
self.addEventListener('install', event => {
    // skipWaiting() ब्राउज़र को तुरंत नया सर्विस वर्कर सक्रिय करने के लिए बाध्य करता है
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Activate Event - Cleaning up old caches (Crucial Optimization)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    // यदि पुराना कैशे नाम वर्तमान CACHE_NAME से मेल नहीं खाता, तो उसे डिलीट करें
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing Old Cache...', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim()) // नया सर्विस वर्कर तुरंत सभी क्लाइंट्स पर नियंत्रण ले लेता है
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
