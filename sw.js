const CACHE = 'kombo-language-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;

  if (isFont) {
    // font: pakai cache dulu, perbarui di belakang
    e.respondWith(
      caches.match(r).then(hit => {
        const net = fetch(r).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(r, copy));
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  // file aplikasi: utamakan versi terbaru dari internet, cadangan dari cache saat offline
  e.respondWith(
    fetch(r).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(r, copy));
      return res;
    }).catch(() => caches.match(r).then(hit => hit || caches.match('index.html')))
  );
});
