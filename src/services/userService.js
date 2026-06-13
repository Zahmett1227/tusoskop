import { db, logAnalyticsEvent } from "../firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export async function ensureUserDocument(firebaseUser) {
  if (!firebaseUser?.uid) return null;

  const ref = doc(db, "users", firebaseUser.uid);

  try {
    const snap = await getDoc(ref);
    const now = serverTimestamp();

    if (!snap.exists()) {
      const newUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? null,
        displayName: firebaseUser.displayName ?? null,
        photoURL: firebaseUser.photoURL ?? null,
        plan: "free",
        premiumStatus: "inactive",
        premiumSource: "none",
        premiumUntil: null,
        lifetimePremium: false,
        adminNote: null,
        grantedBy: null,
        grantedAt: null,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };

      await setDoc(ref, newUserData);
      logAnalyticsEvent("sign_up", { method: "email" }); // Firebase Analytics event
      return newUserData;
    }

    const existing = snap.data() || {};
    const strOrEmpty = (v) => (v && String(v).trim()) || "";
    const safeUpdate = {
      uid: existing.uid || firebaseUser.uid,
      email:
        strOrEmpty(firebaseUser.email) ||
        strOrEmpty(existing.email) ||
        null,
      displayName:
        strOrEmpty(firebaseUser.displayName) ||
        strOrEmpty(existing.displayName) ||
        null,
      photoURL: firebaseUser.photoURL ?? existing.photoURL ?? null,
      plan: existing.plan ?? "free",
      premiumStatus: existing.premiumStatus ?? "inactive",
      premiumSource: existing.premiumSource ?? "none",
      premiumUntil: existing.premiumUntil ?? null,
      lifetimePremium: existing.lifetimePremium ?? false,
      updatedAt: now,
      lastLoginAt: now,
    };

    await setDoc(ref, safeUpdate, { merge: true });

    return {
      ...existing,
      ...safeUpdate,
      uid: existing.uid || firebaseUser.uid,
      email: safeUpdate.email,
      displayName: safeUpdate.displayName,
      photoURL: safeUpdate.photoURL,
    };
  } catch (error) {
    console.error("ensureUserDocument error:", error);
    return null;
  }
}
