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

const WRONG_KEY = "tusoskopWrongQuestions";
const FAVORITE_KEY = "tusoskopFavoriteQuestions";
const MAX_TODAY_QUEUE = 20;

const FREE_PREMIUM_LIMITS = {
  wrongQuestionsSoftLimit: 1000,
  favoriteQuestionsSoftLimit: 1000,
  dailyReviewLimit: MAX_TODAY_QUEUE,
};

const safeNowIso = () => new Date().toISOString();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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

async function readWrongFromFirestore(user) {
  const ref = collection(db, "users", user.uid, "wrongQuestions");
  const snap = await getDocs(ref);
  return sortWrongItems(
    snap.docs
      .map((d) => normalizeWrongItem(d.data()))
      .filter((item) => Number.isFinite(item.questionId))
  );
}

async function readFavoritesFromFirestore(user) {
  const ref = collection(db, "users", user.uid, "favoriteQuestions");
  const snap = await getDocs(ref);
  return snap.docs
    .map((d) => normalizeFavoriteItem(d.data()))
    .filter((item) => Number.isFinite(item.questionId))
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

function readWrongFromLocal() {
  return sortWrongItems(
    getLocalArray(WRONG_KEY)
      .map(normalizeWrongItem)
      .filter((item) => Number.isFinite(item.questionId))
  );
}

function readFavoritesFromLocal() {
  return getLocalArray(FAVORITE_KEY)
    .map(normalizeFavoriteItem)
    .filter((item) => Number.isFinite(item.questionId))
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

export async function getWrongQuestions(user) {
  try {
    if (user?.uid) return await readWrongFromFirestore(user);
    return readWrongFromLocal();
  } catch {
    return readWrongFromLocal();
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

export async function addWrongQuestion(user, question, selectedAnswer) {
  try {
    if (!question?.id) return null;
    const now = safeNowIso();
    const questionId = Number(question.id);
    const normalizedSelected =
      selectedAnswer === null || selectedAnswer === undefined
        ? null
        : toNumber(selectedAnswer, null);
    const patch = {
      questionId,
      ders: String(question.ders || ""),
      konu: String(question.konu || ""),
      lastSelectedAnswer: normalizedSelected,
      correctAnswer: toNumber(question.correct, null),
      updatedAt: now,
    };

    const writeWrongToLocal = () => {
      const current = readWrongFromLocal();
      const existingIdx = current.findIndex((item) => item.questionId === questionId);
      if (existingIdx >= 0) {
        const prev = current[existingIdx];
        current[existingIdx] = {
          ...prev,
          ...patch,
          wrongCount: (prev.wrongCount || 0) + 1,
          lastWrongAt: now,
          correctReviewStreak: 0,
          isResolved: false,
        };
      } else {
        current.push({
          ...patch,
          wrongCount: 1,
          lastWrongAt: now,
          reviewCount: 0,
          lastReviewedAt: null,
          correctReviewStreak: 0,
          isResolved: false,
        });
      }
      const trimmed = current.slice(0, FREE_PREMIUM_LIMITS.wrongQuestionsSoftLimit);
      setLocalArray(WRONG_KEY, sortWrongItems(trimmed));
      trackClarityEvent("yanlis_soru_kaydedildi");
      return current[existingIdx >= 0 ? existingIdx : current.length - 1];
    };

    if (user?.uid) {
      try {
        const docRef = doc(db, "users", user.uid, "wrongQuestions", String(questionId));
        const snap = await getDoc(docRef);
        const previous = snap.exists() ? normalizeWrongItem(snap.data()) : null;
        const next = {
          ...patch,
          wrongCount: (previous?.wrongCount || 0) + 1,
          lastWrongAt: now,
          reviewCount: previous?.reviewCount || 0,
          lastReviewedAt: previous?.lastReviewedAt || null,
          correctReviewStreak: 0,
          isResolved: false,
        };
        await setDoc(docRef, next, { merge: true });
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
  selectedAnswer
) {
  try {
    if (!question?.id) return null;
    const now = safeNowIso();
    const questionId = Number(question.id);
    const normalizedSelected =
      selectedAnswer === null || selectedAnswer === undefined
        ? null
        : toNumber(selectedAnswer, null);

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
    setLocalArray(WRONG_KEY, sortWrongItems(current));
    return next;
  } catch {
    return null;
  }
}

export async function toggleFavoriteQuestion(user, question) {
  try {
    if (!question?.id) return { isFavorite: false };
    const questionId = Number(question.id);
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
      const next = [payload, ...current].slice(0, FREE_PREMIUM_LIMITS.favoriteQuestionsSoftLimit);
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

export async function getStudyCollectionSummary(user) {
  try {
    const [wrongQuestions, favoriteQuestions] = await Promise.all([
      getWrongQuestions(user),
      getFavoriteQuestions(user),
    ]);
    const unresolvedWrongCount = wrongQuestions.filter((item) => !item.isResolved).length;
    return {
      wrongCount: wrongQuestions.length,
      favoriteCount: favoriteQuestions.length,
      unresolvedWrongCount,
      reviewQueueCount: Math.min(
        FREE_PREMIUM_LIMITS.dailyReviewLimit,
        unresolvedWrongCount + favoriteQuestions.length
      ),
      limits: FREE_PREMIUM_LIMITS,
    };
  } catch {
    return {
      wrongCount: 0,
      favoriteCount: 0,
      unresolvedWrongCount: 0,
      reviewQueueCount: 0,
      limits: FREE_PREMIUM_LIMITS,
    };
  }
}

export async function buildTodayReviewQueue(user, questions) {
  try {
    const list = Array.isArray(questions) ? questions : [];
    const mapById = new Map(list.map((q) => [Number(q.id), q]));
    const [wrongQuestions, favoriteQuestions] = await Promise.all([
      getWrongQuestions(user),
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
      if (queue.length >= MAX_TODAY_QUEUE) return;
      if (seen.has(item.questionId)) return;
      seen.add(item.questionId);
      queue.push(item.question);
    });

    for (const fav of favoriteQuestions) {
      if (queue.length >= MAX_TODAY_QUEUE) break;
      if (seen.has(fav.questionId)) continue;
      const q = mapById.get(fav.questionId);
      if (!q) continue;
      seen.add(fav.questionId);
      queue.push(q);
    }

    if (queue.length < MAX_TODAY_QUEUE) {
      scoredWrong
        .filter((item) => favoriteSet.has(item.questionId))
        .forEach((item) => {
          if (queue.length >= MAX_TODAY_QUEUE) return;
          if (seen.has(item.questionId)) return;
          seen.add(item.questionId);
          queue.push(item.question);
        });
    }

    return queue.slice(0, MAX_TODAY_QUEUE);
  } catch {
    return [];
  }
}
