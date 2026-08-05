/* Chrono Studio service worker.
   Deliberately narrow: it only ever touches same-origin GET requests that sit
   inside its own scope. It never caches opaque cross-origin responses, never
   proxies a third party, and has no message handler, so there is no path for
   another page to ask it to fetch or reveal anything.
   Bump CACHE whenever you change index.html so devices pick up the new build. */
const CACHE = 'chrono-v2';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const scope = new URL(self.registration.scope);

  // Anything outside our own origin and scope is none of this worker's business.
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(scope.pathname)) return;

  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        // Only store real, same-origin, successful responses.
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
      if (hit) return hit;
      return net.catch(() => caches.match('./index.html'));
    })
  );
});
