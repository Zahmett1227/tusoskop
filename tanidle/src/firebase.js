// Firebase — Tusoskop ile AYNI proje.
// Yapılandırma yalnızca .env'den (VITE_FIREBASE_*) gelir; anahtar yoksa
// uygulama anonim (localStorage) modda sorunsuz çalışmaya devam eder.
//
// Aynı proje sayesinde: kullanıcı Tanıdle'a Google ile girerse, Tusoskop
// hesabıyla aynı kimliği kullanır. Tanıdle verileri ayrı koleksiyonlarda tutulur
// (tanidleStats), Tusoskop koleksiyonlarına dokunulmaz.

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(cfg.apiKey && cfg.projectId);

let app = null;
let auth = null;
let db = null;

if (firebaseEnabled) {
  app = initializeApp(cfg);
  auth = getAuth(app);
  db = getFirestore(app);
}

export const googleProvider = firebaseEnabled ? new GoogleAuthProvider() : null;
export { app, auth, db };
