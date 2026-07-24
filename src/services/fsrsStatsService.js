import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { isDueForReview } from "../utils/smartReviewScheduler";
import { getLocalDateKey } from "../utils/localDate";

const ZERO_STATS = {
  addedCount: 0,
  reviewedCount: 0,
  wrongAddedCount: 0,
  favoriteAddedCount: 0,
  manualAddedCount: 0,
  dueCountSnapshot: 0,
};

const SOURCE_TO_COUNTER = {
  wrongAdded: "wrongAddedCount",
  favoriteAdded: "favoriteAddedCount",
  manualAdded: "manualAddedCount",
};

const SOURCE_ALIASES = {
  wrong: "wrongAdded",
  favorite: "favoriteAdded",
  manual: "manualAdded",
  wrongAdded: "wrongAdded",
  favoriteAdded: "favoriteAdded",
  manualAdded: "manualAdded",
};

// Streak / leaderboard / FSRS istatistikleri tek gün eksenini paylaşır.
export function getFsrsStatsDateKey(date = new Date()) {
  return getLocalDateKey(date);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function normalizeSource(source) {
  return SOURCE_ALIASES[source] || "manualAdded";
}

function normalizeQuestionEventId(questionId) {
  const raw = String(questionId ?? "").trim();
  if (!raw) return null;
  const label = raw.startsWith("question_") ? raw : `question_${raw}`;
  return label.replace(/[/.#[\]]/g, "_");
}

function canUseUserStats(uid) {
  return Boolean(uid && auth.currentUser?.uid === uid);
}

function resolveStatsUid(uid) {
  const currentUid = auth.currentUser?.uid || null;
  if (!currentUid || currentUid !== uid) {
    console.error("[FSRS_STATS] uid mismatch or missing auth user", { uid, currentUid });
    return null;
  }
  return currentUid;
}

function emptyStatsForDate(date) {
  return { date, ...ZERO_STATS };
}

function normalizeStatsDoc(date, data = {}) {
  return {
    ...emptyStatsForDate(date),
    addedCount: Number(data.addedCount || 0),
    reviewedCount: Number(data.reviewedCount || 0),
    wrongAddedCount: Number(data.wrongAddedCount || 0),
    favoriteAddedCount: Number(data.favoriteAddedCount || 0),
    manualAddedCount: Number(data.manualAddedCount || 0),
    dueCountSnapshot: Number(data.dueCountSnapshot || 0),
  };
}

export async function trackFsrsAddedQuestion({ uid, questionId, source }) {
  const safeUid = resolveStatsUid(uid);
  if (!safeUid) return;
  const eventQuestionId = normalizeQuestionEventId(questionId);
  if (!eventQuestionId) return;

  const date = getFsrsStatsDateKey();
  const normalizedSource = normalizeSource(source);
  const sourceCounter = SOURCE_TO_COUNTER[normalizedSource] || "manualAddedCount";
  const eventId = `${eventQuestionId}_${date}_${normalizedSource}`;
  const eventRef = doc(db, "users", safeUid, "fsrsAddEvents", eventId);
  const statsRef = doc(db, "users", safeUid, "fsrsDailyStats", date);

  try {
    // Dedup yalnızca event dokümanı üzerinden yapılır. Bu doküman soru+source
    // başına benzersiz olduğundan eşzamanlı çağrılar birbiriyle çakışmaz.
    // Paylaşılan günlük istatistik dokümanı (statsRef) transaction'a DAHİL
    // EDİLMEZ — aksi halde deneme bitişinde onlarca eşzamanlı transaction aynı
    // dokümanı okuyup "stored version does not match" (failed-precondition)
    // hatası verir.
    const isNewEvent = await runTransaction(db, async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      if (eventSnap.exists()) return false;
      transaction.set(eventRef, {
        questionId: eventQuestionId,
        date,
        source: normalizedSource,
        createdAt: serverTimestamp(),
      });
      return true;
    });

    if (!isNewEvent) return;

    // Günlük istatistik artışı transaction dışında: increment() atomik ve
    // değişmeli (commutative) olduğundan eşzamanlı yazımlar güvenle birikir,
    // versiyon çakışması oluşmaz.
    await setDoc(
      statsRef,
      {
        date,
        addedCount: increment(1),
        [sourceCounter]: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("trackFsrsAddedQuestion error:", error);
  }
}

export async function trackFsrsReviewedQuestion({ uid, questionId }) {
  const safeUid = resolveStatsUid(uid);
  if (!safeUid || !questionId) return;
  const date = getFsrsStatsDateKey();
  const statsRef = doc(db, "users", safeUid, "fsrsDailyStats", date);

  try {
    const statsSnap = await getDoc(statsRef);
    await setDoc(
      statsRef,
      {
        date,
        reviewedCount: increment(1),
        ...(statsSnap.exists() ? {} : { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log("[FSRS_STATS] reviewed question tracked", { uid: safeUid, questionId });
  } catch (error) {
    console.error("trackFsrsReviewedQuestion error:", error);
  }
}

export async function updateFsrsDueSnapshot({ uid, dueCount = null }) {
  const safeUid = resolveStatsUid(uid);
  if (!safeUid) return null;
  const date = getFsrsStatsDateKey();
  const now = new Date();

  try {
    const hasProvidedDueCount =
      dueCount !== null && dueCount !== undefined && Number.isFinite(Number(dueCount));
    const resolvedDueCount = hasProvidedDueCount
      ? Number(dueCount)
      : (await getDocs(collection(db, "users", safeUid, "smartReviews"))).docs
          .filter((item) => isDueForReview(item.data(), now)).length;
    const statsRef = doc(db, "users", safeUid, "fsrsDailyStats", date);
    const statsSnap = await getDoc(statsRef);
    await setDoc(
      statsRef,
      {
        date,
        dueCountSnapshot: resolvedDueCount,
        ...(statsSnap.exists() ? {} : { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log("[FSRS_STATS] due snapshot updated", { dueCount: resolvedDueCount });
    return resolvedDueCount;
  } catch (error) {
    console.error("updateFsrsDueSnapshot error:", error);
    return null;
  }
}

export async function getFsrsDailyStatsRange({ uid, days }) {
  const safeDays = Math.max(1, Math.min(30, Number(days) || 7));
  const today = new Date();
  const dates = Array.from({ length: safeDays }, (_, index) =>
    getFsrsStatsDateKey(addDays(today, index - safeDays + 1))
  );

  if (!canUseUserStats(uid)) return dates.map(emptyStatsForDate);

  try {
    const snapshots = await Promise.all(
      dates.map((date) => getDoc(doc(db, "users", uid, "fsrsDailyStats", date)))
    );
    return dates.map((date, index) => {
      const snap = snapshots[index];
      return snap.exists()
        ? normalizeStatsDoc(date, snap.data())
        : emptyStatsForDate(date);
    });
  } catch (error) {
    console.error("getFsrsDailyStatsRange error:", error);
    throw error;
  }
}

