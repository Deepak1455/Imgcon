/**
 * ==========================================================================
 * SW.JS - ImgCon High-Performance PWA Service Worker (v4.3.0)
 * (Full Offline Caching, Clean Navigation Fallbacks & Auto Cache Cleanup)
 * ==========================================================================
 */

const CACHE_NAME = 'imgcon-cache-v4.3.0';

// ऑफलाइन काम करने के लिए आवश्यक सभी कोर फाइल्स
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
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css'
];

// 1. Install Event - Caching App Shell
self.addEventListener('install', event => {
    // ब्राउज़र को तुरंत नया सर्विस वर्कर एक्टिवेट करने के लिए विवश करता है
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).catch(err => {
            console.warn('PWA Pre-caching partial error:', err);
        })
    );
});

// 2. Activate Event - Purging Outdated Caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Purging Old Cache...', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim()) // तुरंत सभी ओपन टैब्स पर नियंत्रण लेता है
    );
});

// 3. Fetch Event - Smart Cache-First Strategy with Offline SPA Support
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Google AdSense, Analytics और OpenStreetMap API को कैशे बाईपास करने दें
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
            if (cachedResponse) {
                return cachedResponse;
            }

            // अगर नेटवर्क से रिक्वेस्ट आ रही है, तो उसे फेच करें
            return fetch(event.request).then(networkResponse => {
                // वैध रिस्पॉन्स को ही कैशे में सेव करें
                if (
                    !networkResponse ||
                    networkResponse.status !== 200 ||
                    networkResponse.type !== 'basic'
                ) {
                    return networkResponse;
                }

                // इमेज और एसेट्स को बैकग्राउंड में डायनामिकली कैशे करें
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // ऑफलाइन होने पर अगर HTML पेज लोड हो रहा है, तो index.html दें (SPA सपोर्ट)
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
