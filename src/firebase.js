import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { trackClarityEvent } from "./lib/clarity";

/** Tek Analytics örneği — logEvent için paylaşılır */
let analyticsPromise = null;

function getAnalyticsSingleton() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = import("firebase/analytics")
      .then(({ getAnalytics, logEvent }) => {
        const analytics = getAnalytics(app);
        logEvent(analytics, "page_view");
        return analytics;
      })
      .catch((error) => {
        console.warn("Analytics init failed:", error);
        return null;
      });
  }
  return analyticsPromise;
}

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

    const shouldRedirect = [
      "auth/popup-blocked",
      "auth/cancelled-popup-request",
      "auth/operation-not-supported-in-this-environment",
    ].includes(code);

    if (shouldRedirect) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    alert("Google giriş hatası: " + (error?.message || "Bilinmeyen hata"));
    return null;
  }
};

export const logout = () => signOut(auth);

export const db = getFirestore(app);
export const functions = getFunctions(app);


export async function initAnalytics() {
  return getAnalyticsSingleton();
}

/**
 * Firebase Analytics (GA4) özel olay — huni ve kampanya ölçümü için.
 * @param {string} eventName
 * @param {Record<string, unknown>} [params]
 */
export async function logMarketingEvent(eventName, params = {}) {
  if (!eventName || typeof window === "undefined") return;
  try {
    const analytics = await getAnalyticsSingleton();
    if (!analytics) return;
    const { logEvent } = await import("firebase/analytics");
    logEvent(analytics, eventName, params);
  } catch (error) {
    console.warn("logMarketingEvent failed:", eventName, error);
  }
}

/**
 * SPA “ekran” izlenmesi — GA4’te screen_view.
 * @param {string} screenName — iç view adı (örn. dashboard, exam)
 */
export async function logScreenViewFirebase(screenName) {
  if (!screenName) return;
  await logMarketingEvent("screen_view", {
    firebase_screen: screenName,
    firebase_screen_class: screenName,
  });
}