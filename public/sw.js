const CACHE_NAME = "minha-rotina-shell-v2";
const SHELL_ASSETS = ["/", "/minha-rotina-logo-192.png", "/minha-rotina-preview.jpg"];
const MAX_CACHE_ENTRIES = 80;

async function trimCache(cache) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(keys.length - MAX_CACHE_ENTRIES, 0)).map((key) => cache.delete(key)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  const networkRequest = fetch(request).then((response) => ({ response, copy: response.clone() }));

  event.respondWith(
    networkRequest
      .then(({ response }) => response)
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
  event.waitUntil(
    networkRequest
      .then(async ({ copy }) => {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, copy);
        await trimCache(cache);
      })
      .catch(() => undefined)
  );
});
