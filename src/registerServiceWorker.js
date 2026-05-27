import { shouldRegisterServiceWorker } from "./utils/device";

/** Üretimde PWA service worker kaydı */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;
  if (!shouldRegisterServiceWorker()) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* kayıt başarısız — uygulama yine de çalışır */
    });
  });
}
