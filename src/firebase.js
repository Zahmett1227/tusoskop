import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAnalytics, logEvent } from "firebase/analytics";
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

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    trackClarityEvent("login_basarili");
    return result.user;
  } catch (error) {
    trackClarityEvent("login_hatasi");
    console.error("Google giriş hatası:", error);
    alert("Google giriş hatası: " + error.message);
  }
};

export const logout = () => signOut(auth);

export const db = getFirestore(app);
export const functions = getFunctions(app);

export const analytics = getAnalytics(app);
logEvent(analytics, 'page_view');
