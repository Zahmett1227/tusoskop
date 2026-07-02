/**
 * Firebase web SDK yapılandırması — tek kaynak.
 *
 * Hem `src/firebase.js` (ana uygulama) hem de `/coz` mikro deneme akışının
 * hafif analytics katmanı bu config'i import eder. Böylece funnel, ağır
 * `firebase.js` modülünü (auth + firestore) yüklemeden yalnızca
 * firebase/app + firebase/analytics ile Analytics başlatabilir.
 *
 * Not: Bu değerler zaten client bundle'ında herkese açıktır (gizli değildir).
 */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBF8gh8mOeCpPgbfX_0jP_Fg47wyUXs278",
  authDomain: "tusoskop.firebaseapp.com",
  projectId: "tusoskop",
  storageBucket: "tusoskop.firebasestorage.app",
  messagingSenderId: "447547841381",
  appId: "1:447547841381:web:5ac74af2196a71be6b1f8c",
  measurementId: "G-P5BCLN20L3",
};
