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

// Apple Root CA - G3 (public cert, base64 DER)
// Source: https://www.apple.com/certificateauthority/AppleRootCA-G3.cer
// SHA-256: 63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79
// prettier-ignore
const APPLE_ROOT_CA_G3_B64 = "MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwSQXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcNMTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBSb290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtfTjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySrMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gAMGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM6BgD56KyKA==";

const APPLE_ROOT_CA_G3_SHA256 =
  "63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79";

// Ürün → admin panelinde gösterilecek plan bilgisi
const PRODUCT_INFO = {
  "com.tusoskop.app.plus.1m": { planId: "plus_1m", planLabel: "1 Aylık Plus", durationDays: 30 },
  "com.tusoskop.app.plus.3m": { planId: "plus_3m", planLabel: "3 Aylık Plus", durationDays: 90 },
  "com.tusoskop.app.plus.1y": { planId: "plus_1y", planLabel: "1 Yıllık Plus", durationDays: 365 },
};

function parseJws(jws) {
  const parts = String(jws || "").split(".");
  if (parts.length !== 3) throw new Error("Geçersiz JWS formatı.");
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  return { header, payload, parts };
}

function base64ToPem(b64) {
  const body = String(b64).replace(/\s+/g, "").replace(/(.{64})/g, "$1\n").replace(/\n$/, "");
  return `-----BEGIN CERTIFICATE-----\n${body}\n-----END CERTIFICATE-----`;
}

/**
 * PEM veya base64 DER stringinden X509Certificate üretir.
 * Birim testlerde sahte kökü enjekte etmek için kullanılır.
 */
function loadPinnedRootCert(rawValue) {
  const val = String(rawValue || "").trim();
  if (!val) throw new Error("Sertifika değeri boş veya tanımlı değil.");
  const pem = val.includes("BEGIN CERTIFICATE") ? val : base64ToPem(val);
  return new crypto.X509Certificate(pem);
}

let _pinnedRootCache = null;
function getPinnedRootCert() {
  if (!_pinnedRootCache) {
    const cert = new crypto.X509Certificate(Buffer.from(APPLE_ROOT_CA_G3_B64, "base64"));
    const fp = cert.fingerprint256;
    if (fp.toUpperCase() !== APPLE_ROOT_CA_G3_SHA256.toUpperCase()) {
      throw new Error(
        `Apple Root CA G3 parmak izi eşleşmiyor. Beklenen: ${APPLE_ROOT_CA_G3_SHA256}, Gerçek: ${fp}`
      );
    }
    _pinnedRootCache = cert;
  }
  return _pinnedRootCache;
}

/** İki X509 sertifikasının DER baytları birebir aynı mı (sabit zamanlı). */
function certsEqual(a, b) {
  const da = a?.raw;
  const dbb = b?.raw;
  if (!Buffer.isBuffer(da) || !Buffer.isBuffer(dbb) || da.length !== dbb.length) {
    return false;
  }
  return crypto.timingSafeEqual(da, dbb);
}

function assertCertWithinValidity(cert, nowMs) {
  const notBefore = Date.parse(cert.validFrom);
  const notAfter = Date.parse(cert.validTo);
  if (Number.isFinite(notBefore) && nowMs < notBefore) {
    throw new Error("Sertifika henüz geçerli değil.");
  }
  if (Number.isFinite(notAfter) && nowMs > notAfter) {
    throw new Error("Sertifika süresi dolmuş.");
  }
}

/**
 * JWS `x5c` sertifika zincirini doğrular ve leaf public key'ini döner.
 *
 * Güven, `pinnedRoot` (koda gömülü Apple Root CA - G3) sertifikasına dayanır:
 *  1) Her sertifika geçerlilik tarihleri içinde olmalı.
 *  2) Zincir halka halka imzalı olmalı (certs[i] ↔ certs[i+1].publicKey).
 *  3) Zincirin tepesindeki kök, pin'lenmiş Apple köküyle BAYT BAYT aynı olmalı.
 *  4) Pin'lenmiş kök kendi kendini imzalamış (self-signed) olmalı.
 *
 * `pinnedRoot` dışarıdan parametre olarak alınır → birim testlerde secret'a
 * ihtiyaç olmadan doğrulanabilir.
 */
function verifyCertificateChain(x5c, pinnedRoot, nowMs = Date.now()) {
  if (!Array.isArray(x5c) || x5c.length < 2) {
    throw new Error("Geçersiz sertifika zinciri.");
  }
  if (!pinnedRoot) {
    throw new Error("Pin'lenmiş Apple kök sertifikası yapılandırılmamış.");
  }

  const certs = x5c.map((b64) => new crypto.X509Certificate(base64ToPem(b64)));

  for (const cert of certs) {
    assertCertWithinValidity(cert, nowMs);
  }

  for (let i = 0; i < certs.length - 1; i += 1) {
    if (!certs[i].verify(certs[i + 1].publicKey)) {
      throw new Error(`Sertifika zinciri doğrulaması başarısız: indeks ${i}`);
    }
  }

  const providedRoot = certs[certs.length - 1];
  if (!certsEqual(providedRoot, pinnedRoot)) {
    throw new Error("Sertifika zinciri pin'lenmiş Apple Root CA ile eşleşmiyor.");
  }
  if (!pinnedRoot.verify(pinnedRoot.publicKey)) {
    throw new Error("Pin'lenmiş kök sertifika kendi kendini imzalamamış.");
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

function verifyJwsTransaction(jwsRepresentation, pinnedRoot) {
  const { header, payload, parts } = parseJws(jwsRepresentation);

  if (header.alg !== "ES256") {
    throw new Error(`Beklenmeyen algoritma: ${header.alg}`);
  }

  const publicKey = verifyCertificateChain(header.x5c, pinnedRoot);
  verifyJwsSignature(parts, publicKey);

  return payload;
}

// Sunucu/Apple saatleri arasındaki küçük kaymalar için tolerans. Yalnızca
// "kıl payı dolmuş" gibi görünen geçerli abonelikleri kurtarır; gerçek (dakikalar
// önce dolmuş) aboneliklerde etkisizdir.
const CLOCK_SKEW_MS = 60 * 1000;

// İmza tazeliği penceresi. StoreKit, JWS'i satın alma/restore anında Apple'a
// yeniden imzalatır; dolayısıyla meşru bir istekte `signedDate` günceldir.
// Pencere bilinçli olarak cömert (24 saat) tutulur ki çevrimdışı kalıp sonradan
// restore eden gibi uç meşru durumlar reddedilmesin. Yine de günler önce
// kaydedilmiş bir token'ın (iade sonrası) doğrudan callable'a tekrar
// oynatılmasını engeller.
const SIGNED_DATE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Doğrulanmış JWS payload'ının iş kurallarını kontrol eder; geçerliyse
 * abonelik bitiş tarihini (Date) döner, değilse HttpsError fırlatır.
 * Saf fonksiyon — birim testlerde kullanılır.
 */
function validateTransactionPayload(payload, nowMs = Date.now()) {
  const { bundleId, productId, expiresDate, type, revocationDate, signedDate } = payload || {};

  if (bundleId !== ALLOWED_BUNDLE_ID) {
    throw new HttpsError("invalid-argument", `Geçersiz bundle ID: ${bundleId}`);
  }
  if (type !== "Auto-Renewable Subscription") {
    throw new HttpsError("invalid-argument", `Geçersiz abonelik tipi: ${type}`);
  }
  if (!ALLOWED_PRODUCT_IDS.has(productId)) {
    throw new HttpsError("invalid-argument", `İzin verilmeyen ürün ID: ${productId}`);
  }

  // İade/iptal edilmiş işlemler: StoreKit 2 payload'ı, Apple Support bir işlemi
  // iade ettiğinde veya Family Sharing'den çektiğinde `revocationDate` (ms) taşır.
  // Bu alan varsa abonelik geri alınmış demektir; expiresDate hâlâ gelecekte olsa
  // bile premium VERİLMEMELİDİR (aksi halde iadeli abonelik bitişe dek kullanılır).
  if (revocationDate != null) {
    const revMs = new Date(revocationDate).getTime();
    throw new HttpsError(
      "failed-precondition",
      `İşlem iptal/iade edilmiş: revocationDate=${
        Number.isNaN(revMs) ? String(revocationDate) : new Date(revMs).toISOString()
      }`
    );
  }

  // İmza tazeliği (tekrar oynatma savunması). İade edilen bir kullanıcı, iadeden
  // ÖNCE kaydettiği (revocationDate taşımayan) eski bir JWS'i doğrudan callable'a
  // yeniden gönderebilir. Böyle eski bir token'ın signedDate'i tazelik penceresi
  // dışında kalır ve reddedilir; Apple'ın yeniden imzaladığı güncel token ise
  // artık revocationDate taşıyacağından yukarıda zaten reddedilir. signedDate yoksa
  // (Apple her zaman ekler; savunmacı davranış) tazelik kontrolü atlanır.
  if (signedDate != null) {
    const signedMs = new Date(signedDate).getTime();
    if (!Number.isNaN(signedMs) && signedMs < nowMs - SIGNED_DATE_MAX_AGE_MS) {
      throw new HttpsError(
        "failed-precondition",
        `İmza çok eski (olası tekrar oynatma): signedDate=${new Date(signedMs).toISOString()} now=${new Date(nowMs).toISOString()}`
      );
    }
  }

  const expMs = new Date(expiresDate).getTime();
  if (Number.isNaN(expMs)) {
    throw new HttpsError("invalid-argument", `Geçersiz son kullanma tarihi: ${expiresDate}`);
  }
  if (expMs <= nowMs - CLOCK_SKEW_MS) {
    throw new HttpsError(
      "failed-precondition",
      `Abonelik süresi dolmuş: expiresDate=${new Date(expMs).toISOString()} now=${new Date(nowMs).toISOString()}`
    );
  }

  return new Date(expMs);
}

/**
 * Abonelik bağı artık KİLİTLEMEZ. Aynı abonelik (originalTransactionId) başka
 * bir hesaba geçtiğinde devir metadatası üretir; premium çağrı yapan hesaba
 * verilir, önceki sahip doğal bitiş tarihine kadar premium kalır.
 *
 * Devir geçmişi (previousUids/transferCount) ileride istismar tespiti içindir:
 * tek bir abonelik çok sayıda hesapta dolaşıyorsa fark edilebilir.
 * Saf fonksiyon — birim testlerde kullanılır.
 */
function resolveSubscriptionBinding(existingBindingData, uid) {
  if (!existingBindingData) {
    return { isNew: true, transferred: false };
  }
  const prevUid = existingBindingData.uid;
  if (prevUid && prevUid !== uid) {
    return {
      isNew: false,
      transferred: true,
      previousUid: prevUid,
      transferCount: (existingBindingData.transferCount || 0) + 1,
    };
  }
  return { isNew: false, transferred: false };
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

    const pinnedRoot = getPinnedRootCert();

    let payload;
    try {
      payload = verifyJwsTransaction(jwsRepresentation, pinnedRoot);
    } catch (err) {
      console.error("[verifyApplePurchase] JWS doğrulama hatası:", err?.message);
      throw new HttpsError("invalid-argument", `JWS doğrulama başarısız: ${err?.message}`);
    }

    const { productId, originalTransactionId, transactionId } = payload;

    // Sandbox/Production ayrımı. İzlenebilirlik için kaydedilir (Sandbox işlemleri
    // App Review + TestFlight tarafından üretildiğinden REDDEDİLMEZ; yalnızca
    // iapEnvironment olarak damgalanır ki admin panelde ayırt edilebilsin).
    const iapEnvironment = String(payload.environment || "").trim() || null;

    const expRawMs = new Date(payload.expiresDate).getTime();
    console.log("[verifyApplePurchase] Payload:", {
      bundleId: payload.bundleId,
      productId,
      type: payload.type,
      environment: iapEnvironment,
      expiresDateRaw: payload.expiresDate,
      expiresDateIso: Number.isNaN(expRawMs) ? "INVALID" : new Date(expRawMs).toISOString(),
      nowIso: new Date().toISOString(),
      remainingMin: Number.isNaN(expRawMs) ? null : Math.round((expRawMs - Date.now()) / 60000),
    });

    const expDate = validateTransactionPayload(payload);

    // Abonelik bağı için kararlı anahtar: originalTransactionId (yenilemelerde sabit).
    const bindingKey = String(originalTransactionId || transactionId || "");
    if (!bindingKey) {
      throw new HttpsError("invalid-argument", "İşlem kimliği bulunamadı.");
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
      iapOriginalTransactionId: bindingKey,
      iapEnvironment,
      iapLastUpdated: FieldValue.serverTimestamp(),
    };
    if (userEmail) userPatch.email = userEmail;
    if (userDisplayName) userPatch.displayName = userDisplayName;

    const bindingRef = db.collection("appleSubscriptions").doc(bindingKey);
    const userRef = db.collection("users").doc(uid);

    // Bağ + aktivasyon tek transaction'da: kilit YOK. Abonelik başka hesaba
    // geçtiyse bu hesaba devredilir (devir geçmişi tutulur), premium aktive edilir.
    await db.runTransaction(async (tx) => {
      const bindingSnap = await tx.get(bindingRef);
      const binding = resolveSubscriptionBinding(
        bindingSnap.exists ? bindingSnap.data() : null,
        uid
      );

      const bindingPatch = {
        uid,
        productId,
        originalTransactionId: bindingKey,
        premiumUntil: Timestamp.fromDate(expDate),
        environment: iapEnvironment,
        lastVerifiedAt: FieldValue.serverTimestamp(),
      };
      if (binding.isNew) {
        bindingPatch.firstActivatedAt = FieldValue.serverTimestamp();
      }
      if (binding.transferred) {
        bindingPatch.previousUids = FieldValue.arrayUnion(binding.previousUid);
        bindingPatch.transferCount = binding.transferCount;
        bindingPatch.lastTransferAt = FieldValue.serverTimestamp();
        console.log(
          `[verifyApplePurchase] Abonelik devri: ${binding.previousUid} → ${uid} ` +
            `(toplam devir=${binding.transferCount}) originalTransactionId=${bindingKey}`
        );
      }

      tx.set(bindingRef, bindingPatch, { merge: true });
      tx.set(userRef, userPatch, { merge: true });
    });

    // Admin panelinde görünmesi için ödeme kaydı yaz (best-effort — akışı bozmaz).
    try {
      const info = PRODUCT_INFO[productId] || { planId: productId, planLabel: productId, durationDays: null };
      const intentRef = await db.collection("premiumPurchaseIntents").add({
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
        iapOriginalTransactionId: bindingKey,
        iapEnvironment,
        premiumUntil: expDate.toISOString(),
        shopifyOrderName: null,
        createdAt: new Date().toISOString(),
        activatedAt: new Date().toISOString(),
      });
      console.log(`[verifyApplePurchase] premiumPurchaseIntents yazıldı id=${intentRef.id} uid=${uid}`);
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

module.exports = {
  verifyApplePurchaseHandler,
  // Doğrulama yardımcıları (birim testlerde kullanılır)
  parseJws,
  base64ToPem,
  loadPinnedRootCert,
  verifyCertificateChain,
  verifyJwsTransaction,
  validateTransactionPayload,
  resolveSubscriptionBinding,
};
