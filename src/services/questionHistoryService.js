import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  QUESTION_HISTORY_STORAGE_KEY,
  buildNextQuestionHistoryEntry,
  buildQuestionHistoryMap,
  dedupeQuestionHistoryByQuestionId,
  loadLocalQuestionHistoryList,
  mergeQuestionHistoryLists,
  normalizeQuestionHistoryEntry,
} from "../utils/questionHistoryUtils";

const canUseLocalStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const setLocalHistoryList = (list) => {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(
      QUESTION_HISTORY_STORAGE_KEY,
      JSON.stringify(dedupeQuestionHistoryByQuestionId(list))
    );
  } catch {
    /* ignore */
  }
};

function canSyncQuestionHistoryToFirestore(user) {
  return Boolean(user?.uid && auth.currentUser?.uid === user.uid);
}

function isFirestoreAccessError(error) {
  const code = error?.code || "";
  return code === "permission-denied" || code === "unauthenticated";
}

async function readFirestoreQuestionHistory(user) {
  if (!canSyncQuestionHistoryToFirestore(user)) return null;
  try {
    const snap = await getDocs(collection(db, "users", user.uid, "questionHistory"));
    return dedupeQuestionHistoryByQuestionId(
      snap.docs.map((d) => normalizeQuestionHistoryEntry({ ...d.data(), questionId: Number(d.id) }))
    );
  } catch (error) {
    if (!isFirestoreAccessError(error)) {
      console.error("readFirestoreQuestionHistory error:", error);
    }
    return null;
  }
}

async function writeFirestoreQuestionHistory(user, entry) {
  if (!canSyncQuestionHistoryToFirestore(user) || !entry?.questionId) return false;
  try {
    const ref = doc(db, "users", user.uid, "questionHistory", String(entry.questionId));
    await setDoc(ref, entry, { merge: true });
    return true;
  } catch (error) {
    if (!isFirestoreAccessError(error)) {
      console.error("writeFirestoreQuestionHistory error:", error);
    }
    return false;
  }
}

export async function getQuestionHistoryList(user) {
  const local = loadLocalQuestionHistoryList();
  const remote = await readFirestoreQuestionHistory(user);
  if (remote === null) return local;
  const merged = mergeQuestionHistoryLists(local, remote);
  setLocalHistoryList(merged);
  return merged;
}

/**
 * @returns {{ map: Record<number, object>, source: 'cloud'|'local'|'none', cloudSync: boolean }}
 */
export async function loadQuestionHistoryForTracker(user) {
  const local = loadLocalQuestionHistoryList();
  const remote = await readFirestoreQuestionHistory(user);

  if (!user?.uid || remote === null) {
    return {
      map: buildQuestionHistoryMap(local),
      source: local.length ? "local" : "none",
      cloudSync: false,
    };
  }

  const merged = mergeQuestionHistoryLists(local, remote);
  setLocalHistoryList(merged);

  const source = remote.length > 0 ? "cloud" : local.length > 0 ? "local" : "none";
  return {
    map: buildQuestionHistoryMap(merged),
    source,
    cloudSync: true,
  };
}

/**
 * Çalışma / konu / review cevabı sonrası history kaydı.
 * Deneme bitişi bu sürümde dahil değil (examResults ayrı tutulur).
 */
export async function recordQuestionHistory(
  user,
  { question, selectedOption, source = "study" },
  now = new Date()
) {
  const questionId = Number(question?.id);
  if (!Number.isFinite(questionId) || questionId <= 0) return null;

  const all = await getQuestionHistoryList(user);
  const existing = all.find((item) => item.questionId === questionId);
  const next = buildNextQuestionHistoryEntry(
    question,
    selectedOption,
    existing,
    source,
    now
  );
  if (!next) return null;

  const merged = dedupeQuestionHistoryByQuestionId([
    ...all.filter((item) => item.questionId !== questionId),
    next,
  ]);
  setLocalHistoryList(merged);
  await writeFirestoreQuestionHistory(user, next);
  return next;
}
