const crypto = require("node:crypto");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { HttpsError } = require("firebase-functions/v2/https");

const ALLOWED_BUNDLE_ID = "com.tusoskop.app";
const ALLOWED_PRODUCT_IDS = new Set([
  "com.tusoskop.app.plus.1m",
  "com.tusoskop.app.plus.3m",
  "com.tusoskop.app.plus.6m",
]);

/**
 * JWS token'ının 3 bölümünü ayrıştırır ve header + payload'u döner.
 */
function parseJws(jws) {
  const parts = jws.split(".");
  if (parts.length !== 3) throw new Error("Geçersiz JWS formatı.");
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  return { header, payload, parts };
}

/**
 * PEM sertifikasını base64 string'den oluşturur.
 */
function base64ToPem(b64) {
  const body = b64.replace(/(.{64})/g, "$1\n").replace(/\n$/, "");
  return `-----BEGIN CERTIFICATE-----\n${body}\n-----END CERTIFICATE-----`;
}

/**
 * x5c certificate chain'i doğrular:
 * - Her sertifika bir öncekini imzalamalı
 * - Root sertifikasında "Apple" ve "Root CA" ifadeleri aranır
 */
function verifyCertificateChain(x5c) {
  if (!Array.isArray(x5c) || x5c.length < 2) {
    throw new Error("Geçersiz sertifika zinciri.");
  }

  const certs = x5c.map((b64) => new crypto.X509Certificate(base64ToPem(b64)));

  // Her sertifikayı bir önceki tarafından doğrula
  for (let i = 0; i < certs.length - 1; i++) {
    const subject = certs[i];
    const issuer = certs[i + 1];
    if (!subject.verify(issuer.publicKey)) {
      throw new Error(`Sertifika zinciri doğrulaması başarısız: indeks ${i}`);
    }
  }

  // Root sertifikasında Apple kontrolü
  const root = certs[certs.length - 1];
  const rootSubject = root.subject || "";
  if (!rootSubject.includes("Apple") || !rootSubject.includes("Root CA")) {
    throw new Error("Sertifika zinciri Apple Root CA ile imzalanmamış.");
  }

  // Leaf (ilk) sertifikanın public key'ini döndür
  return certs[0].publicKey;
}

/**
 * JWS imzasını ES256 (ECDSA P-256) ile doğrular.
 */
function verifyJwsSignature(parts, publicKey) {
  const signatureInput = `${parts[0]}.${parts[1]}`;
  const signature = Buffer.from(parts[2], "base64url");

  const verify = crypto.createVerify("SHA256");
  verify.update(signatureInput, "utf8");
  const valid = verify.verify(publicKey, signature);
  if (!valid) throw new Error("JWS imzası geçersiz.");
}

/**
 * StoreKit 2 JWS transaction token'ını doğrular.
 * @param {string} jwsRepresentation - StoreKit 2'den alınan JWS token
 * @returns {{ bundleId, productId, expirationDate, type, originalTransactionId, transactionId }} Doğrulanmış payload
 */
function verifyJwsTransaction(jwsRepresentation) {
  const { header, payload, parts } = parseJws(jwsRepresentation);

  if (header.alg !== "ES256") {
    throw new Error(`Beklenmeyen algoritma: ${header.alg}`);
  }

  const publicKey = verifyCertificateChain(header.x5c);
  verifyJwsSignature(parts, publicKey);

  return payload;
}

/**
 * verifyApplePurchase Firebase Function handler'ı.
 * onCall wrapper'ı index.js'de yapılır.
 */
async function verifyApplePurchaseHandler(request) {
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

  // Güvenlik kontrolleri
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
    throw new HttpsError("invalid-argument", "Geçersiz son kullanma tarihi.");
  }

  const now = new Date();
  if (expDate <= now) {
    throw new HttpsError("failed-precondition", "Abonelik süresi dolmuş.");
  }

  const db = getFirestore();
  await db.collection("users").doc(uid).set(
    {
      plan: "plus",
      premiumStatus: "active",
      premiumUntil: Timestamp.fromDate(expDate),
      iapSource: "apple",
      iapProductId: productId,
      iapOriginalTransactionId: String(originalTransactionId || transactionId || ""),
      iapLastUpdated: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`[verifyApplePurchase] uid=${uid} productId=${productId} premiumUntil=${expDate.toISOString()}`);

  return { success: true, premiumUntil: expDate.toISOString() };
}

module.exports = { verifyApplePurchaseHandler };
