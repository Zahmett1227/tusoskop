/**
 * Leaderboard motivasyon seed'i — 5 sahte kullanıcı ekler.
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

// ── Hafta ID ────────────────────────────────────────────────────────────────
function getCurrentWeekId(now = new Date()) {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// ── Sahte kullanıcılar ───────────────────────────────────────────────────────
const WEEK_ID = getCurrentWeekId();
const NOW = FieldValue.serverTimestamp();

const FAKE_USERS = [
  {
    uid: "fake_DrPatoloji_001aabbccdd",
    nickname: "DrPatoloji",
    normalizedNickname: "drpatoloji",
    stats: {
      score: 1048,
      solvedCount: 82,
      correctCount: 71,
      accuracy: 87,
      streakBonusCount: 6,
      fsrsCompletedCount: 5,
      mockExamCount: 2,
    },
  },
  {
    uid: "fake_TusAday42_002eeffgghh",
    nickname: "TusAday42",
    normalizedNickname: "tusaday42",
    stats: {
      score: 874,
      solvedCount: 65,
      correctCount: 54,
      accuracy: 83,
      streakBonusCount: 5,
      fsrsCompletedCount: 4,
      mockExamCount: 1,
    },
  },
  {
    uid: "fake_KlinikUs7_003iiijjjkkk",
    nickname: "KlinikUs7",
    normalizedNickname: "klinkus7",
    stats: {
      score: 712,
      solvedCount: 55,
      correctCount: 44,
      accuracy: 80,
      streakBonusCount: 4,
      fsrsCompletedCount: 3,
      mockExamCount: 1,
    },
  },
  {
    uid: "fake_Fizyolog07_004lllmmmnnn",
    nickname: "Fizyolog07",
    normalizedNickname: "fizyolog07",
    stats: {
      score: 561,
      solvedCount: 43,
      correctCount: 33,
      accuracy: 77,
      streakBonusCount: 3,
      fsrsCompletedCount: 2,
      mockExamCount: 0,
    },
  },
  {
    uid: "fake_BiokimYa_X_005ooopppqqq",
    nickname: "BiokimYa_X",
    normalizedNickname: "biokimya_x",
    stats: {
      score: 418,
      solvedCount: 31,
      correctCount: 23,
      accuracy: 74,
      streakBonusCount: 2,
      fsrsCompletedCount: 1,
      mockExamCount: 0,
    },
  },
];

// ── Seed ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log(`Hafta: ${WEEK_ID}`);
  console.log("Sahte kullanıcılar ekleniyor...\n");

  for (const user of FAKE_USERS) {
    const batch = db.batch();

    // 1. leaderboardProfiles/{uid}
    const profileRef = db.doc(`leaderboardProfiles/${user.uid}`);
    batch.set(profileRef, {
      uid: user.uid,
      nickname: user.nickname,
      normalizedNickname: user.normalizedNickname,
      isOptedIn: true,
      createdAt: NOW,
      updatedAt: NOW,
      lastNicknameChangeAt: NOW,
    });

    // 2. normalizedNicknames/{normalized} — benzersizlik tablosu
    const normRef = db.doc(`normalizedNicknames/${user.normalizedNickname}`);
    batch.set(normRef, { uid: user.uid, claimedAt: NOW });

    // 3. weeklyLeaderboard/{weekId}/users/{uid}
    const weekRef = db.doc(`weeklyLeaderboard/${WEEK_ID}/users/${user.uid}`);
    batch.set(weekRef, {
      nickname: user.nickname,
      ...user.stats,
      lastScoreAt: NOW,
      updatedAt: NOW,
    });

    await batch.commit();
    console.log(`✓ ${user.nickname.padEnd(14)} — ${user.stats.score} puan`);
  }

  console.log(`\n✅ ${FAKE_USERS.length} sahte kullanıcı başarıyla eklendi.`);
  console.log(`   Leaderboard'u yenileyince görünürler: hafta ${WEEK_ID}`);
}

seed().catch((err) => {
  console.error("Hata:", err.message);
  process.exit(1);
});
