import { initializeApp } from "firebase/app";
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
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
import { signInWithNativeApple, signInWithNativeGoogle } from "./services/nativeAuthService";
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

/** Capacitor native platform kontrolü — web build'i kırmadan global üzerinden. */
function isNativePlatform() {
  return Boolean(
    typeof window !== "undefined" &&
    window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === "function" &&
    window.Capacitor.isNativePlatform()
  );
}

// Native Google giriş — @capacitor-firebase/authentication plugini kullanır (Apple ile aynı yaklaşım)
async function loginWithGoogleNative() {
  return signInWithNativeGoogle(auth);
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
      return user;
    }
    const result = await signInWithPopup(auth, googleProvider);
    trackClarityEvent("login_basarili");
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

export const loginWithApple = async () => {
  if (isNativeIOS()) {
    try {
      const user = await signInWithNativeApple(auth, appleProvider);
      trackClarityEvent("apple_native_login_basarili");
      return user;
    } catch (error) {
      const msg = String(error?.message || error?.code || "");
      // Kullanıcı iptal etti — hata gösterme
      if (
        msg.includes("cancel") ||
        msg.includes("Cancel") ||
        msg.includes("1001") ||
        msg.includes("dismissed") ||
        error?.code === "1001"
      ) {
        return null;
      }
      trackClarityEvent("apple_native_login_hatasi");
      console.error("Native Apple giriş hatası:", error);
      const code = error?.code ? ` (${error.code})` : "";
      alert(
        "Apple ile giriş tamamlanamadı." +
          code +
          "\n" +
          (error?.message || "Lütfen tekrar deneyin.")
      );
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

const APP_REVIEW_EMAIL = "apple-review@tusoskop.com";

export const loginWithAppReviewEmail = async (email, password) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (normalizedEmail !== APP_REVIEW_EMAIL) {
    const err = new Error("Bu giriş alanı yalnız App Review hesabı içindir.");
    err.userMessage = err.message;
    throw err;
  }
  try {
    const result = await signInWithEmailAndPassword(auth, APP_REVIEW_EMAIL, password);
    trackClarityEvent("app_review_email_login_basarili");
    return result.user;
  } catch (error) {
    trackClarityEvent("app_review_email_login_hatasi");
    const err = new Error("App Review girişi başarısız oldu. Email veya şifreyi kontrol edin.");
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
