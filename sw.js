// Nombre de la caché
const CACHE_NAME = 'horario-1cv-cache-v2';

// Archivos para cachear
const urlsToCache = [
  '/',
  'index.html',
  'horario.jpg'
];

// Evento de instalación: se abre la caché y se añaden los archivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento fetch: responde desde la caché si es posible
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en la caché, lo devuelve. Si no, lo busca en la red.
        return response || fetch(event.request);
      })
  );
});