import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
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
import { isNativeIOS, isNativePlatform } from "./utils/device";
import { clearLastProvider, saveLastProvider } from "./utils/authPersistence";

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

// Native giriş hatalarında kullanıcıya ham kod yerine sade bir mesaj göster.
// Ağ/zaman aşımı durumunda bağlantı uyarısı, aksi halde genel "tekrar dene".
function friendlyNativeAuthMessage(providerLabel, rawMessage) {
  const m = String(rawMessage || "").toLowerCase();
  const isNetwork =
    m.includes("zaman aşımı") ||
    m.includes("zaman asimi") ||
    m.includes("bağlant") ||
    m.includes("baglant") ||
    m.includes("network");
  const tail = isNetwork
    ? "İnternet bağlantınızı kontrol edip tekrar deneyin."
    : "Lütfen tekrar deneyin.";
  return `${providerLabel} ile giriş tamamlanamadı.\n${tail}`;
}

// Native WKWebView'de Firebase SDK v12, IndexedDB persistence başlatırken
// kilitlenerek sonraki tüm auth işlemlerini askıya alabiliyor.
// initializeAuth + browserLocalPersistence bu sorunu önler.
export const auth = isNativePlatform()
  ? initializeAuth(app, { persistence: [browserLocalPersistence] })
  : getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");
appleProvider.setCustomParameters({ locale: "tr" });

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
      saveLastProvider("google");
      trackClarityEvent("login_basarili");
      return user;
    }
    const result = await signInWithPopup(auth, googleProvider);
    saveLastProvider("google");
    trackClarityEvent("login_basarili");
    return result.user;
  } catch (error) {
    // Native platformda hata kodunu doğrudan göster (toast bazen kaçıyor)
    if (isNativePlatform()) {
      const code = String(error?.code ?? "");
      const msg = String(error?.message ?? "");
      if (import.meta.env.DEV) {
        console.error("[Google] loginWithGoogle native catch — code:", code, "msg:", msg);
      }
      // Kullanıcı iptal etti — sessizce geç
      const isCancelled =
        msg.toLowerCase().includes("cancel") ||
        msg.toLowerCase().includes("12501") ||
        code === "12501";
      if (isCancelled) {
        return null;
      }
      trackClarityEvent("login_hatasi");
      alert(friendlyNativeAuthMessage("Google", msg));
      return null;
    }
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
      saveLastProvider("apple");
      trackClarityEvent("apple_native_login_basarili");
      return user;
    } catch (error) {
      const code = String(error?.code ?? "");
      const msg = String(error?.message ?? "");
      if (import.meta.env.DEV) {
        console.error("[Apple] loginWithApple catch — code:", code, "msg:", msg);
      }

      // Kullanıcı iptal etti — hata gösterme
      // Sadece bilinen Apple iptal kodlarını sessizce geç
      const isCancelled =
        code === "1001" ||
        code === "com.apple.AuthenticationServices.AuthorizationError.1001" ||
        msg.toLowerCase().includes("user cancel") ||
        msg.toLowerCase().includes("error 1001") ||
        msg.toLowerCase().includes("dismissed");
      if (isCancelled) {
        return null;
      }

      trackClarityEvent("apple_native_login_hatasi");
      alert(friendlyNativeAuthMessage("Apple", msg));
      return null;
    }
  }

  try {
    const result = await signInWithPopup(auth, appleProvider);
    saveLastProvider("apple");
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
      alert("Apple ile giriş şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.");
      return null;
    }

    alert(friendlyNativeAuthMessage("Apple", error?.message));
    return null;
  }
};

const APP_REVIEW_EMAIL = "apple-review@tusoskop.com";
const AUTH_TIMEOUT_MS = 12000;

function withAuthTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Giriş zaman aşımına uğradı. İnternet bağlantınızı kontrol edin.")),
        AUTH_TIMEOUT_MS
      )
    ),
  ]);
}

export const loginWithAppReviewEmail = async (email, password) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (normalizedEmail !== APP_REVIEW_EMAIL) {
    const err = new Error("Bu giriş alanı yalnız App Review hesabı içindir.");
    err.userMessage = err.message;
    throw err;
  }
  try {
    if (import.meta.env.DEV) console.log("[Email] signInWithEmailAndPassword çağrılıyor...");
    const result = await withAuthTimeout(signInWithEmailAndPassword(auth, APP_REVIEW_EMAIL, password));
    if (import.meta.env.DEV) console.log("[Email] signInWithEmailAndPassword başarılı:", result.user?.uid);
    trackClarityEvent("app_review_email_login_basarili");
    return result.user;
  } catch (error) {
    if (import.meta.env.DEV) console.error("[Email] signInWithEmailAndPassword hatası:", error?.code, error?.message);
    trackClarityEvent("app_review_email_login_hatasi");
    const err = new Error(error?.message || "App Review girişi başarısız oldu. Email veya şifreyi kontrol edin.");
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
  // getRedirectResult is web-only; initializeAuth on native has no PopupRedirectResolver
  if (isNativePlatform()) return null;
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

export const logout = () => {
  // Auto-login fallback'in çıkıştan sonra tekrar giriş yapmasını engelle.
  clearLastProvider();
  return signOut(auth);
};

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
