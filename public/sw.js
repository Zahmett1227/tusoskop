/**
 * PWA shell — navigation: network-first; offline fallback to precached index.
 * Hash'li /assets/* yalnızca ağdan. Cross-origin (Firebase/Auth/API) bu SW kapsamı dışı.
 */
const CACHE_NAME = "tusoskop-shell-v3";
/** Sabit, hash'siz kabuk dosyaları — offline navigation fallback için */
const SHELL = ["/", "/index.html", "/manifest.json", "/favicon.png"];

async function navigationFallback(request) {
  return (
    (await caches.match(request)) ||
    (await caches.match("/index.html")) ||
    (await caches.match("/"))
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Vite üretimi: hash'li chunk'lar — yalnızca ağ (stale önbellek = 404 riski)
  if (url.pathname.startsWith("/assets/") || url.pathname === "/sw.js") {
    event.respondWith(fetch(event.request));
    return;
  }

  // Ana belge: önce ağ; başarılıysa güncel shell'i cache'e yaz, offline'da fallback
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response?.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put("/index.html", response.clone());
            await cache.put("/", response.clone());
          }
          return response;
        })
        .catch(() => navigationFallback(event.request))
    );
    return;
  }

  // Diğer GET (manifest, favicon vb.): önbellek varsa kullan, yoksa ağ
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
