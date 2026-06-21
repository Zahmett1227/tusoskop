const crypto = require("node:crypto");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { HttpsError } = require("firebase-functions/v2/https");

const ALLOWED_BUNDLE_ID = "com.tusoskop.app";
const ALLOWED_PRODUCT_IDS = new Set([
  "com.tusoskop.app.plus.1m",
  "com.tusoskop.app.plus.3m",
  "com.tusoskop.app.plus.1y",
]);

// Ürün → admin panelinde gösterilecek plan bilgisi
const PRODUCT_INFO = {
  "com.tusoskop.app.plus.1m": { planId: "plus_1m", planLabel: "1 Aylık Plus", durationDays: 30 },
  "com.tusoskop.app.plus.3m": { planId: "plus_3m", planLabel: "3 Aylık Plus", durationDays: 90 },
  "com.tusoskop.app.plus.1y": { planId: "plus_1y", planLabel: "1 Yıllık Plus", durationDays: 365 },
};

function parseJws(jws) {
  const parts = jws.split(".");
  if (parts.length !== 3) throw new Error("Geçersiz JWS formatı.");
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  return { header, payload, parts };
}

function base64ToPem(b64) {
  const body = b64.replace(/(.{64})/g, "$1\n").replace(/\n$/, "");
  return `-----BEGIN CERTIFICATE-----\n${body}\n-----END CERTIFICATE-----`;
}

function verifyCertificateChain(x5c) {
  if (!Array.isArray(x5c) || x5c.length < 2) {
    throw new Error("Geçersiz sertifika zinciri.");
  }

  const certs = x5c.map((b64) => new crypto.X509Certificate(base64ToPem(b64)));

  for (let i = 0; i < certs.length - 1; i++) {
    if (!certs[i].verify(certs[i + 1].publicKey)) {
      throw new Error(`Sertifika zinciri doğrulaması başarısız: indeks ${i}`);
    }
  }

  const root = certs[certs.length - 1];
  const rootSubject = root.subject || "";
  if (!rootSubject.includes("Apple") || !rootSubject.includes("Root CA")) {
    throw new Error("Sertifika zinciri Apple Root CA ile imzalanmamış.");
  }

  return certs[0].publicKey;
}

function verifyJwsSignature(parts, publicKey) {
  const signatureInput = `${parts[0]}.${parts[1]}`;
  // JWS ES256 imzası IEEE P1363 (raw R||S) formatında gelir.
  // Node.js crypto varsayılan olarak DER bekler; dsaEncoding ile doğru format belirtilir.
  const signature = Buffer.from(parts[2], "base64url");
  const verify = crypto.createVerify("SHA256");
  verify.update(signatureInput, "utf8");
  const valid = verify.verify({ key: publicKey, dsaEncoding: "ieee-p1363" }, signature);
  if (!valid) throw new Error("JWS imzası geçersiz.");
}

function verifyJwsTransaction(jwsRepresentation) {
  const { header, payload, parts } = parseJws(jwsRepresentation);

  if (header.alg !== "ES256") {
    throw new Error(`Beklenmeyen algoritma: ${header.alg}`);
  }

  const publicKey = verifyCertificateChain(header.x5c);
  verifyJwsSignature(parts, publicKey);

  return payload;
}

async function verifyApplePurchaseHandler(request) {
  try {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Giriş gerekli.");
    }

    const uid = request.auth.uid;
    const jwsRepresentation = String(request.data?.jwsRepresentation || "").trim();

    if (!jwsRepresentation) {
      throw new HttpsError("invalid-argument", "jwsRepresentation gerekli.");
    }

    let payload;
    try {
      payload = verifyJwsTransaction(jwsRepresentation);
    } catch (err) {
      console.error("[verifyApplePurchase] JWS doğrulama hatası:", err?.message);
      throw new HttpsError("invalid-argument", `JWS doğrulama başarısız: ${err?.message}`);
    }

    const {
      bundleId,
      productId,
      expiresDate,
      type,
      originalTransactionId,
      transactionId,
    } = payload;

    console.log("[verifyApplePurchase] Payload:", { bundleId, productId, type, expiresDate });

    if (bundleId !== ALLOWED_BUNDLE_ID) {
      throw new HttpsError("invalid-argument", `Geçersiz bundle ID: ${bundleId}`);
    }

    if (type !== "Auto-Renewable Subscription") {
      throw new HttpsError("invalid-argument", `Geçersiz abonelik tipi: ${type}`);
    }

    if (!ALLOWED_PRODUCT_IDS.has(productId)) {
      throw new HttpsError("invalid-argument", `İzin verilmeyen ürün ID: ${productId}`);
    }

    const expDate = new Date(expiresDate);
    if (Number.isNaN(expDate.getTime())) {
      throw new HttpsError("invalid-argument", `Geçersiz son kullanma tarihi: ${expiresDate}`);
    }

    const now = new Date();
    if (expDate <= now) {
      throw new HttpsError("failed-precondition", `Abonelik süresi dolmuş: ${expDate.toISOString()}`);
    }

    const db = getFirestore();

    // Kullanıcının e-postasını auth'tan al (admin panelde kimliklendirme için).
    let userEmail = null;
    let userDisplayName = null;
    try {
      const authUser = await getAuth().getUser(uid);
      userEmail = authUser.email || null;
      userDisplayName = authUser.displayName || null;
    } catch (e) {
      console.warn("[verifyApplePurchase] auth.getUser başarısız:", e?.message);
    }

    const userPatch = {
      plan: "plus",
      premiumStatus: "active",
      premiumSource: "apple",
      premiumUntil: Timestamp.fromDate(expDate),
      iapSource: "apple",
      iapProductId: productId,
      iapOriginalTransactionId: String(originalTransactionId || transactionId || ""),
      iapLastUpdated: FieldValue.serverTimestamp(),
    };
    if (userEmail) userPatch.email = userEmail;
    if (userDisplayName) userPatch.displayName = userDisplayName;

    await db.collection("users").doc(uid).set(userPatch, { merge: true });

    // Admin panelinde görünmesi için ödeme kaydı yaz (best-effort — akışı bozmaz).
    try {
      const info = PRODUCT_INFO[productId] || { planId: productId, planLabel: productId, durationDays: null };
      await db.collection("premiumPurchaseIntents").add({
        uid,
        email: userEmail,
        displayName: userDisplayName,
        planId: info.planId,
        planLabel: info.planLabel,
        planSku: productId,
        durationDays: info.durationDays,
        totalPriceLabel: "App Store (IAP)",
        currency: "TRY",
        provider: "apple",
        status: "apple_activated",
        iapProductId: productId,
        iapTransactionId: String(transactionId || ""),
        iapOriginalTransactionId: String(originalTransactionId || transactionId || ""),
        premiumUntil: expDate.toISOString(),
        shopifyOrderName: null,
        createdAt: new Date().toISOString(),
        activatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[verifyApplePurchase] premiumPurchaseIntents kaydı başarısız:", e?.message);
    }

    console.log(`[verifyApplePurchase] OK uid=${uid} productId=${productId} premiumUntil=${expDate.toISOString()}`);

    return { success: true, premiumUntil: expDate.toISOString() };
  } catch (err) {
    // HttpsError ise olduğu gibi fırlat (zaten formatlı)
    if (err instanceof HttpsError) throw err;
    // Ham JS hatalarını Firebase maskelemeden önce logla ve sararak fırlat
    console.error("[verifyApplePurchase] Beklenmeyen hata:", err?.message, err?.stack);
    throw new HttpsError("internal", err?.message || "Bilinmeyen hata");
  }
}

module.exports = { verifyApplePurchaseHandler };
