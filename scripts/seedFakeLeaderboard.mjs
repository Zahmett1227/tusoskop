/**
 * Leaderboard motivasyon seed'i — her iki lige 6'şar sahte kullanıcı ekler.
 *
 * ÖNEMLİ: Skorlar lig ekiyle yazılır → `weeklyLeaderboard/{weekId}_{league}/users/{uid}`.
 * Servis (leaderboardService.js → leagueWeekId) bu yolu sorgular; eksik ek = listede görünmez.
 *
 * Kullanım:
 *   1. Firebase Console → Project Settings → Service Accounts →
 *      "Generate new private key" → JSON dosyasını indir
 *   2. node scripts/seedFakeLeaderboard.mjs /path/to/serviceAccount.json
 *
 * Not: Bu script sadece geliştirme / demo amaçlıdır.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// ── Argüman: service account path ──────────────────────────────────────────
const serviceAccountPath = process.argv[2];
if (!serviceAccountPath) {
  console.error("Kullanım: node scripts/seedFakeLeaderboard.mjs <serviceAccount.json yolu>");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(resolve(serviceAccountPath), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Hafta ID (ISO 8601, Pazartesi başlangıç) ─────────────────────────────────
function getCurrentWeekId(now = new Date()) {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

const WEEK_ID = getCurrentWeekId();
const NOW = FieldValue.serverTimestamp();

// ── Sahte kullanıcılar (lig bazlı) ───────────────────────────────────────────
const FAKE_USERS = {
  temel: [
    { uid: "fake_temel_anatomikrali", nickname: "AnatomiKrali", stats: { score: 1340, solvedCount: 96, correctCount: 84, accuracy: 88, streakBonusCount: 6, fsrsCompletedCount: 6, mockExamCount: 2 } },
    { uid: "fake_temel_sinapsavcisi", nickname: "SinapsAvcisi", stats: { score: 1085, solvedCount: 78, correctCount: 66, accuracy: 85, streakBonusCount: 5, fsrsCompletedCount: 5, mockExamCount: 1 } },
    { uid: "fake_temel_krebsdongusu", nickname: "KrebsDongusu", stats: { score: 932, solvedCount: 71, correctCount: 57, accuracy: 80, streakBonusCount: 4, fsrsCompletedCount: 4, mockExamCount: 1 } },
    { uid: "fake_temel_noronninja", nickname: "NoronNinja", stats: { score: 768, solvedCount: 60, correctCount: 47, accuracy: 78, streakBonusCount: 4, fsrsCompletedCount: 3, mockExamCount: 1 } },
    { uid: "fake_temel_histolojipro", nickname: "HistolojiPro", stats: { score: 604, solvedCount: 49, correctCount: 37, accuracy: 76, streakBonusCount: 3, fsrsCompletedCount: 2, mockExamCount: 0 } },
    { uid: "fake_temel_enzimkinetik", nickname: "EnzimKinetik", stats: { score: 451, solvedCount: 37, correctCount: 27, accuracy: 73, streakBonusCount: 2, fsrsCompletedCount: 1, mockExamCount: 0 } },
  ],
  klinik: [
    { uid: "fake_klinik_drvizit", nickname: "DrVizit", stats: { score: 1410, solvedCount: 102, correctCount: 90, accuracy: 88, streakBonusCount: 7, fsrsCompletedCount: 6, mockExamCount: 2 } },
    { uid: "fake_klinik_ekgustasi", nickname: "EKGustasi", stats: { score: 1120, solvedCount: 83, correctCount: 70, accuracy: 84, streakBonusCount: 5, fsrsCompletedCount: 5, mockExamCount: 2 } },
    { uid: "fake_klinik_pediatripro", nickname: "PediatriPro", stats: { score: 945, solvedCount: 73, correctCount: 59, accuracy: 81, streakBonusCount: 5, fsrsCompletedCount: 4, mockExamCount: 1 } },
    { uid: "fake_klinik_nobetciasistan", nickname: "NobetciAsistan", stats: { score: 792, solvedCount: 62, correctCount: 49, accuracy: 79, streakBonusCount: 4, fsrsCompletedCount: 3, mockExamCount: 1 } },
    { uid: "fake_klinik_stajyerdoktor", nickname: "StajyerDoktor", stats: { score: 618, solvedCount: 50, correctCount: 38, accuracy: 76, streakBonusCount: 3, fsrsCompletedCount: 2, mockExamCount: 0 } },
    { uid: "fake_klinik_receterunner", nickname: "ReceteRunner", stats: { score: 472, solvedCount: 39, correctCount: 28, accuracy: 72, streakBonusCount: 2, fsrsCompletedCount: 1, mockExamCount: 0 } },
  ],
};

const normalize = (n) => String(n || "").trim().toLowerCase().replace(/\s+/g, "_");

// ── Seed ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log(`Hafta: ${WEEK_ID}\nSahte kullanıcılar ekleniyor...\n`);

  for (const [league, users] of Object.entries(FAKE_USERS)) {
    console.log(`── ${league.toUpperCase()} LİGİ ──`);
    for (const user of users) {
      const batch = db.batch();
      const normalized = normalize(user.nickname);

      // 1. Haftalık skor — lig ekiyle (görünürlük için zorunlu)
      const weekRef = db.doc(`weeklyLeaderboard/${WEEK_ID}_${league}/users/${user.uid}`);
      batch.set(weekRef, {
        nickname: user.nickname,
        ...user.stats,
        lastScoreAt: NOW,
        updatedAt: NOW,
      });

      // 2. normalizedNicknames — benzersizlik rezervasyonu (çakışma önler)
      batch.set(db.doc(`normalizedNicknames/${normalized}`), { uid: user.uid, claimedAt: NOW });

      await batch.commit();
      console.log(`  ✓ ${user.nickname.padEnd(16)} — ${user.stats.score} puan`);
    }
  }

  const total = FAKE_USERS.temel.length + FAKE_USERS.klinik.length;
  console.log(`\n✅ ${total} sahte kullanıcı eklendi (hafta ${WEEK_ID}).`);
}

seed().catch((err) => {
  console.error("Hata:", err.message);
  process.exit(1);
});
