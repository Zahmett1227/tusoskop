/** Üretimde PWA service worker kaydı */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* kayıt başarısız — uygulama yine de çalışır */
    });
  });
}
