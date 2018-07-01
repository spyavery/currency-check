/**
 * Author: Emmanuel SpyAvery Iyogun
 * Version: 1.0
 * Signature: spyavery
 */

//add all caches
var appCacheName = 'ccheck-static-v3';
var appCacheAssets = [
    '/',
    'css/app.css',
    'js/app.js',
    'manifest.json',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://maxcdn.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css',
    'https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.0/umd/popper.min.js',
    'https://maxcdn.bootstrapcdn.com/bootstrap/4.1.0/js/bootstrap.min.js',
    'https://free.currencyconverterapi.com/api/v5/currencies',
    'https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js'
];

// When cache is installed
self.addEventListener('install', function(event){
    event.waitUntil(
        caches.open(appCacheName).then(function(cache){
            return cache.addAll(appCacheAssets);
        })
    );
});

// new event activated
self.addEventListener('activate', function(event){
    event.waitUntil(
        caches.keys().then(function(cacheNames){
            return Promise.all(
                cacheNames.filter(function(cacheName){
                    return cacheName.startsWith('wnes-') && cacheName !== appCacheName;
                }).map(function(cacheName){
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

// get results
self.addEventListener('fetch', function(event){
    event.respondWith(
        caches.match(event.request).then(function(response){
            if(response){
                return response;
            }
            return fetch(event.request);
        })
    );
});

// display a message
self.addEventListener('message', function(event){
    if(event.data.action == 'skipWaiting'){
        self.skipWaiting();
    }
});