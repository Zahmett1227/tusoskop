/**
 * PWA kabuk — index.html asla uzun süre önbelleğe alınmaz; böylece yeni deploy’daki
 * asset hash’leri (ör. index-*.css) ile HTML hep uyumlu kalır.
 */
const CACHE_NAME = "tusoskop-shell-v2";
/** Sadece gerçekten sabit, hash’siz dosyalar */
const SHELL = ["/manifest.json", "/favicon.png"];

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

  // Vite üretimi: hash’li chunk’lar — yalnızca ağ (stale önbellek = 404 riski)
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Ana belge: önce ağ, böylece her deploy sonrası güncel index.html gelir
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Diğer GET: önbellek varsa kullan, yoksa ağ
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
