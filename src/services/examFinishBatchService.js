import { doc, getDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "../firebase";
import { trackClarityEvent } from "../lib/clarity";
import {
  applyWrongQuestionsBatchToLocal,
  buildNextWrongQuestionEntry,
  enforceWrongQuestionsLimitForFreeUser,
  getQuestionIdSafe,
} from "./studyCollectionService";
import {
  computeNextSmartReviewEntry,
  getSmartReviews,
  mergeSmartReviewsIntoLocal,
} from "./smartReviewService";

/** Firestore writeBatch üst sınırı 500; yanlış başına 2 write → güvenli chunk. */
export const MAX_WRITES_PER_BATCH = 450;

const canSyncSmartReviewsToFirestore = (user) =>
  Boolean(user?.uid && auth.currentUser?.uid === user.uid);

/**
 * Deneme bitişi yanlış satırları — examIndex yalnızca analiz için, kalıcı id question.id.
 */
export function dedupeExamWrongItems(wrongItems = []) {
  const map = new Map();
  for (const raw of wrongItems) {
    const question = raw?.question;
    const questionId = Number(raw?.questionId) || getQuestionIdSafe(question);
    if (!Number.isFinite(questionId) || questionId <= 0) continue;
    if (map.has(questionId)) continue;
    map.set(questionId, {
      question,
      questionId,
      userAnswer: raw.userAnswer,
      correctAnswer: raw.correctAnswer ?? question?.correct,
      examIndex: raw.examIndex,
      ders: raw.ders ?? question?.ders,
      konu: raw.konu ?? question?.konu,
    });
  }
  return [...map.values()];
}

/**
 * Saf payload builder — testler ve batch commit için.
 * Her benzersiz questionId için 2 write: wrongQuestions + smartReviews.
 */
export function buildExamFinishBatchWrites(
  userUid,
  wrongItems,
  existingWrongById = new Map(),
  existingReviews = [],
  now = new Date()
) {
  if (!userUid) {
    return { writes: [], wrongEntries: [], reviewEntries: [], dedupedCount: 0 };
  }

  const deduped = dedupeExamWrongItems(wrongItems);
  const reviewMap = new Map(
    (existingReviews || []).map((item) => [Number(item.questionId), item])
  );
  const writes = [];
  const wrongEntries = [];
  const reviewEntries = [];
  const nowIso = now instanceof Date ? now.toISOString() : new Date().toISOString();

  for (const item of deduped) {
    const question = item.question;
    const questionId = item.questionId;
    const docId = String(questionId);

    const previousWrong = existingWrongById.get(questionId) ?? existingWrongById.get(docId);
    const wrongNext = buildNextWrongQuestionEntry(
      question,
      item.userAnswer,
      previousWrong,
      nowIso
    );
    if (wrongNext) {
      wrongEntries.push(wrongNext);
      writes.push({
        kind: "wrong",
        docId,
        questionId,
        ref: doc(db, "users", userUid, "wrongQuestions", docId),
        data: wrongNext,
      });
    }

    const reviewNext = computeNextSmartReviewEntry(
      question,
      reviewMap.get(questionId),
      "wrong",
      null,
      now
    );
    if (reviewNext) {
      reviewMap.set(questionId, reviewNext);
      reviewEntries.push(reviewNext);
      writes.push({
        kind: "smartReview",
        docId,
        questionId,
        ref: doc(db, "users", userUid, "smartReviews", docId),
        data: reviewNext,
      });
    }
  }

  return {
    writes,
    wrongEntries,
    reviewEntries,
    dedupedCount: deduped.length,
  };
}

function chunkWrites(writes, maxPerBatch = MAX_WRITES_PER_BATCH) {
  const chunks = [];
  for (let i = 0; i < writes.length; i += maxPerBatch) {
    chunks.push(writes.slice(i, i + maxPerBatch));
  }
  return chunks;
}

async function fetchExistingWrongByIds(user, questionIds) {
  const map = new Map();
  if (!user?.uid || !questionIds.length) return map;

  await Promise.all(
    questionIds.map(async (questionId) => {
      try {
        const ref = doc(db, "users", user.uid, "wrongQuestions", String(questionId));
        const snap = await getDoc(ref);
        if (snap.exists()) map.set(questionId, snap.data());
      } catch {
        /* ignore per-doc read failure */
      }
    })
  );
  return map;
}

async function commitFirestoreBatches(writes) {
  const chunks = chunkWrites(writes);
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const { ref, data } of chunk) {
      batch.set(ref, data, { merge: true });
    }
    await batch.commit();
  }
}

/**
 * Deneme bitişinde yanlış + smart review kayıtlarını toplu yazar.
 * Firestore başarısız olursa yerel liste güncellenmiş kalır.
 */
export async function saveExamWrongAndSmartReviewsBatch(
  user,
  wrongItems = [],
  userData = null,
  now = new Date()
) {
  const deduped = dedupeExamWrongItems(wrongItems);
  if (!deduped.length) {
    return { ok: true, count: 0, writeCount: 0 };
  }

  const questionIds = deduped.map((item) => item.questionId);
  const existingWrongById = user?.uid
    ? await fetchExistingWrongByIds(user, questionIds)
    : new Map();
  const existingReviews = await getSmartReviews(user);

  const { writes, wrongEntries, reviewEntries } = buildExamFinishBatchWrites(
    user?.uid,
    deduped,
    existingWrongById,
    existingReviews,
    now
  );

  if (wrongEntries.length) {
    applyWrongQuestionsBatchToLocal(wrongEntries, userData);
  }
  if (reviewEntries.length) {
    mergeSmartReviewsIntoLocal(reviewEntries, now);
  }

  let firestoreOk = false;
  if (user?.uid && writes.length && canSyncSmartReviewsToFirestore(user)) {
    try {
      await commitFirestoreBatches(writes);
      firestoreOk = true;
      await enforceWrongQuestionsLimitForFreeUser(user, userData);
    } catch (error) {
      console.error("saveExamWrongAndSmartReviewsBatch firestore error:", error);
    }
  }

  if (wrongEntries.length) {
    trackClarityEvent("yanlis_soru_kaydedildi");
  }

  return {
    ok: true,
    count: deduped.length,
    writeCount: writes.length,
    firestoreOk,
    localFallback: !firestoreOk && Boolean(user?.uid),
  };
}
