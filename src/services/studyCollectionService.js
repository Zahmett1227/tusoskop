import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { trackClarityEvent } from "../lib/clarity";
import { FREE_LIMITS } from "../config/limits";
import { isUserPremium } from "../utils/premiumUtils";
import { readLocalStorageJson } from "../utils/safeLocalStorage";

const WRONG_KEY = "tusoskopWrongQuestions";
const FAVORITE_KEY = "tusoskopFavoriteQuestions";
const MAX_TODAY_QUEUE = 20;

const safeNowIso = () => new Date().toISOString();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Kalıcı kayıtlar yalnızca soru bankası question.id ile tutulur (examIndex değil). */
export function getQuestionIdSafe(question) {
  const id = Number(question?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

const isValidQuestionId = (questionId) =>
  Number.isFinite(questionId) && questionId > 0;

const normalizeSelectedAnswer = (value, optionCount = 5) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const maxIndex = Math.max(0, Number(optionCount) - 1);
  if (parsed < 0 || parsed > maxIndex) return null;
  return parsed;
};

const normalizeWrongItem = (raw = {}) => ({
  questionId: toNumber(raw.questionId, null),
  ders: String(raw.ders || ""),
  konu: String(raw.konu || ""),
  wrongCount: Math.max(0, toNumber(raw.wrongCount, 0)),
  lastWrongAt: raw.lastWrongAt || null,
  lastSelectedAnswer:
    raw.lastSelectedAnswer === null || raw.lastSelectedAnswer === undefined
      ? null
      : toNumber(raw.lastSelectedAnswer, null),
  correctAnswer: toNumber(raw.correctAnswer, null),
  reviewCount: Math.max(0, toNumber(raw.reviewCount, 0)),
  lastReviewedAt: raw.lastReviewedAt || null,
  correctReviewStreak: Math.max(0, toNumber(raw.correctReviewStreak, 0)),
  isResolved: Boolean(raw.isResolved),
  updatedAt: raw.updatedAt || safeNowIso(),
});

const normalizeFavoriteItem = (raw = {}) => ({
  questionId: toNumber(raw.questionId, null),
  ders: String(raw.ders || ""),
  konu: String(raw.konu || ""),
  addedAt: raw.addedAt || safeNowIso(),
});

const canUseLocalStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const getLocalArray = (key) => {
  if (!canUseLocalStorage()) return [];
  const parsed = readLocalStorageJson(key, { fallback: [], clearOnError: true });
  if (!Array.isArray(parsed)) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    return [];
  }
  return parsed.filter((item) => item != null && typeof item === "object");
};

const dedupeWrongByQuestionId = (items = []) => {
  const map = new Map();
  for (const raw of items) {
    const item = normalizeWrongItem(raw);
    if (!isValidQuestionId(item.questionId)) continue;
    const prev = map.get(item.questionId);
    if (!prev) {
      map.set(item.questionId, item);
      continue;
    }
    const prevTime = prev.lastWrongAt ? new Date(prev.lastWrongAt).getTime() : 0;
    const itemTime = item.lastWrongAt ? new Date(item.lastWrongAt).getTime() : 0;
    const newer = itemTime >= prevTime ? item : prev;
    map.set(
      item.questionId,
      normalizeWrongItem({
        ...newer,
        wrongCount: Math.max(prev.wrongCount, item.wrongCount),
        reviewCount: Math.max(prev.reviewCount, item.reviewCount),
        correctReviewStreak: Math.max(prev.correctReviewStreak, item.correctReviewStreak),
        isResolved: Boolean(prev.isResolved && item.isResolved),
      })
    );
  }
  return [...map.values()];
};

const dedupeFavoritesByQuestionId = (items = []) => {
  const map = new Map();
  for (const raw of items) {
    const item = normalizeFavoriteItem(raw);
    if (!isValidQuestionId(item.questionId)) continue;
    const prev = map.get(item.questionId);
    if (!prev) {
      map.set(item.questionId, item);
      continue;
    }
    const prevTime = prev.addedAt ? new Date(prev.addedAt).getTime() : 0;
    const itemTime = item.addedAt ? new Date(item.addedAt).getTime() : 0;
    if (itemTime >= prevTime) map.set(item.questionId, item);
  }
  return [...map.values()];
};

const setLocalArray = (key, value) => {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore localStorage failure
  }
};

const sortWrongItems = (items = []) =>
  [...items].sort((a, b) => {
    const aw = toNumber(a.wrongCount, 0);
    const bw = toNumber(b.wrongCount, 0);
    if (bw !== aw) return bw - aw;
    const at = a.lastWrongAt ? new Date(a.lastWrongAt).getTime() : 0;
    const bt = b.lastWrongAt ? new Date(b.lastWrongAt).getTime() : 0;
    return bt - at;
  });

async function readWrongFromFirestore(user, userData) {
  const ref = collection(db, "users", user.uid, "wrongQuestions");
  const snap = await getDocs(ref);
  const list = sortWrongItems(
    dedupeWrongByQuestionId(snap.docs.map((d) => normalizeWrongItem(d.data())))
  );
  return isUserPremium(userData, user) ? list : list.slice(0, FREE_LIMITS.maxWrongQuestions);
}

async function readFavoritesFromFirestore(user) {
  const ref = collection(db, "users", user.uid, "favoriteQuestions");
  const snap = await getDocs(ref);
  return dedupeFavoritesByQuestionId(snap.docs.map((d) => normalizeFavoriteItem(d.data()))).sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );
}

function readWrongFromLocal(userData) {
  const list = sortWrongItems(dedupeWrongByQuestionId(getLocalArray(WRONG_KEY)));
  return isUserPremium(userData) ? list : list.slice(0, FREE_LIMITS.maxWrongQuestions);
}

function readFavoritesFromLocal() {
  return dedupeFavoritesByQuestionId(getLocalArray(FAVORITE_KEY)).sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );
}

export async function getWrongQuestions(user, userData = null) {
  try {
    if (user?.uid) return await readWrongFromFirestore(user, userData);
    return readWrongFromLocal(userData);
  } catch {
    return readWrongFromLocal(userData);
  }
}

export async function getFavoriteQuestions(user) {
  try {
    if (user?.uid) return await readFavoritesFromFirestore(user);
    return readFavoritesFromLocal();
  } catch {
    return readFavoritesFromLocal();
  }
}

/** Tekil ve toplu yanlış kayıt için ortak payload (document id = question.id). */
export function buildNextWrongQuestionEntry(
  question,
  selectedAnswer,
  previous = null,
  now = safeNowIso()
) {
  const questionId = getQuestionIdSafe(question);
  if (!questionId) return null;
  const optionCount = Array.isArray(question.options) ? question.options.length : 5;
  const normalizedSelected = normalizeSelectedAnswer(selectedAnswer, optionCount);
  const patch = {
    questionId,
    ders: String(question.ders || ""),
    konu: String(question.konu || ""),
    lastSelectedAnswer: normalizedSelected,
    correctAnswer: toNumber(question.correct, null),
    updatedAt: now,
  };
  const prev = previous ? normalizeWrongItem(previous) : null;
  return {
    ...patch,
    wrongCount: (prev?.wrongCount || 0) + 1,
    lastWrongAt: now,
    reviewCount: prev?.reviewCount || 0,
    lastReviewedAt: prev?.lastReviewedAt || null,
    correctReviewStreak: 0,
    isResolved: false,
  };
}

/** Toplu deneme bitişi: yerel wrongQuestions listesini günceller. */
export function applyWrongQuestionsBatchToLocal(entries = [], userData = null) {
  if (!canUseLocalStorage()) return [];
  let current = dedupeWrongByQuestionId(getLocalArray(WRONG_KEY));
  const map = new Map(current.map((item) => [item.questionId, item]));
  for (const entry of entries) {
    const normalized = normalizeWrongItem(entry);
    if (!isValidQuestionId(normalized.questionId)) continue;
    map.set(normalized.questionId, normalized);
  }
  let list = sortWrongItems([...map.values()]);
  list = isUserPremium(userData) ? list : list.slice(0, FREE_LIMITS.maxWrongQuestions);
  const trimmed = list.slice(0, 1000);
  setLocalArray(WRONG_KEY, trimmed);
  return trimmed;
}

/** Ücretsiz kullanıcı yanlış listesi limiti — Firestore fazlalıklarını bir kez temizler. */
export async function enforceWrongQuestionsLimitForFreeUser(user, userData = null) {
  if (!user?.uid || isUserPremium(userData, user)) return;
  try {
    const all = await readWrongFromFirestore(user, userData);
    const allIds = new Set(all.map((item) => String(item.questionId)));
    const allSnap = await getDocs(collection(db, "users", user.uid, "wrongQuestions"));
    const deleteTasks = allSnap.docs
      .filter((d) => !allIds.has(d.id))
      .map((d) => deleteDoc(d.ref));
    if (deleteTasks.length) await Promise.allSettled(deleteTasks);
  } catch {
    /* ignore */
  }
}

export async function addWrongQuestion(user, question, selectedAnswer, userData = null) {
  try {
    const questionId = getQuestionIdSafe(question);
    if (!questionId) return null;
    const now = safeNowIso();

    const writeWrongToLocal = () => {
      const next = buildNextWrongQuestionEntry(question, selectedAnswer, null, now);
      if (!next) return null;
      const current = readWrongFromLocal();
      const existingIdx = current.findIndex((item) => item.questionId === questionId);
      const prev = existingIdx >= 0 ? current[existingIdx] : null;
      const merged = buildNextWrongQuestionEntry(question, selectedAnswer, prev, now);
      if (existingIdx >= 0) {
        current[existingIdx] = merged;
      } else {
        current.push(merged);
      }
      const capped = isUserPremium(userData, user)
        ? current
        : sortWrongItems(current).slice(0, FREE_LIMITS.maxWrongQuestions);
      const trimmed = capped.slice(0, 1000);
      setLocalArray(WRONG_KEY, sortWrongItems(trimmed));
      trackClarityEvent("yanlis_soru_kaydedildi");
      return merged;
    };

    if (user?.uid) {
      try {
        const docRef = doc(db, "users", user.uid, "wrongQuestions", String(questionId));
        const snap = await getDoc(docRef);
        const previous = snap.exists() ? normalizeWrongItem(snap.data()) : null;
        const next = buildNextWrongQuestionEntry(question, selectedAnswer, previous, now);
        await setDoc(docRef, next, { merge: true });
        await enforceWrongQuestionsLimitForFreeUser(user, userData);
        trackClarityEvent("yanlis_soru_kaydedildi");
        return next;
      } catch (firestoreError) {
        console.error("addWrongQuestion firestore fallback to localStorage:", firestoreError);
        return writeWrongToLocal();
      }
    }

    return writeWrongToLocal();
  } catch (error) {
    console.error("addWrongQuestion error:", error);
    return null;
  }
}

export async function updateWrongQuestionAfterReview(
  user,
  question,
  isCorrect,
  selectedAnswer,
  userData
) {
  try {
    const questionId = getQuestionIdSafe(question);
    if (!questionId) return null;
    const now = safeNowIso();
    const optionCount = Array.isArray(question.options) ? question.options.length : 5;
    const normalizedSelected = normalizeSelectedAnswer(selectedAnswer, optionCount);

    const applyRules = (prev) => {
      const base = normalizeWrongItem({
        ...prev,
        questionId,
        ders: question.ders || prev?.ders || "",
        konu: question.konu || prev?.konu || "",
        correctAnswer: toNumber(question.correct, prev?.correctAnswer ?? null),
      });
      if (isCorrect) {
        const nextStreak = (base.correctReviewStreak || 0) + 1;
        return {
          ...base,
          reviewCount: (base.reviewCount || 0) + 1,
          lastReviewedAt: now,
          correctReviewStreak: nextStreak,
          isResolved: nextStreak >= 2,
          lastSelectedAnswer: normalizedSelected,
          updatedAt: now,
        };
      }
      return {
        ...base,
        wrongCount: (base.wrongCount || 0) + 1,
        reviewCount: (base.reviewCount || 0) + 1,
        lastWrongAt: now,
        lastReviewedAt: now,
        lastSelectedAnswer: normalizedSelected,
        correctReviewStreak: 0,
        isResolved: false,
        updatedAt: now,
      };
    };

    if (user?.uid) {
      const docRef = doc(db, "users", user.uid, "wrongQuestions", String(questionId));
      const snap = await getDoc(docRef);
      const previous = snap.exists() ? normalizeWrongItem(snap.data()) : null;
      const next = applyRules(previous || { wrongCount: 0, reviewCount: 0 });
      await setDoc(docRef, next, { merge: true });
      return next;
    }

    const current = readWrongFromLocal();
    const idx = current.findIndex((item) => item.questionId === questionId);
    const prev = idx >= 0 ? current[idx] : null;
    const next = applyRules(prev || { wrongCount: 0, reviewCount: 0 });
    if (idx >= 0) {
      current[idx] = next;
    } else {
      current.push(next);
    }
    const sorted = sortWrongItems(current);
    const limited = isUserPremium(userData) ? sorted : sorted.slice(0, FREE_LIMITS.maxWrongQuestions);
    setLocalArray(WRONG_KEY, limited);
    return next;
  } catch {
    return null;
  }
}

export async function toggleFavoriteQuestion(user, question) {
  try {
    const questionId = getQuestionIdSafe(question);
    if (!questionId) return { isFavorite: false };
    const payload = normalizeFavoriteItem({
      questionId,
      ders: question.ders || "",
      konu: question.konu || "",
      addedAt: safeNowIso(),
    });

    const toggleLocalFavorite = () => {
      const current = readFavoritesFromLocal();
      const idx = current.findIndex((item) => item.questionId === questionId);
      if (idx >= 0) {
        current.splice(idx, 1);
        setLocalArray(FAVORITE_KEY, current);
        trackClarityEvent("favori_cikarildi");
        return { isFavorite: false };
      }
      const next = [payload, ...current].slice(0, 1000);
      setLocalArray(FAVORITE_KEY, next);
      trackClarityEvent("favori_eklendi");
      return { isFavorite: true, item: payload };
    };

    if (user?.uid) {
      try {
        const docRef = doc(db, "users", user.uid, "favoriteQuestions", String(questionId));
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await deleteDoc(docRef);
          trackClarityEvent("favori_cikarildi");
          return { isFavorite: false };
        }
        await setDoc(docRef, payload, { merge: true });
        trackClarityEvent("favori_eklendi");
        return { isFavorite: true, item: payload };
      } catch {
        return toggleLocalFavorite();
      }
    }

    return toggleLocalFavorite();
  } catch {
    return { isFavorite: false };
  }
}

export async function isFavoriteQuestion(user, questionId) {
  try {
    if (!Number.isFinite(Number(questionId))) return false;
    const list = await getFavoriteQuestions(user);
    return list.some((item) => item.questionId === Number(questionId));
  } catch {
    return false;
  }
}

export async function getStudyCollectionSummary(user, userData = null) {
  try {
    const [wrongQuestions, favoriteQuestions] = await Promise.all([
      getWrongQuestions(user, userData),
      getFavoriteQuestions(user),
    ]);
    const unresolvedWrongCount = wrongQuestions.filter((item) => !item.isResolved).length;
    return {
      wrongCount: wrongQuestions.length,
      favoriteCount: favoriteQuestions.length,
      unresolvedWrongCount,
      reviewQueueCount: Math.min(
        MAX_TODAY_QUEUE,
        unresolvedWrongCount + favoriteQuestions.length
      ),
      limits: { dailyReviewLimit: MAX_TODAY_QUEUE },
    };
  } catch {
    return {
      wrongCount: 0,
      favoriteCount: 0,
      unresolvedWrongCount: 0,
      reviewQueueCount: 0,
      limits: { dailyReviewLimit: MAX_TODAY_QUEUE },
    };
  }
}

export async function buildTodayReviewQueue(user, questions, userData = null) {
  try {
    const list = Array.isArray(questions) ? questions : [];
    const mapById = new Map(list.map((q) => [Number(q.id), q]));
    const [wrongQuestions, favoriteQuestions] = await Promise.all([
      getWrongQuestions(user, userData),
      getFavoriteQuestions(user),
    ]);

    const scoredWrong = wrongQuestions
      .map((item) => {
        const q = mapById.get(item.questionId);
        if (!q) return null;
        const wrongCount = Math.max(1, toNumber(item.wrongCount, 1));
        const unresolvedBoost = item.isResolved ? 0 : 200;
        const wrongBoost = wrongCount >= 3 ? 150 : 80;
        const lastWrongMs = item.lastWrongAt ? new Date(item.lastWrongAt).getTime() : 0;
        const ageDays = lastWrongMs
          ? Math.max(0, Math.floor((Date.now() - lastWrongMs) / (1000 * 60 * 60 * 24)))
          : 0;
        return {
          question: q,
          questionId: item.questionId,
          score: unresolvedBoost + wrongBoost + wrongCount * 12 + Math.min(90, ageDays),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    const favoriteSet = new Set(favoriteQuestions.map((item) => item.questionId));
    const queue = [];
    const seen = new Set();

    scoredWrong.forEach((item) => {
      const maxQueue = isUserPremium(userData, user) ? MAX_TODAY_QUEUE : FREE_LIMITS.dailyReviewQuestions;
      if (queue.length >= maxQueue) return;
      if (seen.has(item.questionId)) return;
      seen.add(item.questionId);
      queue.push(item.question);
    });

    for (const fav of favoriteQuestions) {
      const maxQueue = isUserPremium(userData, user) ? MAX_TODAY_QUEUE : FREE_LIMITS.dailyReviewQuestions;
      if (queue.length >= maxQueue) break;
      if (seen.has(fav.questionId)) continue;
      const q = mapById.get(fav.questionId);
      if (!q) continue;
      seen.add(fav.questionId);
      queue.push(q);
    }

    const maxQueue = isUserPremium(userData, user) ? MAX_TODAY_QUEUE : FREE_LIMITS.dailyReviewQuestions;
    if (queue.length < maxQueue) {
      scoredWrong
        .filter((item) => favoriteSet.has(item.questionId))
        .forEach((item) => {
          if (queue.length >= maxQueue) return;
          if (seen.has(item.questionId)) return;
          seen.add(item.questionId);
          queue.push(item.question);
        });
    }

    return queue.slice(0, maxQueue);
  } catch {
    return [];
  }
}
