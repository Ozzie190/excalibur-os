// Biohack OS — Service Worker
// Offline caching + notification handling

var CACHE = 'biohack-v5';
var CACHED = ['/', '/index.html', '/supplement-db.js', '/manifest.json', '/icon.svg'];

// Install: cache all core files
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(CACHED.map(function(u) {
        return new Request(u, {cache: 'reload'});
      }));
    })
  );
});

// Activate: purge old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) {
        return k !== CACHE;
      }).map(function(k) {
        return caches.delete(k);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: cache-first for same-origin, network-first for others
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var fetchPromise = fetch(e.request).then(function(res) {
        if (res && res.status === 200) {
          var clone = res.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        }
        return res;
      });
      return cached || fetchPromise;
    })
  );
});

// Notification click: bring app to foreground
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(wcs) {
      for (var i = 0; i < wcs.length; i++) {
        if ('focus' in wcs[i]) return wcs[i].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

// Message from app: show scheduled notification
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: e.data.tag || 'biohack',
      renotify: true,
      vibrate: [200, 100, 200]
    });
  }
});
