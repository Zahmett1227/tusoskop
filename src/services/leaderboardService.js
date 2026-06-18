import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { getCurrentWeekId } from "../utils/weekIdUtils";
import {
  calcQuestionPoints,
  EVENT_TYPES,
  LEAGUES,
  getLeagueForSubject,
  SCORING,
} from "../utils/leaderboardScoreUtils";
import { normalizeNickname } from "../utils/nicknameUtils";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// Oturum başına profil cache — Firestore read sayısını azaltır
let _profileCache = null;

export function clearLeaderboardProfileCache() {
  _profileCache = null;
}


function isOptedInFromCache(uid) {
  if (!_profileCache || _profileCache.uid !== uid) return false;
  return Boolean(_profileCache.isOptedIn);
}

function canWrite() {
  return Boolean(auth.currentUser?.uid);
}

// league: "temel" | "klinik" — weekId'ye suffix olarak eklenir
function leagueWeekId(weekId, league) {
  return league ? `${weekId}_${league}` : weekId;
}

function weekUsersRef(weekId) {
  return collection(db, "weeklyLeaderboard", weekId, "users");
}

function weekUserDocRef(weekId, uid) {
  return doc(db, "weeklyLeaderboard", weekId, "users", uid);
}

function solvedRef(weekId, uid, questionId) {
  return doc(db, "weeklyLeaderboard", weekId, "users", uid, "solvedQuestions", String(questionId));
}

function dailyDedupeRef(weekId, uid, eventType) {
  const key = `${eventType}_${todayStr()}`;
  return doc(db, "weeklyLeaderboard", weekId, "users", uid, "dailyEvents", key);
}

function profileRef(uid) {
  return doc(db, "leaderboardProfiles", uid);
}

function normalizedNicknameRef(normalized) {
  return doc(db, "normalizedNicknames", normalized);
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getLeaderboardProfile(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(profileRef(uid));
    const data = snap.exists() ? snap.data() : null;
    if (data) _profileCache = data; // Cache güncelle
    return data;
  } catch {
    return null;
  }
}

export async function upsertLeaderboardProfile(uid, { nickname, isOptedIn }) {
  if (!uid || !canWrite()) return null;
  const normalized = normalizeNickname(nickname);

  try {
    return await runTransaction(db, async (tx) => {
      const profileSnap = await tx.get(profileRef(uid));
      const existing = profileSnap.exists() ? profileSnap.data() : null;

      const oldNormalized = existing?.normalizedNickname || null;
      const nicknameChanged = oldNormalized !== normalized;

      if (nicknameChanged) {
        // Claim yeni nickname
        const claimRef = normalizedNicknameRef(normalized);
        const claimSnap = await tx.get(claimRef);
        if (claimSnap.exists() && claimSnap.data().uid !== uid) {
          throw new Error("Bu rumuz zaten kullanımda.");
        }
        tx.set(claimRef, { uid, claimedAt: serverTimestamp() });

        // Eski nickname'i serbest bırak
        if (oldNormalized && oldNormalized !== normalized) {
          const oldRef = normalizedNicknameRef(oldNormalized);
          const oldSnap = await tx.get(oldRef);
          if (oldSnap.exists() && oldSnap.data().uid === uid) {
            tx.delete(oldRef);
          }
        }
      }

      const now = serverTimestamp();
      const profileData = {
        uid,
        nickname,
        normalizedNickname: normalized,
        isOptedIn: Boolean(isOptedIn),
        updatedAt: now,
        ...(existing ? {} : { createdAt: now }),
        ...(nicknameChanged ? { lastNicknameChangeAt: now } : {}),
      };
      tx.set(profileRef(uid), profileData, { merge: true });
      // Cache güncelle (serverTimestamp yerine Date nesnesi kullan)
      _profileCache = { ...profileData, updatedAt: new Date() };
      return profileData;
    });
  } catch (err) {
    console.error("upsertLeaderboardProfile error:", err);
    throw err;
  }
}

export async function checkNicknameAvailable(nickname, currentUid = null) {
  const normalized = normalizeNickname(nickname);
  try {
    const snap = await getDoc(normalizedNicknameRef(normalized));
    if (!snap.exists()) return true;
    if (currentUid && snap.data().uid === currentUid) return true;
    return false;
  } catch {
    return true;
  }
}

// ─── Score Events ─────────────────────────────────────────────────────────────

/**
 * Soru çözme puanı gönderir. Aynı sorudan aynı hafta tekrar puan verilmez.
 * Fire-and-forget olarak çağrılmalı — await kullanma.
 */
/**
 * Soru çözme puanı gönderir. Aynı sorudan aynı hafta tekrar puan verilmez.
 * Kullanıcı opt-in değilse sessizce atlar.
 * Fire-and-forget olarak çağrılmalı.
 */
export async function submitQuestionScoreEvent(uid, {
  questionId,
  isCorrect,
  difficulty,
  lessonName,
  topicName,
  weekId,
  nickname,
}) {
  if (!uid || !canWrite() || !questionId) return;
  if (!isOptedInFromCache(uid)) return;
  if (!weekId) weekId = getCurrentWeekId();

  const league = getLeagueForSubject(lessonName);
  const wid = leagueWeekId(weekId, league);
  const points = calcQuestionPoints({ isCorrect, difficulty });
  const dedupeSolved = solvedRef(wid, uid, questionId);

  try {
    await runTransaction(db, async (tx) => {
      const solvedSnap = await tx.get(dedupeSolved);
      if (solvedSnap.exists()) return;

      const userRef = weekUserDocRef(wid, uid);
      const userSnap = await tx.get(userRef);
      const currentSolvedCount = userSnap.exists() ? (userSnap.data().solvedCount || 0) : 0;

      tx.set(dedupeSolved, {
        questionId: Number(questionId),
        isCorrect,
        difficulty,
        lessonName: lessonName || null,
        topicName: topicName || null,
        solvedAt: serverTimestamp(),
      });

      const newCorrectDelta = isCorrect ? 1 : 0;
      const newSolvedCount = currentSolvedCount + 1;
      const currentCorrectCount = userSnap.exists() ? (userSnap.data().correctCount || 0) : 0;
      const newCorrectCount = currentCorrectCount + newCorrectDelta;
      const newAccuracy = newSolvedCount > 0 ? Math.round((newCorrectCount / newSolvedCount) * 100) : 0;

      tx.set(userRef, {
        nickname: nickname || _profileCache?.nickname || userSnap.data()?.nickname || "Anonim",
        score: increment(points),
        solvedCount: increment(1),
        correctCount: increment(newCorrectDelta),
        accuracy: newAccuracy,
        lastScoreAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
  } catch (err) {
    if (import.meta.env.DEV) console.warn("submitQuestionScoreEvent error:", err);
  }
}

/**
 * Günlük event bonusu: FSRS tamamlama, streak günü, deneme.
 * Her iki ligə de ayrı transaction ile yazılır (ortak kriterler).
 * Fire-and-forget olarak çağrılmalı.
 */
export async function submitDailyBonusEvent(uid, { eventType, weekId, nickname, examId }) {
  if (!uid || !canWrite()) return;
  if (!isOptedInFromCache(uid)) return;
  if (!weekId) weekId = getCurrentWeekId();

  await Promise.all([
    _submitDailyBonusToLeague(uid, { eventType, wid: leagueWeekId(weekId, LEAGUES.TEMEL), nickname, examId }),
    _submitDailyBonusToLeague(uid, { eventType, wid: leagueWeekId(weekId, LEAGUES.KLINIK), nickname, examId }),
  ]);
}

async function _submitDailyBonusToLeague(uid, { eventType, wid, nickname, examId }) {
  const bonusMap = {
    [EVENT_TYPES.FSRS_DAILY_COMPLETED]: SCORING.FSRS_DAILY_BONUS,
    [EVENT_TYPES.STREAK_DAY]: SCORING.STREAK_DAY_BONUS,
    [EVENT_TYPES.MOCK_EXAM_COMPLETED]: SCORING.MOCK_EXAM_BONUS,
  };
  const points = bonusMap[eventType];
  if (!points) return;

  const dedupeDocRef = eventType === EVENT_TYPES.MOCK_EXAM_COMPLETED && examId
    ? doc(db, "weeklyLeaderboard", wid, "users", uid, "dailyEvents", `exam_${examId}`)
    : doc(db, "weeklyLeaderboard", wid, "users", uid, "dailyEvents", `${eventType}_${todayStr()}`);

  const fieldMap = {
    [EVENT_TYPES.FSRS_DAILY_COMPLETED]: "fsrsCompletedCount",
    [EVENT_TYPES.STREAK_DAY]: "streakBonusCount",
    [EVENT_TYPES.MOCK_EXAM_COMPLETED]: "mockExamCount",
  };
  const countField = fieldMap[eventType];

  try {
    await runTransaction(db, async (tx) => {
      const dedupeSnap = await tx.get(dedupeDocRef);
      if (dedupeSnap.exists()) return;

      const userRef = weekUserDocRef(wid, uid);
      const userSnap = await tx.get(userRef);

      tx.set(dedupeDocRef, { eventType, points, createdAt: serverTimestamp() });
      tx.set(userRef, {
        nickname: nickname || _profileCache?.nickname || userSnap.data()?.nickname || "Anonim",
        score: increment(points),
        ...(countField ? { [countField]: increment(1) } : {}),
        lastScoreAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
  } catch (err) {
    if (import.meta.env.DEV) console.warn("submitDailyBonusEvent error:", err);
  }
}

// ─── Rankings ─────────────────────────────────────────────────────────────────

export async function getTopRankings(weekId, topN = 50, league) {
  if (!weekId) weekId = getCurrentWeekId();
  const wid = leagueWeekId(weekId, league);
  try {
    const q = query(weekUsersRef(wid), orderBy("score", "desc"), limit(topN));
    const snap = await getDocs(q);
    return snap.docs.map((d, i) => ({
      rank: i + 1,
      nickname: d.data().nickname || "Anonim",
      score: d.data().score || 0,
      solvedCount: d.data().solvedCount || 0,
      accuracy: d.data().accuracy || 0,
      streakBonusCount: d.data().streakBonusCount || 0,
      fsrsCompletedCount: d.data().fsrsCompletedCount || 0,
      docId: d.id,
    }));
  } catch (err) {
    console.error("getTopRankings error:", err);
    return [];
  }
}

export async function getUserWeeklyStats(uid, weekId, league) {
  if (!uid) return null;
  if (!weekId) weekId = getCurrentWeekId();
  const wid = leagueWeekId(weekId, league);
  try {
    const snap = await getDoc(weekUserDocRef(wid, uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      score: data.score || 0,
      solvedCount: data.solvedCount || 0,
      correctCount: data.correctCount || 0,
      accuracy: data.accuracy || 0,
      streakBonusCount: data.streakBonusCount || 0,
      fsrsCompletedCount: data.fsrsCompletedCount || 0,
      mockExamCount: data.mockExamCount || 0,
      lastScoreAt: data.lastScoreAt || null,
    };
  } catch {
    return null;
  }
}

export async function getUserRank(uid, weekId, league) {
  if (!uid) return null;
  if (!weekId) weekId = getCurrentWeekId();
  try {
    const userStats = await getUserWeeklyStats(uid, weekId, league);
    if (!userStats) return null;

    const topList = await getTopRankings(weekId, 200, league);
    const found = topList.findIndex((item) => item.docId === uid);
    if (found !== -1) return found + 1;

    return topList.length + 1;
  } catch {
    return null;
  }
}
