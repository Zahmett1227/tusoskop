import { initializeApp } from "firebase/app";
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
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
import { signInWithNativeApple } from "./services/nativeAuthService";
import { isNativeIOS } from "./utils/device";

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

/**
 * Google girişi: önce popup; popup engellenmediği sürece redirect'e düşmez.
 * iOS Safari + ITP'de `signInWithRedirect` sessionStorage'ı kaybedip
 * "missing initial state" hatası verdiği için redirect yalnızca popup
 * gerçekten engellendiğinde son çare olarak kullanılır.
 */
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    trackClarityEvent("login_basarili");
    return result.user;
  } catch (error) {
    trackClarityEvent("login_hatasi");
    console.error("Google giriş hatası:", error);

    const code = error?.code || "";
    if (code === "auth/unauthorized-domain") {
      alert("Google giriş hatası: Bu adres Firebase Auth için yetkili değil. Yerelde localhost adresine yönlendiriliyorsunuz; sayfa yenilenince tekrar deneyin.");
      if (typeof window !== "undefined" && window.location.hostname === "127.0.0.1") {
        window.location.replace(`http://localhost:${window.location.port}${window.location.pathname}${window.location.search}${window.location.hash}`);
      }
      return null;
    }

    if (code === "auth/popup-blocked") {
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectError) {
        console.error("signInWithRedirect fallback hatası:", redirectError);
        alert("Google giriş hatası: Tarayıcınız popup'ı engelledi. Lütfen popup'lara izin verip tekrar deneyin.");
      }
      return null;
    }

    if (code === "auth/cancelled-popup-request" || code === "auth/popup-closed-by-user") {
      return null;
    }

    alert("Google giriş hatası: " + (error?.message || "Bilinmeyen hata"));
    return null;
  }
};

export const loginWithApple = async () => {
  if (isNativeIOS()) {
    try {
      const user = await signInWithNativeApple(auth, appleProvider);
      trackClarityEvent("apple_native_login_basarili");
      return user;
    } catch (error) {
      trackClarityEvent("apple_native_login_hatasi");
      console.error("Native Apple giriş hatası:", error);
      alert(error?.message || "Apple ile giriş tamamlanamadı. Lütfen tekrar deneyin.");
      return null;
    }
  }

  try {
    const result = await signInWithPopup(auth, appleProvider);
    trackClarityEvent("apple_login_basarili");
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
        alert("Apple giriş hatası: Tarayıcınız popup'ı engelledi. Lütfen popup'lara izin verip tekrar deneyin.");
      }
      return null;
    }

    if (code === "auth/cancelled-popup-request" || code === "auth/popup-closed-by-user") {
      return null;
    }

    if (code === "auth/operation-not-allowed") {
      alert("Apple ile giriş Firebase Console üzerinde henüz etkinleştirilmemiş görünüyor.");
      return null;
    }

    alert("Apple giriş hatası: " + (error?.message || "Bilinmeyen hata"));
    return null;
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
