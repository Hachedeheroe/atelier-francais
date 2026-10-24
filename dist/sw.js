const CACHE_NAME = 'atelier-francais-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './style.css?v=7dff278f9599',
  './games.css?v=8cc6e59dba80',
  './adventure.css?v=ae957b2472a8',
  './verb-game.css?v=7833f827b871',
  './rewards.css?v=c08f463de145',
  './photos.css?v=9446134a1bf1',
  './mission-verbs.css?v=d6dbca1887a4',
  './verb-tips.css?v=f927e4edabb7',
  './verb-lessons.css?v=c4a1cb4e2d06',
  './exam-review.css?v=356e6e4d9f7b',
  './serious.css?v=499da70e8057',
  './illustrations/fleur.svg',
  './illustrations/apple-touch-icon.png',
  './illustrations/icon-192.png',
  './illustrations/icon-512.png',
  './visuals.js?v=f892cfa4dcc0',
  './rewards.js?v=25097bcbbe27',
  './games.js?v=3d4933de0577',
  './adventure.js?v=e2f23743f04d',
  './conjugation-audio.js?v=f382fd13d100',
  './verb-tips.js?v=a2239fab85ee',
  './verb-game.js?v=3ec6416d9463',
  './mission-verbs.js?v=f91ce5aa5431',
  './verb-lessons.js?v=e5f03bae6c68',
  './exam-review.js?v=56d25145fde2',
  './app.js?v=17964d7e7e33',
  './data/library.js?v=208dd147573f',
  './data/audio-texts.js?v=670504650c92',
  './data/expressions.js?v=fad95fae4fb5',
  './data/pictures.js?v=9c5faa2f5ef0',
  './data/catalog-images.js?v=6a47949d1f25',
  './data/conjugation-audio.js?v=1269a55657e8',
  './data/locution-review.js?v=94704d6b1aa4',
  './data/vocabulary-review.js?v=3aade18f5646',
  './data/verb-tips.js?v=44f9e4bedeae',
  './data/verb-missions.js?v=8342d99b5965',
  './data/verb-lessons.js?v=3fb2d22962a8',
  './data/exam-review.js?v=3b67a644b64d'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Fallo al precargar recurso:', url, err);
          })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // Devuelve inmediatamente la copia descargada en el móvil
        return cached;
      }
      return fetch(req)
        .then((networkResp) => {
          if (networkResp && networkResp.status === 200) {
            const clone = networkResp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResp;
        })
        .catch(() => {
          // Si no hay red y se pedía la página HTML, devolver la portada
          if (req.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html') || caches.match('./');
          }
        });
    })
  );
});
