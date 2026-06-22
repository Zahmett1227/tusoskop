const admin = require("firebase-admin");
const crypto = require("node:crypto");

if (!admin.apps.length) {
  admin.initializeApp();
}

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { FREE_LIMITS } = require("./constants");
const { tryPublishSocialContentHandler } = require("./socialPublisher");
const {
  exchangeAuthCodeForRefreshToken,
  revokeToken,
} = require("./appleAuth");
const { buildUserStudySummary } = require("./services/buildUserStudySummary");
const { generateAiStudyPlan } = require("./services/generateAiStudyPlan");
const { buildFallbackDailyStudyPlan } = require("./services/buildFallbackDailyStudyPlan");
const { verifyApplePurchaseHandler, APPLE_ROOT_CA_G3 } = require("./verifyApplePurchase");

// Apple Sign in private key (.p8 içeriği). `firebase functions:secrets:set` ile tanımlanır.
const APPLE_SIGNIN_PRIVATE_KEY = defineSecret("APPLE_SIGNIN_PRIVATE_KEY");
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

/** Callable preflight + browser clients (match Hosting / Vite dev ports). */
const allowedOrigins = [
  "https://tusoskop.com",
  "https://www.tusoskop.com",
  "https://localhost",
  "capacitor://localhost",
  "ionic://localhost",
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

function hashUid(uid) {
  return crypto.createHash("sha256").update(String(uid)).digest("hex");
}

async function recursiveDeleteDoc(path) {
  const ref = db.doc(path);
  if (typeof db.recursiveDelete === "function") {
    await db.recursiveDelete(ref);
    return;
  }
  await ref.delete();
}

async function deleteQueryResults(query, maxPasses = 20) {
  for (let pass = 0; pass < maxPasses; pass += 1) {
    const snap = await query.limit(450).get();
    if (snap.empty) return;

    const batch = db.batch();
    snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();
  }
  throw new HttpsError("resource-exhausted", "Silinecek veri miktarı tek işlem sınırını aştı.");
}

async function anonymizePurchaseIntents(uid, uidHash) {
  for (let pass = 0; pass < 20; pass += 1) {
    const snap = await db
      .collection("premiumPurchaseIntents")
      .where("uid", "==", uid)
      .limit(450)
      .get();

    if (snap.empty) return;

    const batch = db.batch();
    snap.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        uid: null,
        email: null,
        deletedAccount: true,
        deletedUserHash: uidHash,
        deletedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }
  throw new HttpsError("resource-exhausted", "Anonimleştirilecek ödeme kaydı miktarı tek işlem sınırını aştı.");
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
 * Apple ile giriş sonrası refresh token'ı (authorization_code'dan takas ederek)
 * sunucu tarafında saklar. Hesap silmede Apple token revoke için gereklidir
 * (App Store Guideline 5.1.1(v)). `appleTokens/{uid}` istemciye kapalıdır.
 */
exports.registerAppleRefreshToken = onCall(
  {
    region: "us-central1",
    cors: allowedOrigins,
    secrets: [APPLE_SIGNIN_PRIVATE_KEY],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Giriş gerekli.");
    }
    const uid = request.auth.uid;
    const authorizationCode = String(request.data?.authorizationCode || "").trim();
    if (!authorizationCode) {
      throw new HttpsError("invalid-argument", "authorizationCode gerekli.");
    }

    try {
      const refreshToken = await exchangeAuthCodeForRefreshToken(
        authorizationCode,
        APPLE_SIGNIN_PRIVATE_KEY.value()
      );
      await db.doc(`appleTokens/${uid}`).set(
        { refreshToken, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      return { success: true };
    } catch (error) {
      // Girişi bozmamak için hata fırlatma; revoke yine de best-effort kalır.
      console.error("registerAppleRefreshToken hatası:", error?.message || error);
      return { success: false };
    }
  }
);

exports.deleteAccountAndData = onCall(
  {
    region: "us-central1",
    cors: allowedOrigins,
    secrets: [APPLE_SIGNIN_PRIVATE_KEY],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Giriş gerekli.");
    }

    const uid = request.auth.uid;
    const uidHash = hashUid(uid);

    try {
      // Apple Sign in token'ını iptal et (best-effort; silmeyi bloklamaz).
      try {
        const appleSnap = await db.doc(`appleTokens/${uid}`).get();
        const refreshToken = appleSnap.exists ? appleSnap.data()?.refreshToken : null;
        if (refreshToken) {
          await revokeToken(refreshToken, APPLE_SIGNIN_PRIVATE_KEY.value());
        }
      } catch (revokeError) {
        console.error("Apple token revoke atlandı:", revokeError?.message || revokeError);
      }

      await anonymizePurchaseIntents(uid, uidHash);

      await Promise.all([
        recursiveDeleteDoc(`users/${uid}`),
        recursiveDeleteDoc(`studyCollections/${uid}`),
        recursiveDeleteDoc(`examResults/${uid}`),
        recursiveDeleteDoc(`streaks/${uid}`),
        recursiveDeleteDoc(`appleTokens/${uid}`),
        deleteQueryResults(db.collection("results").where("userId", "==", uid)),
        deleteQueryResults(db.collection("studySessions").where("userId", "==", uid)),
        // IAP abonelik bağını sil → kullanıcı yeni hesapla aynı aboneliği restore edebilsin.
        deleteQueryResults(db.collection("appleSubscriptions").where("uid", "==", uid)),
      ]);

      try {
        await admin.auth().deleteUser(uid);
      } catch (error) {
        if (error?.code !== "auth/user-not-found") {
          throw error;
        }
      }

      return { success: true };
    } catch (error) {
      // HttpsError'ları olduğu gibi geçir; ham hataları maskelemeden ilet.
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error("deleteAccountAndData hatası:", error);
      throw new HttpsError(
        "internal",
        `Hesap silme başarısız: ${error?.code || ""} ${error?.message || error}`.trim()
      );
    }
  }
);

/**
 * Apple IAP: StoreKit 2 JWS transaction token'ını doğrular, Firestore'da premium aktif eder.
 * iOS App Store abonelik satın almalarında çağrılır.
 */
exports.verifyApplePurchase = onCall(
  { region: "us-central1", cors: allowedOrigins, invoker: "public", secrets: [APPLE_ROOT_CA_G3] },
  verifyApplePurchaseHandler
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
      console.error("[AI_PLAN] buildUserStudySummary error:", err?.message ?? err);
      studySummary = {
        userLevel: "TUS hazırlık",
        availableTimeMinutes: 90,
        recentPerformance: { last7DaysSolved: 0, last7DaysCorrectRate: 0, last7DaysWrongCount: 0, activeDaysLast7: 0 },
        fsrsStats: { dueToday: 0, overdue: 0, addedLast7Days: 0, reviewedLast7Days: 0, lapseRate: 0 },
        topicMastery: [],
        weakTopics: [],
      };
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
