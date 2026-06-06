import { db } from "../firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

const APP_REVIEW_EMAIL = "apple-review@tusoskop.com";

export function isAppReviewAccount(firebaseUser) {
  return String(firebaseUser?.email || "").trim().toLowerCase() === APP_REVIEW_EMAIL;
}

export function appReviewAccessPatch() {
  return {
    plan: "plus",
    premiumStatus: "active",
    premiumSource: "app_review",
    premiumUntil: null,
    lifetimePremium: true,
  };
}

export function withAppReviewAccess(firebaseUser, userData = {}) {
  if (!isAppReviewAccount(firebaseUser)) return userData;
  return {
    ...(userData || {}),
    uid: userData?.uid || firebaseUser.uid,
    email: userData?.email || firebaseUser.email || APP_REVIEW_EMAIL,
    displayName: userData?.displayName ?? firebaseUser.displayName ?? null,
    photoURL: userData?.photoURL ?? firebaseUser.photoURL ?? null,
    ...appReviewAccessPatch(),
  };
}

export async function ensureUserDocument(firebaseUser) {
  if (!firebaseUser?.uid) return null;

  const ref = doc(db, "users", firebaseUser.uid);
  const reviewAccess = isAppReviewAccount(firebaseUser) ? appReviewAccessPatch() : null;

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
        ...(reviewAccess || {}),
        adminNote: null,
        grantedBy: null,
        grantedAt: null,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };

      await setDoc(ref, newUserData);
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
      ...(reviewAccess || {}),
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
    return withAppReviewAccess(firebaseUser, null);
  }
}
