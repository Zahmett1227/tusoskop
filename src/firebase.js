import { initializeApp } from "firebase/app";
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import {
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
} from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { trackClarityEvent } from "./lib/clarity";

const firebaseConfig = {
  apiKey: "AIzaSyBF8gh8mOeCpPgbfX_0jP_Fg47wyUXs278",
  authDomain: "tusoskop.firebaseapp.com",
  projectId: "tusoskop",
  storageBucket: "tusoskop.firebasestorage.app",
  messagingSenderId: "447547841381",
  appId: "1:447547841381:web:5ac74af2196a71be6b1f8c",
  measurementId: "G-P5BCLN20L3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");
appleProvider.setCustomParameters({ locale: "tr" });

/** Capacitor native platform kontrolü — web build'i kırmadan global üzerinden. */
function isNativePlatform() {
  return Boolean(
    typeof window !== "undefined" &&
    window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === "function" &&
    window.Capacitor.isNativePlatform()
  );
}

/**
 * Native (Capacitor iOS/Android) Google girişi.
 * `@codetrix-studio/capacitor-google-auth` plugini kuruluysa global
 * `window.Capacitor.Plugins.GoogleAuth` üzerinden erişilir; böylece web
 * build'i bu paketi bundle etmeye çalışmaz. Plugin idToken döndürür,
 * onu Firebase credential'ına çevirip signInWithCredential ile giriş yaparız.
 */
async function loginWithGoogleNative() {
  const GoogleAuth = window?.Capacitor?.Plugins?.GoogleAuth;
  if (!GoogleAuth || typeof GoogleAuth.signIn !== "function") {
    const err = new Error("Google girişi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.");
    err.userMessage = err.message;
    throw err;
  }
  const result = await GoogleAuth.signIn();
  const idToken = result?.authentication?.idToken;
  if (!idToken) {
    const err = new Error("Google girişi tamamlanamadı.");
    err.userMessage = err.message;
    throw err;
  }
  const credential = GoogleAuthProvider.credential(idToken);
  const userCred = await signInWithCredential(auth, credential);
  return userCred.user;
}

/**
 * Google girişi. Native platformda Capacitor GoogleAuth plugini, web'de
 * popup (gerekirse redirect fallback) kullanılır.
 *
 * Kullanıcıya gösterilecek mesaj `error.userMessage` alanında döner;
 * çağıran taraf bunu toast ile gösterir. Sessiz iptallerde `null` döner.
 */
export const loginWithGoogle = async () => {
  try {
    if (isNativePlatform()) {
      const user = await loginWithGoogleNative();
      trackClarityEvent("login_basarili");
      logAnalyticsEvent("login", { method: "google" }); // Firebase Analytics event
      return user;
    }
    const result = await signInWithPopup(auth, googleProvider);
    trackClarityEvent("login_basarili");
    logAnalyticsEvent("login", { method: "google" }); // Firebase Analytics event
    return result.user;
  } catch (error) {
    trackClarityEvent("login_hatasi");
    console.error("Google giriş hatası:", error);

    const code = error?.code || "";
    if (code === "auth/unauthorized-domain") {
      const err = new Error("Bu adres Google girişi için yetkili değil. Lütfen sayfayı yenileyip tekrar deneyin.");
      err.userMessage = err.message;
      throw err;
    }

    if (code === "auth/popup-blocked") {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectError) {
        console.error("signInWithRedirect fallback hatası:", redirectError);
        const err = new Error("Tarayıcınız popup'ı engelledi. Lütfen popup'lara izin verip tekrar deneyin.");
        err.userMessage = err.message;
        throw err;
      }
    }

    if (code === "auth/cancelled-popup-request" || code === "auth/popup-closed-by-user") {
      return null;
    }

    const err = new Error(error?.userMessage || "Google girişi başarısız oldu. Lütfen tekrar deneyin.");
    err.userMessage = err.message;
    throw err;
  }
};

/**
 * Apple girişi — web'de popup (gerekirse redirect fallback).
 * Sessiz iptallerde null döner; hatalar userMessage ile fırlatılır.
 */
export const loginWithApple = async () => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    trackClarityEvent("apple_login_basarili");
    logAnalyticsEvent("login", { method: "apple" }); // Firebase Analytics event
    return result.user;
  } catch (error) {
    trackClarityEvent("apple_login_hatasi");
    console.error("Apple giriş hatası:", error);

    const code = error?.code || "";
    if (code === "auth/popup-blocked") {
      try {
        await signInWithRedirect(auth, appleProvider);
      } catch (redirectError) {
        console.error("Apple signInWithRedirect fallback hatası:", redirectError);
        const err = new Error("Tarayıcınız popup'ı engelledi. Lütfen popup'lara izin verip tekrar deneyin.");
        err.userMessage = err.message;
        throw err;
      }
      return null;
    }

    if (code === "auth/cancelled-popup-request" || code === "auth/popup-closed-by-user") {
      return null;
    }

    if (code === "auth/operation-not-allowed") {
      const err = new Error("Apple ile giriş Firebase Console üzerinde henüz etkinleştirilmemiş.");
      err.userMessage = err.message;
      throw err;
    }

    const err = new Error(error?.message || "Apple ile giriş başarısız oldu. Lütfen tekrar deneyin.");
    err.userMessage = err.message;
    throw err;
  }
};

/**
 * Sayfa yüklendiğinde redirect dönüşünü güvenli işle.
 * Popup-first akış için artık zorunlu değil; yalnızca popup-blocked
 * fallback'i tetiklendiğinde state'i temizler.
 */
export async function consumePendingRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    trackClarityEvent("login_basarili");
    return result.user;
  } catch (error) {
    if (error?.code !== "auth/no-auth-event") {
      console.error("getRedirectResult error:", error);
    }
    return null;
  }
}

export const logout = () => signOut(auth);

/**
 * Firestore offline persistence: oturumlar arası sorgu cache'i.
 * TopicTracker ve smart review onSnapshot abonelikleri ilk açılışta cache'den
 * anında dönerek cihazlar arası geçişte hızlı veri sağlar.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED }),
});

/** Match deployed Cloud Functions region (`incrementUsage` is `us-central1`). */
export const functions = getFunctions(app, "us-central1");


export async function initAnalytics() {
  if (typeof window === "undefined") return null;
  try {
    const { getAnalytics, logEvent } = await import("firebase/analytics");
    const analytics = getAnalytics(app);
    logEvent(analytics, "page_view");
    return analytics;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Analytics init failed:", error);
    }
    return null;
  }
}

/** Lazy-load analytics ve event gönder; hata olursa sessizce geç. */
export async function logAnalyticsEvent(eventName, params) {
  if (typeof window === "undefined") return;
  try {
    const { getAnalytics, logEvent } = await import("firebase/analytics");
    const analytics = getAnalytics(app);
    logEvent(analytics, eventName, params);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Analytics event failed:", eventName, error);
    }
  }
}
