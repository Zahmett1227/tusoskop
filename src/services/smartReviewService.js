import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { readLocalStorageJson } from "../utils/safeLocalStorage";
import {
  createInitialReviewState,
  dedupeSmartReviewsByQuestionId,
  filterInsightReviewPool,
  gradeFromAnswerCorrect,
  isDueForReview,
  isOverdue,
  mergeSmartReviewLists,
  normalizeSmartReviewEntry,
  sortDueReviews,
  updateReviewAfterGrade,
} from "../utils/smartReviewScheduler";
import { buildTopSubjectsWithTopics } from "../utils/smartReviewUtils";
import { getQuestionIdSafe } from "./studyCollectionService";

const STORAGE_KEY = "tusoskopSmartReviews";
const MAX_SESSION_DUE = 30;

const canUseLocalStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const getLocalList = () => {
  if (!canUseLocalStorage()) return [];
  const parsed = readLocalStorageJson(STORAGE_KEY, { fallback: [], clearOnError: true });
  if (!Array.isArray(parsed)) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return [];
  }
  return dedupeSmartReviewsByQuestionId(parsed);
};

const setLocalList = (list) => {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupeSmartReviewsByQuestionId(list)));
  } catch {
    /* ignore */
  }
};

function canSyncSmartReviewsToFirestore(user) {
  return Boolean(user?.uid && auth.currentUser?.uid === user.uid);
}

function isFirestoreAccessError(error) {
  const code = error?.code || "";
  return code === "permission-denied" || code === "unauthenticated";
}

async function readFirestoreReviews(user) {
  if (!canSyncSmartReviewsToFirestore(user)) return null;
  try {
    const snap = await getDocs(collection(db, "users", user.uid, "smartReviews"));
    return dedupeSmartReviewsByQuestionId(snap.docs.map((d) => ({ ...d.data(), questionId: Number(d.id) })));
  } catch (error) {
    if (!isFirestoreAccessError(error)) {
      console.error("getSmartReviews firestore error:", error);
    }
    return null;
  }
}

async function writeFirestoreReview(user, entry) {
  if (!canSyncSmartReviewsToFirestore(user) || !entry?.questionId) return false;
  try {
    const ref = doc(db, "users", user.uid, "smartReviews", String(entry.questionId));
    await setDoc(ref, entry, { merge: true });
    return true;
  } catch (error) {
    if (!isFirestoreAccessError(error)) {
      console.error("writeFirestoreReview error:", error);
    }
    return false;
  }
}

export async function getSmartReviews(user) {
  const local = getLocalList();
  const remote = await readFirestoreReviews(user);
  if (remote === null) return local;
  const merged = mergeSmartReviewLists(local, remote);
  setLocalList(merged);
  return merged;
}

export async function getDueSmartReviews(user, now = new Date(), { limit = MAX_SESSION_DUE } = {}) {
  const all = await getSmartReviews(user);
  const sorted = sortDueReviews(all, now);
  const cap = Math.max(1, Number(limit) || MAX_SESSION_DUE);
  return sorted.slice(0, cap);
}

export async function upsertSmartReview(user, question, source = "wrong", grade = null, now = new Date()) {
  const questionId = getQuestionIdSafe(question);
  if (!questionId) return null;

  const all = await getSmartReviews(user);
  const existing = all.find((item) => item.questionId === questionId);
  let next;

  if (!existing) {
    next = createInitialReviewState(question, source, now);
    if (grade && grade !== "again") {
      next = updateReviewAfterGrade(next, grade, now) || next;
    }
  } else if (grade) {
    next = updateReviewAfterGrade(existing, grade, now);
  } else if (source === "wrong") {
    next = updateReviewAfterGrade(existing, "again", now);
  } else {
    next = normalizeSmartReviewEntry(existing, now);
  }

  if (!next) return null;

  const merged = dedupeSmartReviewsByQuestionId([
    ...all.filter((item) => item.questionId !== questionId),
    next,
  ]);
  setLocalList(merged);
  await writeFirestoreReview(user, next);
  return next;
}

export async function updateSmartReviewGrade(user, question, grade, now = new Date()) {
  const questionId = getQuestionIdSafe(question);
  if (!questionId || !grade) return null;
  const all = await getSmartReviews(user);
  const existing = all.find((item) => item.questionId === questionId);
  if (!existing) {
    return upsertSmartReview(user, question, "wrong", grade, now);
  }
  const next = updateReviewAfterGrade(existing, grade, now);
  if (!next) return null;
  const merged = dedupeSmartReviewsByQuestionId([
    ...all.filter((item) => item.questionId !== questionId),
    next,
  ]);
  setLocalList(merged);
  await writeFirestoreReview(user, next);
  return next;
}

export async function updateSmartReviewFromAnswer(user, question, isCorrect, now = new Date()) {
  return updateSmartReviewGrade(user, question, gradeFromAnswerCorrect(isCorrect), now);
}

export async function removeSmartReview(user, questionId) {
  const id = Number(questionId);
  if (!Number.isFinite(id) || id <= 0) return;
  const all = getLocalList().filter((item) => item.questionId !== id);
  setLocalList(all);
  if (canSyncSmartReviewsToFirestore(user)) {
    try {
      await deleteDoc(doc(db, "users", user.uid, "smartReviews", String(id)));
    } catch (error) {
      if (!isFirestoreAccessError(error)) {
        console.error("removeSmartReview firestore error:", error);
      }
    }
  }
}

function topLabels(items, field, limit = 3) {
  const counts = new Map();
  for (const item of items) {
    const key = String(item[field] || "").trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export async function getSmartReviewSummary(user, now = new Date()) {
  const all = await getSmartReviews(user);
  const due = all.filter((item) => isDueForReview(item, now));
  const overdue = due.filter((item) => isOverdue(item, now));
  const insightPool = filterInsightReviewPool(all, now);

  return {
    dueCount: due.length,
    overdueCount: overdue.length,
    totalCount: all.length,
    topSubjects: buildTopSubjectsWithTopics(insightPool),
    topTopics: topLabels(insightPool, "konu"),
  };
}

export function resolveQuestionsFromReviews(reviews, questions = []) {
  const mapById = new Map((questions || []).map((q) => [Number(q.id), q]));
  return (reviews || [])
    .map((item) => mapById.get(Number(item.questionId)))
    .filter(Boolean);
}

export { MAX_SESSION_DUE };
