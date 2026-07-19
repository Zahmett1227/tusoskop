#!/usr/bin/env node
// Backend bütünlük koruması — firebase deploy predeploy hook'u.
//
// İki branch (main, ios-appstore-v2) TEK Firebase projesine deploy ettiği için
// functions/ ve firestore.rules her iki branch'te birleşik (süperset) tutulmak
// zorundadır. Bu script, eksik içerikli bir kaynaktan deploy yapılıp diğer
// platformun fonksiyonlarının silinmesini / kurallarının kırılmasını engeller.
//
// Kullanım: node ./scripts/check-backend-integrity.mjs [functions|rules]
// (argümansız çağrıda her iki kontrol de çalışır)

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv[2] || "all";
const errors = [];

if (mode === "functions" || mode === "all") {
  const EXPECTED_EXPORTS = [
    "incrementUsage",
    "registerAppleRefreshToken",
    "deleteAccountAndData",
    "verifyApplePurchase",
    "tryPublishSocialContent",
    "createPaytrToken",
    "paytrCallback",
    "onUserDocumentCreated",
    "generateDailyStudyPlan",
  ];
  const src = readFileSync(join(root, "functions/index.js"), "utf8");
  const found = [...src.matchAll(/^exports\.([A-Za-z0-9_]+)\s*=/gm)].map((m) => m[1]);
  const missing = EXPECTED_EXPORTS.filter((n) => !found.includes(n));
  const extra = found.filter((n) => !EXPECTED_EXPORTS.includes(n));
  if (missing.length) {
    errors.push(
      `functions/index.js EKSİK export içeriyor: ${missing.join(", ")}\n` +
        `  Eksik kaynaktan deploy, bu fonksiyonları CANLIDAN SİLER (web ödeme / iOS IAP kırılır).`
    );
  }
  if (extra.length) {
    errors.push(
      `functions/index.js beklenmeyen export içeriyor: ${extra.join(", ")}\n` +
        `  Yeni fonksiyon eklendiyse bu listeyi (her iki branch'te) güncelle.`
    );
  }
  if (!src.includes("capacitor://localhost")) {
    errors.push(
      "functions/index.js allowedOrigins listesinde Capacitor origin'leri yok — iOS callable'ları CORS'tan kırılır."
    );
  }
}

if (mode === "rules" || mode === "all") {
  const rules = readFileSync(join(root, "firestore.rules"), "utf8");
  for (const field of ["'platform'", "'appVersion'", "'lastSeenAt'"]) {
    if (!rules.includes(field)) {
      errors.push(
        `firestore.rules allowlist'lerinde ${field} yok — iOS'ta YENİ kullanıcı kaydı permission-denied ile kırılır.`
      );
    }
  }
  if (!rules.includes("/appleSubscriptions/")) {
    errors.push("firestore.rules appleSubscriptions bloğu yok (IAP savunma katmanı).");
  }
}

if (errors.length) {
  console.error("\n✖ BACKEND BÜTÜNLÜK KONTROLÜ BAŞARISIZ — deploy durduruldu:\n");
  for (const e of errors) console.error("  • " + e + "\n");
  console.error(
    "Bu branch'teki functions/ + firestore.rules, diğer branch'le birleşik (süperset) tutulmalı.\n" +
      "Bkz. CLAUDE.md → 'Backend Tek Kaynak Kuralı'.\n"
  );
  process.exit(1);
}

console.log(`✔ Backend bütünlük kontrolü geçti (${mode}).`);
