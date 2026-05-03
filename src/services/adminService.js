import { db } from "../firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { PLAN_ID_TO_GRANT_DAYS } from "../config/plusPlans";

export async function isCurrentUserAdmin(uid) {
  if (!uid) return false;
  const snap = await getDoc(doc(db, "admins", uid));
  return snap.exists() && snap.data()?.active === true;
}

function newestIntentEmailByUid(intentDocs) {
  const map = new Map();
  for (const d of intentDocs) {
    const row = d.data() || {};
    const u = row.uid;
    const em = row.email;
    if (u && em && !map.has(u)) {
      map.set(u, em);
    }
  }
  return map;
}

export async function getAdminUserList() {
  const intentsQuery = query(
    collection(db, "premiumPurchaseIntents"),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  const [usersSnap, intentsSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(intentsQuery),
  ]);
  const intentEmailByUid = newestIntentEmailByUid(intentsSnap.docs);

  return usersSnap.docs.map((d) => {
    const data = d.data() || {};
    const docId = d.id;
    const uid = data.uid || docId;
    const emailFromFirestore =
      (data.email && String(data.email).trim()) ||
      (data.lastKnownEmail && String(data.lastKnownEmail).trim()) ||
      null;
    const emailFallback = intentEmailByUid.get(uid) || null;
    const email = emailFromFirestore || emailFallback || null;
    return {
      id: docId,
      ...data,
      uid,
      email,
      emailFromFirestore: emailFromFirestore || null,
      displayName: data.displayName || data.name || null,
    };
  });
}

export async function getAdminLogs(maxItems = 50) {
  const logsQuery = query(
    collection(db, "adminLogs"),
    orderBy("createdAt", "desc"),
    limit(maxItems)
  );
  const snap = await getDocs(logsQuery);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function buildAdminPremiumGrantFields({ adminUid, days }) {
  const isLifetime = Number(days) === 0;
  const until = isLifetime
    ? null
    : new Date(Date.now() + Number(days) * 86400000).toISOString();
  const nowIso = new Date().toISOString();
  const next = {
    plan: "plus",
    premiumStatus: "active",
    premiumSource: "admin",
    premiumUntil: until,
    lifetimePremium: isLifetime,
    grantedBy: adminUid,
    grantedAt: nowIso,
    updatedAt: serverTimestamp(),
  };
  return { isLifetime, next };
}

export async function grantPremium({ adminUid, adminEmail = null, targetUid, days, reason = "" }) {
  const userRef = doc(db, "users", targetUid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error("Kullanıcı bulunamadı.");
  }
  const prev = userSnap.data();
  const { isLifetime, next } = buildAdminPremiumGrantFields({ adminUid, days });

  await updateDoc(userRef, next);
  await addDoc(collection(db, "adminLogs"), {
    adminUid,
    adminEmail,
    targetUid,
    action: isLifetime ? "grant_lifetime" : `grant_${days}d`,
    previousPlanData: {
      plan: prev.plan ?? "free",
      premiumStatus: prev.premiumStatus ?? "inactive",
      premiumUntil: prev.premiumUntil ?? null,
      lifetimePremium: prev.lifetimePremium ?? false,
    },
    nextPlanData: {
      plan: next.plan,
      premiumStatus: next.premiumStatus,
      premiumUntil: next.premiumUntil,
      lifetimePremium: next.lifetimePremium,
    },
    reason,
    createdAt: serverTimestamp(),
  });
}

export async function revokePremium({ adminUid, adminEmail = null, targetUid, reason = "" }) {
  const userRef = doc(db, "users", targetUid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error("Kullanıcı bulunamadı.");
  }
  const prev = userSnap.data();

  const next = {
    plan: "free",
    premiumStatus: "inactive",
    premiumSource: "none",
    premiumUntil: null,
    lifetimePremium: false,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(userRef, next);
  await addDoc(collection(db, "adminLogs"), {
    adminUid,
    adminEmail,
    targetUid,
    action: "revoke",
    previousPlanData: {
      plan: prev.plan ?? "free",
      premiumStatus: prev.premiumStatus ?? "inactive",
      premiumUntil: prev.premiumUntil ?? null,
      lifetimePremium: prev.lifetimePremium ?? false,
    },
    nextPlanData: {
      plan: next.plan,
      premiumStatus: next.premiumStatus,
      premiumUntil: next.premiumUntil,
      lifetimePremium: next.lifetimePremium,
    },
    reason,
    createdAt: serverTimestamp(),
  });
}

export async function getPremiumPurchaseIntents(maxItems = 50) {
  const intentsQuery = query(
    collection(db, "premiumPurchaseIntents"),
    orderBy("createdAt", "desc"),
    limit(maxItems)
  );
  const snap = await getDocs(intentsQuery);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function activateIntentAndGrantPremium({
  intentId,
  intent,
  adminUid,
  adminEmail = null,
}) {
  const targetUid = intent?.uid;
  if (!targetUid) {
    throw new Error("Kayıtta kullanıcı UID yok; manuel aktivasyon yapılamaz.");
  }
  const days = PLAN_ID_TO_GRANT_DAYS[intent.planId];
  if (!days) {
    throw new Error("Bu plan için süre tanımı yok.");
  }

  const userRef = doc(db, "users", targetUid);
  const userSnap = await getDoc(userRef);
  const existingUser = userSnap.exists() ? userSnap.data() : null;
  const prev = existingUser || {
    plan: "free",
    premiumStatus: "inactive",
    premiumUntil: null,
    lifetimePremium: false,
  };

  const { isLifetime, next } = buildAdminPremiumGrantFields({ adminUid, days });

  const hasDocEmail =
    existingUser?.email && String(existingUser.email).trim().length > 0;
  const hasDocDisplayName =
    existingUser?.displayName &&
    String(existingUser.displayName).trim().length > 0;

  const identityPatch = {
    uid: existingUser?.uid || targetUid,
  };
  if (!hasDocEmail && intent?.email) {
    identityPatch.email = intent.email;
  }
  if (!hasDocDisplayName && intent?.displayName) {
    identityPatch.displayName = intent.displayName;
  }

  const grantPayload = { ...identityPatch, ...next };
  if (!existingUser) {
    grantPayload.createdAt = serverTimestamp();
  }

  await setDoc(userRef, grantPayload, { merge: true });

  await addDoc(collection(db, "adminLogs"), {
    adminUid,
    adminEmail,
    targetUid,
    action: isLifetime ? "grant_lifetime" : `grant_${days}d`,
    previousPlanData: {
      plan: prev.plan ?? "free",
      premiumStatus: prev.premiumStatus ?? "inactive",
      premiumUntil: prev.premiumUntil ?? null,
      lifetimePremium: prev.lifetimePremium ?? false,
    },
    nextPlanData: {
      plan: next.plan,
      premiumStatus: next.premiumStatus,
      premiumUntil: next.premiumUntil,
      lifetimePremium: next.lifetimePremium,
    },
    reason: `Ödeme talebi / ${intent.planSku || intent.planId}`,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "premiumPurchaseIntents", intentId), {
    status: "manually_activated",
    activatedAt: new Date().toISOString(),
    activatedBy: adminUid,
    activatedForUid: targetUid,
    updatedAt: serverTimestamp(),
  });
}

export async function addAdminNote({ adminUid, adminEmail = null, targetUid, note }) {
  await updateDoc(doc(db, "users", targetUid), {
    adminNote: note,
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "adminLogs"), {
    adminUid,
    adminEmail,
    targetUid,
    action: "add_note",
    previousPlanData: {},
    nextPlanData: { adminNote: note },
    reason: note,
    createdAt: serverTimestamp(),
  });
}
