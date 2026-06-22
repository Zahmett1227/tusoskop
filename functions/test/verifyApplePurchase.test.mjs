// IAP doğrulama birim testleri — Apple Root CA pinning + payload + abonelik bağı.
// Çalıştırma:  cd functions && node --test
//
// Fixtures (functions/test/fixtures/testCertChain.json) openssl ile üretilmiş
// SAHTE bir zincirdir (gerçek Apple sertifikası DEĞİL); yalnızca pinning
// mantığının doğru çalıştığını kanıtlamak içindir.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const fx = JSON.parse(readFileSync(join(here, "fixtures/testCertChain.json"), "utf8"));

// CJS modülü güvenilir şekilde yükle (named export interop'a güvenme).
const require = createRequire(import.meta.url);
const {
  verifyCertificateChain,
  validateTransactionPayload,
  assertSubscriptionOwnership,
  loadPinnedRootCert,
  parseJws,
} = require("../verifyApplePurchase.js");

const pinnedRoot = loadPinnedRootCert(fx.rootPem);
const otherRoot = loadPinnedRootCert(fx.otherRootPem);
const validChain = [fx.leafDerB64, fx.interDerB64, fx.rootDerB64];

test("verifyCertificateChain: pin'lenen kök zincirin kökü ise leaf public key döner", () => {
  const pub = verifyCertificateChain(validChain, pinnedRoot);
  assert.ok(pub, "public key dönmeli");
  assert.equal(typeof pub.export, "function");
});

test("verifyCertificateChain: pin uyuşmazlığında reddeder (KRİTİK güvenlik)", () => {
  assert.throws(
    () => verifyCertificateChain(validChain, otherRoot),
    /eşleşmiyor/i
  );
});

test("verifyCertificateChain: pin'lenmiş kök yoksa fail-closed", () => {
  assert.throws(() => verifyCertificateChain(validChain, null), /yapılandırılmamış/i);
});

test("verifyCertificateChain: tek sertifikalık zincir reddedilir", () => {
  assert.throws(() => verifyCertificateChain([fx.leafDerB64], pinnedRoot), /Geçersiz sertifika zinciri/i);
});

test("verifyCertificateChain: kopuk zincir (ara atlanmış) imza doğrulamasında reddedilir", () => {
  // leaf doğrudan kök ile imzalanmamış → certs[0].verify(root) başarısız olmalı.
  assert.throws(
    () => verifyCertificateChain([fx.leafDerB64, fx.rootDerB64], pinnedRoot),
    /indeks 0/i
  );
});

test("validateTransactionPayload: geçerli payload bitiş tarihini döner", () => {
  const exp = Date.now() + 86400000;
  const d = validateTransactionPayload({
    bundleId: "com.tusoskop.app",
    type: "Auto-Renewable Subscription",
    productId: "com.tusoskop.app.plus.3m",
    expiresDate: exp,
  });
  assert.equal(d.getTime(), exp);
});

test("validateTransactionPayload: yanlış bundle ID reddedilir", () => {
  assert.throws(
    () =>
      validateTransactionPayload({
        bundleId: "com.evil.app",
        type: "Auto-Renewable Subscription",
        productId: "com.tusoskop.app.plus.3m",
        expiresDate: Date.now() + 86400000,
      }),
    (e) => e.code === "invalid-argument"
  );
});

test("validateTransactionPayload: izin verilmeyen ürün reddedilir", () => {
  assert.throws(
    () =>
      validateTransactionPayload({
        bundleId: "com.tusoskop.app",
        type: "Auto-Renewable Subscription",
        productId: "com.tusoskop.app.plus.lifetime",
        expiresDate: Date.now() + 86400000,
      }),
    (e) => e.code === "invalid-argument"
  );
});

test("validateTransactionPayload: süresi dolmuş abonelik reddedilir", () => {
  assert.throws(
    () =>
      validateTransactionPayload({
        bundleId: "com.tusoskop.app",
        type: "Auto-Renewable Subscription",
        productId: "com.tusoskop.app.plus.1m",
        expiresDate: Date.now() - 1000,
      }),
    (e) => e.code === "failed-precondition"
  );
});

test("assertSubscriptionOwnership: aynı uid ise sorun yok", () => {
  assert.doesNotThrow(() => assertSubscriptionOwnership({ uid: "user-1" }, "user-1"));
});

test("assertSubscriptionOwnership: bağ yoksa sorun yok", () => {
  assert.doesNotThrow(() => assertSubscriptionOwnership(null, "user-1"));
});

test("assertSubscriptionOwnership: farklı uid ise reddeder (abonelik paylaşımı engeli)", () => {
  assert.throws(
    () => assertSubscriptionOwnership({ uid: "user-1" }, "user-2"),
    (e) => e.code === "permission-denied"
  );
});

test("parseJws: bozuk format reddedilir", () => {
  assert.throws(() => parseJws("not-a-jws"), /Geçersiz JWS formatı/i);
});
