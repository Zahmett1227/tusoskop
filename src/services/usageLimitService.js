import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import { FREE_LIMITS } from "../config/limits";
import { isUserPremium } from "../utils/premiumUtils";

const USAGE_KEY = "tusoskopUsage";

export class UsageLimitError extends Error {
  /**
   * @param {string} code - Server or logical limit code
   * @param {string} [message]
   */
  constructor(code, message) {
    super(message || code);
    this.name = "UsageLimitError";
    this.code = code;
  }
}

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

/**
 * Local usage only protects anonymous/offline reads. Authenticated increments must
 * be accepted by Cloud Functions before a limited action proceeds.
 */
function mergeDailyUsageWithLocal(remote, local, todayKey, monthKey) {
  const r = safeUsage(remote);
  const l = safeUsage(local);
  if (l.dateKey !== todayKey || l.monthKey !== monthKey) {
    return r;
  }
  return safeUsage({
    dateKey: todayKey,
    monthKey,
    questionCount: Math.max(r.questionCount, l.questionCount),
    topicTestCount: Math.max(r.topicTestCount, l.topicTestCount),
    reviewQuestionCount: Math.max(r.reviewQuestionCount, l.reviewQuestionCount),
    fullExamCount: Math.max(r.fullExamCount, l.fullExamCount),
  });
}

let incrementUsageCallable = null;
function getIncrementUsageCallable() {
  if (!incrementUsageCallable) {
    incrementUsageCallable = httpsCallable(functions, "incrementUsage");
  }
  return incrementUsageCallable;
}

async function invokeIncrementUsage(payload) {
  const callable = getIncrementUsageCallable();
  const result = await callable(payload);
  return result.data;
}

/**
 * Firebase callable'ın geçici/ağ kaynaklı hatası mı?
 * Bu durumlarda kullanıcıyı sert biçimde bloklamak yerine işleme izin
 * verilir; gerçek limit denetimi sayaç sunucu tarafında olduğu için
 * bir sonraki başarılı çağrıda yine devreye girer. Yetki/kimlik gibi
 * kalıcı hatalarda ise güvenli tarafta kalıp bloklamaya devam ederiz.
 */
function isTransientUsageError(err) {
  const code = String(err?.code || "");
  return (
    code === "functions/unavailable" ||
    code === "functions/deadline-exceeded" ||
    code === "functions/internal" ||
    code === "functions/cancelled" ||
    code === "functions/aborted" ||
    code === "functions/resource-exhausted" ||
    // Kod yoksa genelde ağ/fetch hatasıdır
    code === ""
  );
}

export async function getUserUsage(user) {
  const todayKey = getTodayKey();
  const monthKey = getMonthKey();
  const localUsage = getLocalUsage();

  if (!user?.uid) {
    setLocalUsage(localUsage);
    return localUsage;
  }

  const ref = doc(db, "users", user.uid, "usage", `usage_${todayKey}`);
  try {
    const snap = await getDoc(ref);
    let remote;
    if (!snap.exists()) {
      remote = safeUsage({ dateKey: todayKey, monthKey });
    } else {
      const usage = safeUsage(snap.data());
      if (usage.dateKey !== todayKey || usage.monthKey !== monthKey) {
        remote = safeUsage({
          dateKey: todayKey,
          monthKey,
          questionCount: 0,
          topicTestCount: 0,
          reviewQuestionCount: 0,
          fullExamCount: 0,
        });
      } else {
        remote = usage;
      }
    }
    return mergeDailyUsageWithLocal(remote, localUsage, todayKey, monthKey);
  } catch (error) {
    console.error("getUserUsage fallback to localStorage:", error);
    setLocalUsage(localUsage);
    return localUsage;
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
    const remoteCount = snap.exists() ? Number(snap.data()?.fullExamCount || 0) : 0;
    const local = getLocalMonthlyUsage();
    const localCount =
      local.monthKey === monthKey ? Number(local.fullExamCount || 0) : 0;
    return {
      monthKey,
      fullExamCount: Math.max(remoteCount, localCount),
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

const passIfPremium = (user, userData) => (isUserPremium(userData, user) ? { allowed: true } : null);

export async function canAnswerQuestion(user, userData) {
  if (passIfPremium(user, userData)) return { allowed: true };
  const usage = await getUserUsage(user);
  return {
    allowed: usage.questionCount < FREE_LIMITS.dailyQuestions,
    usage,
    limit: FREE_LIMITS.dailyQuestions,
    remaining: Math.max(0, FREE_LIMITS.dailyQuestions - usage.questionCount),
  };
}

export async function incrementQuestionUsage(user, userData, count = 1) {
  if (passIfPremium(user, userData)) return null;
  const delta = Number(count || 0) || 1;
  try {
    const data = await invokeIncrementUsage({
      type: "question",
      delta,
    });
    if (!data.success) {
      throw new UsageLimitError(data.code || "daily_question_limit", data.message);
    }
    return data.usage ? safeUsage(data.usage) : null;
  } catch (err) {
    if (err instanceof UsageLimitError) throw err;
    if (isTransientUsageError(err)) {
      console.warn("incrementQuestionUsage: geçici hata; işleme izin veriliyor", err);
      return null;
    }
    console.warn("incrementQuestionUsage: callable failed; blocking limited action", err);
    throw new UsageLimitError(
      "usage_counter_unavailable",
      "Kullanım sayacı sunucuda doğrulanamadı."
    );
  }
}

export async function canStartTopicTest(user, userData) {
  if (passIfPremium(user, userData)) return { allowed: true };
  const usage = await getUserUsage(user);
  return {
    allowed: usage.topicTestCount < FREE_LIMITS.dailyTopicTests,
    usage,
    limit: FREE_LIMITS.dailyTopicTests,
    remaining: Math.max(0, FREE_LIMITS.dailyTopicTests - usage.topicTestCount),
  };
}

export async function incrementTopicTestUsage(user, userData) {
  if (passIfPremium(user, userData)) return null;
  try {
    const data = await invokeIncrementUsage({ type: "topicTest" });
    if (!data.success) {
      throw new UsageLimitError(data.code || "daily_topic_test_limit", data.message);
    }
    return data.usage ? safeUsage(data.usage) : null;
  } catch (err) {
    if (err instanceof UsageLimitError) throw err;
    if (isTransientUsageError(err)) {
      console.warn("incrementTopicTestUsage: geçici hata; işleme izin veriliyor", err);
      return null;
    }
    console.warn("incrementTopicTestUsage: callable failed; blocking limited action", err);
    throw new UsageLimitError(
      "usage_counter_unavailable",
      "Kullanım sayacı sunucuda doğrulanamadı."
    );
  }
}

export async function canStartFullExam(user, userData) {
  if (passIfPremium(user, userData)) return { allowed: true };
  const usage = await getMonthlyFullExamUsage(user);
  return {
    allowed: usage.fullExamCount < FREE_LIMITS.monthlyFullExams,
    usage,
    limit: FREE_LIMITS.monthlyFullExams,
    remaining: Math.max(0, FREE_LIMITS.monthlyFullExams - usage.fullExamCount),
  };
}

export async function incrementFullExamUsage(user, userData) {
  if (passIfPremium(user, userData)) return null;
  try {
    const data = await invokeIncrementUsage({ type: "fullExam" });
    if (!data.success) {
      throw new UsageLimitError(data.code || "monthly_exam_limit", data.message);
    }
    return { monthKey: getMonthKey(), fullExamCount: data.fullExamCount };
  } catch (err) {
    if (err instanceof UsageLimitError) throw err;
    if (isTransientUsageError(err)) {
      console.warn("incrementFullExamUsage: geçici hata; işleme izin veriliyor", err);
      return { monthKey: getMonthKey(), fullExamCount: null };
    }
    console.warn("incrementFullExamUsage: callable failed; blocking limited action", err);
    throw new UsageLimitError(
      "usage_counter_unavailable",
      "Kullanım sayacı sunucuda doğrulanamadı."
    );
  }
}

export async function canStartReview(user, userData, requestedCount = 1) {
  if (passIfPremium(user, userData)) return { allowed: true };
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
  if (passIfPremium(user, userData)) return null;
  const delta = Number(count || 0) || 1;
  try {
    const data = await invokeIncrementUsage({
      type: "review",
      delta,
    });
    if (!data.success) {
      throw new UsageLimitError(data.code || "daily_review_limit", data.message);
    }
    return data.usage ? safeUsage(data.usage) : null;
  } catch (err) {
    if (err instanceof UsageLimitError) throw err;
    if (isTransientUsageError(err)) {
      console.warn("incrementReviewUsage: geçici hata; işleme izin veriliyor", err);
      return null;
    }
    console.warn("incrementReviewUsage: callable failed; blocking limited action", err);
    throw new UsageLimitError(
      "usage_counter_unavailable",
      "Kullanım sayacı sunucuda doğrulanamadı."
    );
  }
}

export async function getRemainingFreeUsage(user, userData) {
  if (passIfPremium(user, userData)) return { unlimited: true };
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

/** UI metinleri — App.jsx limit modal ile uyumlu */
export function limitModalFromUsageError(code) {
  switch (code) {
    case "daily_question_limit":
      return {
        title: "Bugünkü ücretsiz soru hakkın doldu",
        description:
          "Free planda günde 30 soru çözebilirsin. Plus ile sınırsız soru, deneme ve tekrar açılır.",
        limitReason: "daily_question_limit",
      };
    case "daily_topic_test_limit":
      return {
        title: "Günlük konu testi limitine ulaştın",
        description:
          "Free planda günde en fazla 2 konu testi başlatabilirsin. Plus ile sınırsız konu testi açılır.",
        limitReason: "daily_topic_test_limit",
      };
    case "monthly_exam_limit":
      return {
        title: "Bu ayki ücretsiz deneme hakkını kullandın",
        description:
          "Free planda ayda 1 tam deneme çözebilirsin. Plus ile sınırsız deneme ve gelişmiş analiz açılır.",
        limitReason: "monthly_exam_limit",
      };
    case "daily_review_limit":
      return {
        title: "Bugünkü ücretsiz tekrar hakkın doldu",
        description:
          "Free planda günde 10 tekrar sorusu çözebilirsin. Plus ile tekrar kuyruğun sınırsız açılır.",
        limitReason: "daily_review_limit_study",
      };
    case "usage_counter_unavailable":
      return {
        title: "Kullanım doğrulanamadı",
        description:
          "Kullanım sayacı sunucuda doğrulanamadı. Bağlantını kontrol edip tekrar dene.",
        limitReason: "usage_counter_unavailable",
      };
    default:
      return {
        title: "Limit aşıldı",
        description: "Bugünkü kullanım limitine ulaştın.",
        limitReason: "unknown_limit",
      };
  }
}
