// Service worker : fonctionne hors ligne, mais récupère toujours la version la plus récente quand le réseau est là.
const CACHE = 'hc-v3';
const FICHIERS = ['./', 'index.html', 'style.css', 'script.js', 'manifest.json', 'icon.svg'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(noms => Promise.all(noms.filter(n => n !== CACHE).map(n => caches.delete(n))))
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    e.respondWith(
        fetch(e.request, { cache: 'no-cache' })
            .then(rep => {
                const copie = rep.clone();
                caches.open(CACHE).then(c => c.put(e.request, copie));
                return rep;
            })
            .catch(() => caches.match(e.request))
    );
});
