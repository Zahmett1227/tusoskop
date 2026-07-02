/**
 * /coz mikro deneme akışı için merkezi ölçümleme katmanı.
 *
 * İki kanal:
 *   1. Firebase Analytics (GA4)  -> trackPublicQuizEvent(name, params)
 *   2. Meta Pixel (opsiyonel)     -> ensureMetaPixel() + trackMetaStandard/Custom
 *
 * Tasarım ilkeleri:
 *  - Ana `firebase.js` (auth + firestore) YÜKLENMEDEN çalışır: analytics için
 *    firebase/app + firebase/analytics dinamik import edilir, app zaten
 *    başlatılmışsa yeniden kullanılır.
 *  - Analytics veya Pixel yoksa tüm çağrılar sessiz no-op olur; uygulama çökmez.
 *  - Pixel ID environment variable'dan gelir (VITE_META_PIXEL_ID). Boşsa Pixel
 *    hiç yüklenmez.
 */
import { FIREBASE_CONFIG } from "./firebaseConfig";
import { initMetaPixel } from "./metaPixel";

/* -------------------------------------------------------------------------- */
/* Firebase Analytics                                                          */
/* -------------------------------------------------------------------------- */

let analyticsInstance = null;
let analyticsInitStarted = false;

async function ensureAnalytics() {
  if (analyticsInstance) return analyticsInstance;
  if (analyticsInitStarted) return analyticsInstance;
  analyticsInitStarted = true;
  if (typeof window === "undefined") return null;
  try {
    const [{ getApps, getApp, initializeApp }, { getAnalytics, isSupported }] =
      await Promise.all([import("firebase/app"), import("firebase/analytics")]);
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;
    const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
    analyticsInstance = getAnalytics(app);
  } catch (error) {
    if (import.meta.env.DEV) console.warn("publicQuiz analytics init failed:", error);
    analyticsInstance = null;
  }
  return analyticsInstance;
}

/** GA4 parametreleri: undefined/null ayıkla, string'leri makul boyuta kırp. */
function sanitizeParams(params = {}) {
  const out = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    out[key] = typeof value === "string" ? value.slice(0, 100) : value;
  }
  return out;
}

/**
 * @param {string} eventName
 * @param {Record<string, unknown>} [params]
 */
export async function trackPublicQuizEvent(eventName, params = {}) {
  try {
    const analytics = await ensureAnalytics();
    if (!analytics) return;
    const { logEvent } = await import("firebase/analytics");
    logEvent(analytics, eventName, sanitizeParams(params));
  } catch (error) {
    if (import.meta.env.DEV) console.warn(`trackPublicQuizEvent(${eventName}) failed:`, error);
  }
}

/* -------------------------------------------------------------------------- */
/* Meta Pixel                                                                  */
/* -------------------------------------------------------------------------- */

export function isMetaPixelConfigured() {
  return Boolean(String(import.meta.env.VITE_META_PIXEL_ID || "").trim());
}

/**
 * Pixel'in yüklendiğinden emin olur. Mevcut merkezi `initMetaPixel()`'i
 * yeniden kullanır (idempotent) — böylece funnel kendi pixel bootstrap'ını
 * kurmaz ve çift init/PageView oluşmaz. `initMetaPixel` zaten main.jsx'te
 * global çağrılıyor; buradaki çağrı funnel event'lerinden önce fbq stub'ının
 * hazır olmasını garanti eder.
 */
export function ensureMetaPixel() {
  initMetaPixel();
}

export function trackMetaStandard(eventName, params = {}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    window.fbq("track", eventName, params);
  } catch (error) {
    if (import.meta.env.DEV) console.warn(`Meta track(${eventName}) failed:`, error);
  }
}

export function trackMetaCustom(eventName, params = {}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    window.fbq("trackCustom", eventName, params);
  } catch (error) {
    if (import.meta.env.DEV) console.warn(`Meta trackCustom(${eventName}) failed:`, error);
  }
}
