import { db } from "../firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getStoredAcquisitionForUserDoc } from "../utils/acquisitionAttribution";
import { trackCompleteRegistration } from "../lib/metaPixel";

// Firebase provider ID → Meta event'i için okunaklı kayıt yöntemi.
function resolveRegistrationMethod(firebaseUser) {
  const providerId = firebaseUser?.providerData?.[0]?.providerId || "";
  if (providerId.includes("google")) return "google";
  if (providerId.includes("apple")) return "apple";
  if (providerId.includes("password")) return "email";
  return providerId || undefined;
}

function buildAcquisitionPatch(existingAcquisition, now) {
  if (existingAcquisition) return {};
  const stored = getStoredAcquisitionForUserDoc();
  if (!stored) return {};
  return {
    acquisition: {
      ...stored,
      firstSeenAt: now,
    },
  };
}

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
        ...buildAcquisitionPatch(null, now),
      };

      await setDoc(ref, newUserData);
      // Meta Pixel: yalnızca yeni hesap oluşturulduğunda (her girişte değil).
      try {
        trackCompleteRegistration({
          method: resolveRegistrationMethod(firebaseUser),
          uid: firebaseUser.uid,
        });
      } catch {
        /* analytics kritik değil, sessiz geç */
      }
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
      ...buildAcquisitionPatch(existing.acquisition, now),
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
