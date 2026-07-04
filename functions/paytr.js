/**
 * PayTR iFrame API entegrasyonu — token üretimi + ödeme bildirimi (callback).
 *
 * Akış:
 *  1) İstemci `createPaytrToken` (onCall) çağırır → sunucu `premiumPurchaseIntents`
 *     içine bir kayıt (merchant_oid = doc id) açar, PayTR get-token API'sine gider
 *     ve iframe token'ı döner.
 *  2) Kullanıcı iframe içinde kartıyla öder.
 *  3) PayTR sunucudan sunucuya `paytrCallback` (onRequest) adresine bildirim atar.
 *     Hash doğrulanır, başarılıysa kullanıcıya otomatik Plus tanımlanır.
 *
 * Güvenlik notları:
 *  - merchant_key ve merchant_salt yalnızca Secret Manager'da tutulur (defineSecret).
 *  - Ödeme tutarı ASLA istemciden alınmaz; sunucudaki PAYTR_PLANS tablosundan gelir.
 *  - Aktivasyon idempotenttir: aynı bildirim iki kez gelirse çift tanımlama olmaz.
 */
const crypto = require("crypto");
const { defineSecret } = require("firebase-functions/params");
const { HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { sendMetaCapiPurchase } = require("./metaCapi");

const PAYTR_MERCHANT_KEY = defineSecret("PAYTR_MERCHANT_KEY");
const PAYTR_MERCHANT_SALT = defineSecret("PAYTR_MERCHANT_SALT");
/** Meta CAPI erişim token'ı — opsiyonel. Yoksa CAPI sessizce atlanır. */
const META_CAPI_TOKEN = defineSecret("META_CAPI_TOKEN");

/** Mağaza No (merchant_id) gizli değil; env ile override edilebilir. */
const MERCHANT_ID = process.env.PAYTR_MERCHANT_ID || "699560";

/** 1 = PayTR test modu (gerçek çekim yok). Canlıda "0" olmalı. */
const TEST_MODE = process.env.PAYTR_TEST_MODE === "1" ? "1" : "0";

const PAYTR_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";

/**
 * Sunucu tarafı plan tablosu — tek fiyat/süre otoritesi.
 * src/config/plusPlans.js ile birebir tutulmalı.
 */
const PAYTR_PLANS = {
  plus_1m: {
    days: 30,
    amount: 89.9,
    label: "1 Aylık Plus",
    sku: "TUSOSKOP_PLUS_1M",
  },
  plus_3m: {
    days: 90,
    amount: 209.7,
    label: "3 Aylık Plus",
    sku: "TUSOSKOP_PLUS_3M",
  },
  plus_6m: {
    days: 180,
    amount: 359.4,
    label: "6 Aylık Plus",
    sku: "TUSOSKOP_PLUS_6M",
  },
};

const db = () => getFirestore();

/** premiumUntil değerini Date'e çevirir (Firestore Timestamp veya ISO string). */
function premiumUntilToDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") {
    const d = value.toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function base64Hmac(input, key) {
  return crypto.createHmac("sha256", key).update(input).digest("base64");
}

function sanitizeBasket(label) {
  return String(label || "Tusoskop Plus").replace(/[^\w\sğüşöçıİĞÜŞÖÇ.-]/gi, "");
}

/**
 * createPaytrToken (onCall) handler.
 * data: { planId, userName?, userPhone?, userAddress? }
 * return: { token, merchantOid, amountLabel }
 */
async function createPaytrTokenHandler(request) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Giriş gerekli.");
  }

  const uid = request.auth.uid;
  const email =
    request.auth.token?.email ||
    String(request.data?.email || "").trim() ||
    "no-email@tusoskop.com";

  const planId = String(request.data?.planId || "");
  const plan = PAYTR_PLANS[planId];
  if (!plan) {
    throw new HttpsError("invalid-argument", "Geçersiz plan.");
  }

  const merchantKey = PAYTR_MERCHANT_KEY.value();
  const merchantSalt = PAYTR_MERCHANT_SALT.value();
  if (!merchantKey || !merchantSalt) {
    throw new HttpsError("failed-precondition", "Ödeme altyapısı yapılandırılmamış.");
  }

  // İstemci IP'si (PayTR token hash'inin parçası)
  const rawReq = request.rawRequest;
  const userIp =
    (rawReq?.headers?.["x-forwarded-for"]?.split(",")[0] || "").trim() ||
    rawReq?.ip ||
    rawReq?.socket?.remoteAddress ||
    "127.0.0.1";

  // merchant_oid: alfanümerik ve benzersiz olmalı → Firestore otomatik doc id
  const intentRef = db().collection("premiumPurchaseIntents").doc();
  const merchantOid = intentRef.id;

  const paymentAmount = Math.round(Number(plan.amount) * 100); // kuruş
  const noInstallment = "0";
  const maxInstallment = "0";
  const currency = "TL";

  const userBasket = Buffer.from(
    JSON.stringify([[sanitizeBasket(plan.label), String(plan.amount), 1]])
  ).toString("base64");

  // PayTR token hash string sırası kritiktir.
  const hashStr =
    MERCHANT_ID +
    userIp +
    merchantOid +
    email +
    paymentAmount +
    userBasket +
    noInstallment +
    maxInstallment +
    currency +
    TEST_MODE;
  const paytrToken = base64Hmac(hashStr + merchantSalt, merchantKey);

  const okUrl = "https://tusoskop.com/odeme-basarili";
  const failUrl = "https://tusoskop.com/odeme-basarisiz";

  const params = new URLSearchParams({
    merchant_id: MERCHANT_ID,
    user_ip: userIp,
    merchant_oid: merchantOid,
    email,
    payment_amount: String(paymentAmount),
    paytr_token: paytrToken,
    user_basket: userBasket,
    debug_on: TEST_MODE === "1" ? "1" : "0",
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: String(request.data?.userName || "Tusoskop Kullanicisi").slice(0, 60),
    user_address: String(request.data?.userAddress || "Tusoskop").slice(0, 200),
    user_phone: String(request.data?.userPhone || "05000000000").slice(0, 20),
    merchant_ok_url: okUrl,
    merchant_fail_url: failUrl,
    timeout_limit: "30",
    currency,
    test_mode: TEST_MODE,
  });

  // Ödeme niyeti kaydı (Admin SDK — kurallardan bağımsız).
  await intentRef.set({
    uid,
    email,
    planId,
    planLabel: plan.label,
    planSku: plan.sku,
    durationDays: plan.days,
    totalPrice: plan.amount,
    totalPriceLabel: `${plan.amount.toFixed(2).replace(".", ",")} TL`,
    currency: "TRY",
    provider: "paytr",
    status: "started",
    merchantOid,
    paymentAmount,
    testMode: TEST_MODE === "1",
    createdAt: new Date().toISOString(),
    createdAtTs: FieldValue.serverTimestamp(),
  });

  let resp;
  try {
    resp = await fetch(PAYTR_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
  } catch (err) {
    console.error("[PAYTR] get-token network error:", err);
    await intentRef.update({ status: "token_error", error: "network" });
    throw new HttpsError("unavailable", "Ödeme sağlayıcısına ulaşılamadı.");
  }

  const json = await resp.json().catch(() => null);
  if (!json || json.status !== "success" || !json.token) {
    const reason = json?.reason || "bilinmeyen hata";
    console.error("[PAYTR] get-token failed:", reason);
    await intentRef.update({ status: "token_error", error: reason });
    throw new HttpsError("internal", `Ödeme başlatılamadı: ${reason}`);
  }

  return {
    token: json.token,
    merchantOid,
    amountLabel: `${plan.amount.toFixed(2).replace(".", ",")} TL`,
  };
}

/**
 * paytrCallback (onRequest) handler — PayTR sunucudan sunucuya bildirim.
 * Başarılı ödemede kullanıcıya otomatik Plus tanımlar. Yanıt düz metin "OK" olmalı.
 */
async function paytrCallbackHandler(req, res) {
  const merchantKey = PAYTR_MERCHANT_KEY.value();
  const merchantSalt = PAYTR_MERCHANT_SALT.value();

  const body = req.body || {};
  const merchantOid = String(body.merchant_oid || "");
  const status = String(body.status || "");
  const totalAmount = String(body.total_amount || "");
  const postHash = String(body.hash || "");

  if (!merchantOid || !postHash) {
    res.status(400).send("PAYTR notification failed: missing fields");
    return;
  }

  // Hash doğrulama
  const expected = base64Hmac(
    merchantOid + merchantSalt + status + totalAmount,
    merchantKey
  );
  if (expected !== postHash) {
    console.error("[PAYTR] callback bad hash for", merchantOid);
    res.status(400).send("PAYTR notification failed: bad hash");
    return;
  }

  const intentRef = db().collection("premiumPurchaseIntents").doc(merchantOid);

  let txResult = { activated: false };
  try {
    txResult = await db().runTransaction(async (tx) => {
      const snap = await tx.get(intentRef);
      if (!snap.exists) {
        // Kayıt yoksa loglayıp OK dönebiliriz (PayTR retry'ı durur).
        console.warn("[PAYTR] callback intent not found:", merchantOid);
        return { activated: false };
      }
      const intent = snap.data() || {};

      // Idempotency: zaten işlenmişse tekrar tanımlama.
      if (intent.status === "paid_activated" || intent.status === "failed") {
        return { activated: false };
      }

      if (status !== "success") {
        tx.update(intentRef, {
          status: "failed",
          failedReason: String(body.failed_reason_msg || body.failed_reason_code || ""),
          paymentNotifiedAt: new Date().toISOString(),
        });
        return { activated: false };
      }

      const planId = intent.planId;
      const plan = PAYTR_PLANS[planId];
      const days = plan?.days || intent.durationDays;
      const targetUid = intent.uid;

      if (!targetUid || !days) {
        tx.update(intentRef, {
          status: "needs_review",
          paymentNotifiedAt: new Date().toISOString(),
        });
        return { activated: false };
      }

      const nowIso = new Date().toISOString();
      const userRef = db().doc(`users/${targetUid}`);
      const userSnap = await tx.get(userRef);
      const prev = userSnap.exists ? userSnap.data() : {};

      // Mevcut aktif Plus bitiş tarihini koru; üzerine ekle (süreyi silme).
      const existingUntil = premiumUntilToDate(prev.premiumUntil);
      const baseMs = (existingUntil && existingUntil > new Date())
        ? existingUntil.getTime()
        : Date.now();
      const until = new Date(baseMs + Number(days) * 86400000).toISOString();

      tx.set(
        userRef,
        {
          uid: targetUid,
          plan: "plus",
          premiumStatus: "active",
          premiumSource: "paytr",
          premiumUntil: until,
          lifetimePremium: false,
          grantedBy: "paytr_auto",
          grantedAt: nowIso,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.update(intentRef, {
        status: "paid_activated",
        paidAmount: totalAmount,
        activatedForUid: targetUid,
        activatedAt: nowIso,
        paymentNotifiedAt: nowIso,
      });

      const logRef = db().collection("adminLogs").doc();
      tx.set(logRef, {
        adminUid: "paytr_auto",
        adminEmail: null,
        targetUid,
        action: `grant_${days}d`,
        previousPlanData: {
          plan: prev.plan ?? "free",
          premiumStatus: prev.premiumStatus ?? "inactive",
          premiumUntil: prev.premiumUntil ?? null,
          lifetimePremium: prev.lifetimePremium ?? false,
        },
        nextPlanData: {
          plan: "plus",
          premiumStatus: "active",
          premiumUntil: until,
          lifetimePremium: false,
        },
        reason: `PayTR otomatik / ${plan?.sku || planId} / oid:${merchantOid}`,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Bu callback gerçekten aktivasyonu yaptı → CAPI için sinyal (dedup: merchantOid).
      return {
        activated: true,
        value: Number(intent.totalPrice) || Number(plan?.amount) || 0,
        email: intent.email || null,
      };
    });
  } catch (err) {
    console.error("[PAYTR] callback processing error:", err);
    // İşlenemedi → OK dönme ki PayTR tekrar denesin.
    res.status(500).send("PAYTR notification failed: processing error");
    return;
  }

  // Sunucu taraflı Meta Purchase — yalnızca bu çağrı aktivasyonu yaptıysa (dedup).
  // Fail-safe: token yoksa veya hata olursa sessizce geçer, OK yanıtını engellemez.
  if (txResult?.activated) {
    await sendMetaCapiPurchase({
      accessToken: META_CAPI_TOKEN.value(),
      eventId: merchantOid,
      value: txResult.value,
      currency: "TRY",
      email: txResult.email,
    });
  }

  res.status(200).send("OK");
}

module.exports = {
  PAYTR_MERCHANT_KEY,
  PAYTR_MERCHANT_SALT,
  META_CAPI_TOKEN,
  PAYTR_PLANS,
  createPaytrTokenHandler,
  paytrCallbackHandler,
};
