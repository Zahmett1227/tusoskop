import { db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { FREE_LIMITS } from "../config/limits";
import { isUserPremium } from "../utils/premiumUtils";

const USAGE_KEY = "tusoskopUsage";

export const getTodayKey = () => new Date().toISOString().slice(0, 10);
export const getMonthKey = () => new Date().toISOString().slice(0, 7);

const safeUsage = (raw = {}) => ({
  dateKey: raw.dateKey || getTodayKey(),
  monthKey: raw.monthKey || getMonthKey(),
  questionCount: Number(raw.questionCount || 0),
  topicTestCount: Number(raw.topicTestCount || 0),
  reviewQuestionCount: Number(raw.reviewQuestionCount || 0),
  fullExamCount: Number(raw.fullExamCount || 0),
});

const getLocalUsage = () => {
  if (typeof window === "undefined") return safeUsage();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(USAGE_KEY) || "{}");
    const usage = safeUsage(parsed);
    if (usage.dateKey !== getTodayKey()) {
      usage.dateKey = getTodayKey();
      usage.questionCount = 0;
      usage.topicTestCount = 0;
      usage.reviewQuestionCount = 0;
    }
    if (usage.monthKey !== getMonthKey()) {
      usage.monthKey = getMonthKey();
      usage.fullExamCount = 0;
    }
    return usage;
  } catch {
    return safeUsage();
  }
};

const setLocalUsage = (usage) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  } catch {
    // ignore storage errors
  }
};

const getLocalMonthlyUsage = () => {
  const usage = getLocalUsage();
  return {
    monthKey: usage.monthKey,
    fullExamCount: usage.fullExamCount,
  };
};

export async function getUserUsage(user) {
  const todayKey = getTodayKey();
  const monthKey = getMonthKey();
  if (!user?.uid) {
    const localUsage = getLocalUsage();
    setLocalUsage(localUsage);
    return localUsage;
  }

  const ref = doc(db, "users", user.uid, "usage", `usage_${todayKey}`);
  try {
    const snap = await getDoc(ref);
    const usage = snap.exists() ? safeUsage(snap.data()) : safeUsage({ dateKey: todayKey, monthKey });
    if (usage.dateKey !== todayKey || usage.monthKey !== monthKey) {
      usage.dateKey = todayKey;
      usage.monthKey = monthKey;
      usage.questionCount = 0;
      usage.topicTestCount = 0;
      usage.reviewQuestionCount = 0;
      usage.fullExamCount = 0;
      await setDoc(
        ref,
        {
          ...usage,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    return usage;
  } catch (error) {
    console.error("getUserUsage fallback to localStorage:", error);
    const localUsage = getLocalUsage();
    setLocalUsage(localUsage);
    return localUsage;
  }
}

async function saveUserUsage(user, usage) {
  const normalized = safeUsage(usage);
  if (!user?.uid) {
    setLocalUsage(normalized);
    return normalized;
  }
  const ref = doc(db, "users", user.uid, "usage", `usage_${normalized.dateKey}`);
  try {
    await setDoc(
      ref,
      {
        ...normalized,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return normalized;
  } catch (error) {
    console.error("saveUserUsage fallback to localStorage:", error);
    setLocalUsage(normalized);
    return normalized;
  }
}

async function getMonthlyFullExamUsage(user) {
  const monthKey = getMonthKey();
  if (!user?.uid) {
    const local = getLocalMonthlyUsage();
    if (local.monthKey !== monthKey) {
      const reset = { ...getLocalUsage(), monthKey, fullExamCount: 0 };
      setLocalUsage(reset);
      return { monthKey, fullExamCount: 0 };
    }
    return local;
  }

  const ref = doc(db, "users", user.uid, "usage", `usage_month_${monthKey}`);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return { monthKey, fullExamCount: 0 };
    const data = snap.data() || {};
    return {
      monthKey,
      fullExamCount: Number(data.fullExamCount || 0),
    };
  } catch (error) {
    console.error("getMonthlyFullExamUsage fallback to localStorage:", error);
    const local = getLocalMonthlyUsage();
    return {
      monthKey,
      fullExamCount: Number(local.fullExamCount || 0),
    };
  }
}

async function saveMonthlyFullExamUsage(user, fullExamCount) {
  const monthKey = getMonthKey();
  if (!user?.uid) {
    const local = getLocalUsage();
    setLocalUsage({ ...local, monthKey, fullExamCount: Number(fullExamCount || 0) });
    return;
  }

  const ref = doc(db, "users", user.uid, "usage", `usage_month_${monthKey}`);
  try {
    await setDoc(
      ref,
      {
        monthKey,
        fullExamCount: Number(fullExamCount || 0),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("saveMonthlyFullExamUsage fallback to localStorage:", error);
    const local = getLocalUsage();
    setLocalUsage({ ...local, monthKey, fullExamCount: Number(fullExamCount || 0) });
  }
}

const passIfPremium = (userData) => isUserPremium(userData) ? { allowed: true } : null;

export async function canAnswerQuestion(user, userData) {
  if (passIfPremium(userData)) return { allowed: true };
  const usage = await getUserUsage(user);
  return {
    allowed: usage.questionCount < FREE_LIMITS.dailyQuestions,
    usage,
    limit: FREE_LIMITS.dailyQuestions,
    remaining: Math.max(0, FREE_LIMITS.dailyQuestions - usage.questionCount),
  };
}

export async function incrementQuestionUsage(user, userData, count = 1) {
  if (passIfPremium(userData)) return null;
  const usage = await getUserUsage(user);
  usage.questionCount += Number(count || 0);
  return saveUserUsage(user, usage);
}

export async function canStartTopicTest(user, userData) {
  if (passIfPremium(userData)) return { allowed: true };
  const usage = await getUserUsage(user);
  return {
    allowed: usage.topicTestCount < FREE_LIMITS.dailyTopicTests,
    usage,
    limit: FREE_LIMITS.dailyTopicTests,
    remaining: Math.max(0, FREE_LIMITS.dailyTopicTests - usage.topicTestCount),
  };
}

export async function incrementTopicTestUsage(user, userData) {
  if (passIfPremium(userData)) return null;
  const usage = await getUserUsage(user);
  usage.topicTestCount += 1;
  return saveUserUsage(user, usage);
}

export async function canStartFullExam(user, userData) {
  if (passIfPremium(userData)) return { allowed: true };
  const usage = await getMonthlyFullExamUsage(user);
  return {
    allowed: usage.fullExamCount < FREE_LIMITS.monthlyFullExams,
    usage,
    limit: FREE_LIMITS.monthlyFullExams,
    remaining: Math.max(0, FREE_LIMITS.monthlyFullExams - usage.fullExamCount),
  };
}

export async function incrementFullExamUsage(user, userData) {
  if (passIfPremium(userData)) return null;
  const usage = await getMonthlyFullExamUsage(user);
  const next = Number(usage.fullExamCount || 0) + 1;
  await saveMonthlyFullExamUsage(user, next);
  return { monthKey: usage.monthKey, fullExamCount: next };
}

export async function canStartReview(user, userData, requestedCount = 1) {
  if (passIfPremium(userData)) return { allowed: true };
  const usage = await getUserUsage(user);
  const remaining = Math.max(0, FREE_LIMITS.dailyReviewQuestions - usage.reviewQuestionCount);
  return {
    allowed: remaining > 0,
    usage,
    limit: FREE_LIMITS.dailyReviewQuestions,
    remaining,
    allowedCount: Math.max(0, Math.min(remaining, Number(requestedCount || 0))),
  };
}

export async function incrementReviewUsage(user, userData, count = 1) {
  if (passIfPremium(userData)) return null;
  const usage = await getUserUsage(user);
  usage.reviewQuestionCount += Number(count || 0);
  return saveUserUsage(user, usage);
}

export async function getRemainingFreeUsage(user, userData) {
  if (passIfPremium(userData)) return { unlimited: true };
  const usage = await getUserUsage(user);
  const monthlyUsage = await getMonthlyFullExamUsage(user);
  return {
    unlimited: false,
    questionRemaining: Math.max(0, FREE_LIMITS.dailyQuestions - usage.questionCount),
    topicTestRemaining: Math.max(0, FREE_LIMITS.dailyTopicTests - usage.topicTestCount),
    reviewRemaining: Math.max(0, FREE_LIMITS.dailyReviewQuestions - usage.reviewQuestionCount),
    fullExamRemaining: Math.max(0, FREE_LIMITS.monthlyFullExams - monthlyUsage.fullExamCount),
  };
}
