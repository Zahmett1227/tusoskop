import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Giriş başarılı:", result.user);
    return result.user;
  } catch (error) {
    console.error("Google giriş hatası:", error);
    alert("Google giriş hatası: " + error.message);
  }
};

export const logout = () => signOut(auth);