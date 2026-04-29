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
  updateDoc,
} from "firebase/firestore";

export async function isCurrentUserAdmin(uid) {
  if (!uid) return false;
  const snap = await getDoc(doc(db, "admins", uid));
  return snap.exists() && snap.data()?.active === true;
}

export async function getAdminUserList() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => {
    const data = d.data() || {};
    return {
      id: d.id,
      ...data,
      uid: data.uid || d.id,
      email: data.email || null,
      displayName: data.displayName || null,
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

export async function grantPremium({ adminUid, adminEmail = null, targetUid, days, reason = "" }) {
  const userRef = doc(db, "users", targetUid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error("Kullanici bulunamadi.");
  }
  const prev = userSnap.data();

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
    throw new Error("Kullanici bulunamadi.");
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
