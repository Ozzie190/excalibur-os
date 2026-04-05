// Excalibur OS — Service Worker
var CACHE = 'excalibur-v1';
var CACHED = [
  '/', '/index.html', '/manifest.json', '/icon.svg',
  '/css/core.css', '/css/modules.css',
  '/js/utils.js', '/js/events.js', '/js/state.js', '/js/router.js',
  '/js/data/supplement-db.js', '/js/data/supplement-builtin.js',
  '/js/data/exercise-db.js', '/js/data/practice-db.js', '/js/data/cross-rules.js',
  '/js/modules/recovery.js', '/js/modules/supplements.js', '/js/modules/workout.js',
  '/js/modules/habits.js', '/js/modules/practice.js', '/js/modules/wearable.js',
  '/js/modules/dashboard.js', '/js/modules/insights.js',
  '/js/workers/rest-timer.js'
];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(CACHED); }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.filter(function(n) { return n !== CACHE; }).map(function(n) { return caches.delete(n); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.url.startsWith(self.location.origin)) {
    e.respondWith(caches.match(e.request).then(function(r) { return r || fetch(e.request); }));
  }
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(e.data.title, {
      body: e.data.body, tag: e.data.tag || 'exc',
      vibrate: [200, 100, 200], icon: '/icon.svg'
    });
  }
});
