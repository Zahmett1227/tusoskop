const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { FREE_LIMITS } = require("./constants");

/** Callable preflight + browser clients (match Hosting / Vite dev ports). */
const allowedOrigins = [
  "https://tusoskop.com",
  "https://www.tusoskop.com",
  "http://localhost:5173",
  "http://localhost:5174",
];

initializeApp();
const db = getFirestore();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

function premiumUntilToDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") {
    const d = value.toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isPremiumServer(data) {
  if (!data) return false;
  if (data.lifetimePremium === true) return true;
  if (data.plan !== "plus") return false;
  if (data.premiumStatus !== "active") return false;
  const until = premiumUntilToDate(data.premiumUntil);
  if (!until) return false;
  return until > new Date();
}

function normalizeDailyUsage(raw, tKey, mKey) {
  return {
    dateKey: raw.dateKey || tKey,
    monthKey: raw.monthKey || mKey,
    questionCount: Number(raw.questionCount || 0),
    topicTestCount: Number(raw.topicTestCount || 0),
    reviewQuestionCount: Number(raw.reviewQuestionCount || 0),
    fullExamCount: Number(raw.fullExamCount || 0),
  };
}

/**
 * Authenticated users only. Applies usage increments for free plans with server-side caps.
 * Premium users: no-op success (no usage doc writes required).
 */
exports.incrementUsage = onCall(
  {
    region: "us-central1",
    cors: allowedOrigins,
  },
  async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Giriş gerekli.");
  }

  const uid = request.auth.uid;
  const type = request.data?.type;
  const deltaRaw = Number(request.data?.delta ?? 1);
  const delta = Number.isFinite(deltaRaw) ? Math.min(Math.max(deltaRaw, 1), 50) : 1;

  const allowedTypes = new Set(["question", "topicTest", "review", "fullExam"]);
  if (!allowedTypes.has(type)) {
    throw new HttpsError("invalid-argument", "Geçersiz kullanım tipi.");
  }

  const userRef = db.doc(`users/${uid}`);
  const tKey = todayKey();
  const mKey = monthKey();

  return db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.exists ? userSnap.data() : {};

    if (isPremiumServer(userData)) {
      return { success: true, premium: true };
    }

    if (type === "fullExam") {
      const monthRef = db.doc(`users/${uid}/usage/usage_month_${mKey}`);
      const monthSnap = await transaction.get(monthRef);
      let fullExamCount = 0;
      if (monthSnap.exists) {
        fullExamCount = Number(monthSnap.data()?.fullExamCount || 0);
      }
      if (fullExamCount >= FREE_LIMITS.monthlyFullExams) {
        return {
          success: false,
          code: "monthly_exam_limit",
          message: "Aylık deneme limiti doldu.",
        };
      }
      transaction.set(
        monthRef,
        {
          monthKey: mKey,
          fullExamCount: fullExamCount + 1,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { success: true, fullExamCount: fullExamCount + 1 };
    }

    const usageRef = db.doc(`users/${uid}/usage/usage_${tKey}`);
    const usageSnap = await transaction.get(usageRef);
    let usage = normalizeDailyUsage(
      usageSnap.exists ? usageSnap.data() : {},
      tKey,
      mKey
    );

    if (usage.dateKey !== tKey || usage.monthKey !== mKey) {
      usage = {
        dateKey: tKey,
        monthKey: mKey,
        questionCount: 0,
        topicTestCount: 0,
        reviewQuestionCount: 0,
        fullExamCount: 0,
      };
    }

    if (type === "question") {
      const next = usage.questionCount + delta;
      if (usage.questionCount >= FREE_LIMITS.dailyQuestions) {
        return {
          success: false,
          code: "daily_question_limit",
          message: "Günlük soru limiti doldu.",
        };
      }
      if (next > FREE_LIMITS.dailyQuestions) {
        return {
          success: false,
          code: "daily_question_limit",
          message: "Günlük soru limiti doldu.",
        };
      }
      usage.questionCount = next;
    } else if (type === "topicTest") {
      if (usage.topicTestCount >= FREE_LIMITS.dailyTopicTests) {
        return {
          success: false,
          code: "daily_topic_test_limit",
          message: "Günlük konu testi limiti doldu.",
        };
      }
      usage.topicTestCount += 1;
    } else if (type === "review") {
      const next = usage.reviewQuestionCount + delta;
      if (usage.reviewQuestionCount >= FREE_LIMITS.dailyReviewQuestions) {
        return {
          success: false,
          code: "daily_review_limit",
          message: "Günlük tekrar limiti doldu.",
        };
      }
      if (next > FREE_LIMITS.dailyReviewQuestions) {
        return {
          success: false,
          code: "daily_review_limit",
          message: "Günlük tekrar limiti doldu.",
        };
      }
      usage.reviewQuestionCount = next;
    }

    transaction.set(
      usageRef,
      {
        ...usage,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, usage };
  });
  }
);
