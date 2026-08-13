/* Chrono Studio service worker.

   This origin is shared with every other project published under the same
   GitHub Pages account, so this worker is written to be a good neighbour as
   well as a safe one:

     - It only ever touches caches whose name begins with CACHE_PREFIX.
       Never `caches.keys()` + delete-everything-else, which would wipe the
       offline caches belonging to unrelated projects on this origin.
     - It only ever reads from its own cache. Never the global `caches.match()`,
       which searches every cache on the origin and could serve, or be served,
       another project's content.
     - It only handles same-origin GETs inside its own scope. Requests belonging
       to any other project fall straight through to the network untouched.
     - It has no message handler, so no page can ask it to fetch or reveal
       anything on its behalf.

   Bump CACHE_VERSION whenever you change index.html so devices pick up the build. */

const CACHE_PREFIX  = 'chrono-studio-';
const CACHE_VERSION = 'v21';
const CACHE = CACHE_PREFIX + CACHE_VERSION;

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
      .then(keys => Promise.all(
        keys
          // Only our own old versions. Anything else on this origin is
          // another project's and is none of our business.
          .filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url, scope;
  try {
    url = new URL(req.url);
    scope = new URL(self.registration.scope);
  } catch (err) { return; }

  // Anything outside our own origin and our own scope is left entirely alone.
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(scope.pathname)) return;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      // Scoped to our cache only — never the origin-wide caches.match().
      cache.match(req).then(hit => {
        const net = fetch(req).then(res => {
          if (res && res.ok && res.type === 'basic') {
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        });
        if (hit) return hit;
        return net.catch(() => cache.match('./index.html'));
      })
    )
  );
});
