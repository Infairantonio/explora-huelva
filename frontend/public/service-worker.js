// frontend/public/service-worker.js
// PWA manual para Explora Huelva

const CACHE_NAME = "explorahuelva-cache-v1";

self.addEventListener("install", (event) => {
  // Podríamos precachear assets aquí si queremos
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Eliminar caches antiguas
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 1) Rutas de API: network-first con fallback a cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Aquí podrías opcionalmente cachear ciertas respuestas de API
          return networkResponse;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response("Offline y sin cache disponible", {
              status: 503,
              statusText: "Service Unavailable",
            });
          })
        )
    );
    return;
  }

  // 2) Resto de recursos: cache-first con actualización en background
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Si falla la red, usamos lo que haya en cache
            if (cachedResponse) return cachedResponse;
            return new Response("Offline", {
              status: 503,
              statusText: "Service Unavailable",
            });
          });

        // Devolvemos cache si existe, si no, tiramos de red
        return cachedResponse || fetchPromise;
      })
    )
  );
});
