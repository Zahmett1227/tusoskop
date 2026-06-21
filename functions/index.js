const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { FREE_LIMITS } = require("./constants");
const { tryPublishSocialContentHandler } = require("./socialPublisher");
const { buildUserStudySummary } = require("./services/buildUserStudySummary");
const { generateAiStudyPlan } = require("./services/generateAiStudyPlan");
const { buildFallbackDailyStudyPlan } = require("./services/buildFallbackDailyStudyPlan");
const {
  PAYTR_MERCHANT_KEY,
  PAYTR_MERCHANT_SALT,
  createPaytrTokenHandler,
  paytrCallbackHandler,
} = require("./paytr");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

/** Callable preflight + browser clients (match Hosting / Vite dev ports). */
const allowedOrigins = [
  "https://tusoskop.com",
  "https://www.tusoskop.com",
  "http://localhost:5173",
  "http://localhost:5174",
];

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
    invoker: "public",
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

/**
 * Admin: onaylı sosyal medya içeriğini resmi Instagram Graph API ile paylaşmayı dener.
 * API yoksa export modu önerir. Private API / bot etkileşimi kullanılmaz.
 */
exports.tryPublishSocialContent = onCall(
  {
    region: "us-central1",
    cors: allowedOrigins,
  },
  tryPublishSocialContentHandler
);

/**
 * PayTR iFrame ödeme token'ı üretir. Kimlik doğrulamalı kullanıcı çağırır.
 * Tutar/süre sunucudaki PAYTR_PLANS tablosundan gelir; istemci yalnızca planId yollar.
 */
exports.createPaytrToken = onCall(
  {
    region: "us-central1",
    cors: allowedOrigins,
    secrets: [PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT],
  },
  createPaytrTokenHandler
);

/**
 * PayTR sunucudan sunucuya ödeme bildirimi (notification URL).
 * Başarılı ödemede kullanıcıya otomatik Plus tanımlar. Yanıt düz metin "OK".
 * PayTR panelinde bildirim URL'i olarak bu fonksiyonun adresi tanımlanmalıdır.
 */
exports.paytrCallback = onRequest(
  {
    region: "us-central1",
    secrets: [PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT],
  },
  paytrCallbackHandler
);

/**
 * Generates (or returns cached) an AI-powered daily study plan for the authenticated user.
 * Uses Google Gemini via server-side API key; uid is taken from auth context only.
 * Caches result at users/{uid}/aiRecommendations/{yyyy-MM-dd}.
 */
exports.generateDailyStudyPlan = onCall(
  {
    region: "us-central1",
    cors: allowedOrigins,
    secrets: [GEMINI_API_KEY],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Giriş gerekli.");
    }

    const uid = request.auth.uid;

    // Sadece premium kullanıcılar AI planı alabilir
    const userSnap = await db.doc(`users/${uid}`).get();
    const userData = userSnap.exists ? userSnap.data() : {};
    if (!isPremiumServer(userData)) {
      throw new HttpsError(
        "permission-denied",
        "Bu özellik premium kullanıcılara özeldir."
      );
    }

    const today = todayKey();
    const cacheRef = db.doc(`users/${uid}/aiRecommendations/${today}`);

    // Return cached plan if exists
    const cached = await cacheRef.get();
    if (cached.exists) {
      const data = cached.data();
      return { cached: true, date: today, ...data };
    }

    let studySummary;
    try {
      studySummary = await buildUserStudySummary(uid, db);
    } catch (err) {
      console.error("[AI_PLAN] buildUserStudySummary error:", err);
      throw new HttpsError("internal", "Çalışma özeti oluşturulamadı.");
    }

    let recommendation;
    let model = null;
    let status = "success";

    try {
      const apiKey = GEMINI_API_KEY.value();
      if (!apiKey) throw new Error("GEMINI_API_KEY secret tanımlı değil.");
      const result = await generateAiStudyPlan(studySummary, apiKey);
      recommendation = result.recommendation;
      model = result.model;
    } catch (err) {
      console.error("[AI_PLAN] generateAiStudyPlan error:", err.message);
      recommendation = buildFallbackDailyStudyPlan(studySummary);
      status = "fallback";
    }

    const docData = {
      date: today,
      inputSummary: studySummary,
      recommendation,
      model,
      status,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    try {
      await cacheRef.set(docData);
    } catch (err) {
      console.error("[AI_PLAN] Firestore cache write error:", err);
    }

    return { cached: false, date: today, ...docData };
  }
);
