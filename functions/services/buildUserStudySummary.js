/**
 * Builds a compact study summary for a user by reading Firestore data.
 * This summary is sent to the AI — NOT raw Firestore documents.
 *
 * Reads:
 *   users/{uid}/fsrsDailyStats/{YYYY-MM-DD}  → last 7 days stats
 *   users/{uid}/smartReviews                  → due / overdue / lapse data
 *   users/{uid}/questionHistory               → topic mastery
 *   users/{uid}/wrongQuestions                → supplementary wrong data
 *
 * @param {string} uid
 * @param {import('firebase-admin/firestore').Firestore} db
 * @returns {Promise<object>} studySummary
 */
async function buildUserStudySummary(uid, db) {
  const now = new Date();
  const today = toDateKey(now);

  const [dailyStatsSnaps, smartReviewsSnap, historySnap, wrongSnap] =
    await Promise.all([
      fetchLast7DayStats(uid, db, now),
      db.collection(`users/${uid}/smartReviews`).get(),
      db.collection(`users/${uid}/questionHistory`).get(),
      db.collection(`users/${uid}/wrongQuestions`).get(),
    ]);

  // ── FSRS stats ──────────────────────────────────────────────────────────────
  const last7 = aggregateDailyStats(dailyStatsSnaps);
  const smartReviews = smartReviewsSnap.docs.map((d) => d.data());
  const { dueToday, overdue, lapseRate } = computeFsrsMetrics(smartReviews, now);

  // ── Question history → topic mastery ───────────────────────────────────────
  const historyDocs = historySnap.docs.map((d) => d.data());
  const wrongDocs = wrongSnap.docs.map((d) => d.data());
  const { topicMastery, weakTopics } = buildTopicMastery(
    historyDocs,
    wrongDocs,
    smartReviews,
    today
  );

  // ── Recent performance ──────────────────────────────────────────────────────
  const activeDaysLast7 = last7.filter((s) => s.reviewedCount > 0 || s.addedCount > 0).length;
  const last7DaysSolved = last7.reduce((sum, s) => sum + (s.reviewedCount || 0), 0);
  const addedLast7Days = last7.reduce((sum, s) => sum + (s.addedCount || 0), 0);
  const reviewedLast7Days = last7.reduce((sum, s) => sum + (s.reviewedCount || 0), 0);

  // Correct rate from history (last 7 days proxy via questionHistory totals)
  const totals = historyDocs.reduce(
    (acc, h) => {
      acc.solved += Number(h.solvedCount || 0);
      acc.correct += Number(h.correctCount || 0);
      return acc;
    },
    { solved: 0, correct: 0 }
  );
  const overallCorrectRate =
    totals.solved > 0 ? round2(totals.correct / totals.solved) : 0;
  const overallWrongCount = totals.solved - totals.correct;

  return {
    userLevel: "TUS hazırlık",
    availableTimeMinutes: 90,
    recentPerformance: {
      last7DaysSolved,
      last7DaysCorrectRate: overallCorrectRate,
      last7DaysWrongCount: overallWrongCount,
      activeDaysLast7,
    },
    fsrsStats: {
      dueToday,
      overdue,
      addedLast7Days,
      reviewedLast7Days,
      lapseRate,
    },
    topicMastery: topicMastery.slice(0, 20),
    weakTopics: weakTopics.slice(0, 5),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function fetchLast7DayStats(uid, db, now) {
  const dates = Array.from({ length: 7 }, (_, i) =>
    toDateKey(addDays(now, i - 6))
  );
  const snaps = await Promise.all(
    dates.map((date) => db.doc(`users/${uid}/fsrsDailyStats/${date}`).get())
  );
  return snaps.map((snap, i) => {
    if (!snap.exists) return { date: dates[i], addedCount: 0, reviewedCount: 0 };
    const d = snap.data();
    return {
      date: dates[i],
      addedCount: Number(d.addedCount || 0),
      reviewedCount: Number(d.reviewedCount || 0),
    };
  });
}

function aggregateDailyStats(stats) {
  return stats;
}

function computeFsrsMetrics(reviews, now) {
  const nowMs = now.getTime();
  let dueToday = 0;
  let overdue = 0;
  let totalLapses = 0;
  let totalReviews = 0;

  for (const r of reviews) {
    if (!r.dueAt) continue;
    const dueMs = new Date(r.dueAt).getTime();
    if (dueMs <= nowMs) {
      const overdueDays = (nowMs - dueMs) / (1000 * 60 * 60 * 24);
      if (overdueDays > 1) {
        overdue++;
      } else {
        dueToday++;
      }
    }
    totalLapses += Number(r.lapseCount || 0);
    totalReviews += Number(r.reviewCount || 0);
  }

  const lapseRate =
    totalReviews > 0 ? round2(totalLapses / totalReviews) : 0;

  return { dueToday, overdue, lapseRate };
}

/**
 * Computes per-topic mastery, wrongRate, weaknessScore.
 * Uses questionHistory as the primary source, supplemented by wrongQuestions
 * and smartReviews for extra signals.
 */
function buildTopicMastery(historyDocs, wrongDocs, smartReviews, today) {
  // Index wrong docs by questionId
  const wrongMap = new Map();
  for (const w of wrongDocs) {
    if (w.questionId) wrongMap.set(Number(w.questionId), w);
  }

  // Aggregate history by (ders, konu)
  const topicMap = new Map();
  for (const h of historyDocs) {
    if (!h.ders || !h.konu) continue;
    const key = `${h.ders}|||${h.konu}`;
    if (!topicMap.has(key)) {
      topicMap.set(key, {
        lesson: h.ders,
        topic: h.konu,
        solvedCount: 0,
        correctCount: 0,
        wrongCount: 0,
        lastSolvedAt: null,
      });
    }
    const entry = topicMap.get(key);
    entry.solvedCount += Number(h.solvedCount || 0);
    entry.correctCount += Number(h.correctCount || 0);
    entry.wrongCount += Number(h.wrongCount || 0);
    if (h.lastSolvedAt) {
      const last = new Date(
        h.lastSolvedAt?.toDate?.() ?? h.lastSolvedAt
      );
      if (!entry.lastSolvedAt || last > entry.lastSolvedAt) {
        entry.lastSolvedAt = last;
      }
    }
  }

  // FSRS lapse signals per topic
  const fsrsTopicLapses = new Map();
  for (const r of smartReviews) {
    if (!r.ders || !r.konu) continue;
    const key = `${r.ders}|||${r.konu}`;
    const prev = fsrsTopicLapses.get(key) || { lapses: 0, count: 0 };
    prev.lapses += Number(r.lapseCount || 0);
    prev.count += 1;
    fsrsTopicLapses.set(key, prev);
  }

  const todayMs = new Date(today).getTime();
  const topicMastery = [];

  for (const [key, entry] of topicMap) {
    const { lesson, topic, solvedCount, correctCount, lastSolvedAt } = entry;

    if (solvedCount === 0) continue;

    const rawMastery = correctCount / solvedCount;
    const confidence = Math.min(solvedCount / 20, 1);
    const adjustedMastery = round2(rawMastery * confidence + 0.5 * (1 - confidence));
    const wrongRate = round2(1 - rawMastery);

    const lapseSig = fsrsTopicLapses.get(key);
    const topicLapseRate =
      lapseSig && lapseSig.count > 0
        ? round2(lapseSig.lapses / lapseSig.count)
        : 0;

    const lastSolvedDaysAgo = lastSolvedAt
      ? Math.floor((todayMs - lastSolvedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const examImportance = 0.5; // no data yet; default neutral
    const weaknessScore = computeWeaknessScore({
      mastery: adjustedMastery,
      wrongRate,
      overdueTopicRate: 0,
      lapseRate: topicLapseRate,
      examImportance,
    });

    topicMastery.push({
      lesson,
      topic,
      mastery: adjustedMastery,
      wrongRate,
      questionCount: solvedCount,
      lastSolvedDaysAgo,
      examImportance,
      weaknessScore: round2(weaknessScore),
    });
  }

  topicMastery.sort((a, b) => b.weaknessScore - a.weaknessScore);

  const weakTopics = topicMastery
    .filter((t) => t.weaknessScore > 0.35 && t.questionCount >= 3)
    .slice(0, 5)
    .map((t) => ({
      lesson: t.lesson,
      topic: t.topic,
      mastery: t.mastery,
      wrongRate: t.wrongRate,
      weaknessScore: t.weaknessScore,
      reason: buildWeaknessReason(t),
    }));

  return { topicMastery, weakTopics };
}

/**
 * weaknessScore formula (0–1 scale):
 *   0.35 * (1 - mastery)  — low mastery weight
 *   0.25 * wrongRate       — wrong answer penalty
 *   0.20 * overdueTopicRate— topic overdue signal (0 if unavailable)
 *   0.10 * lapseRate       — FSRS lapse signal
 *   0.10 * examImportance  — strategic importance
 */
function computeWeaknessScore({
  mastery,
  wrongRate,
  overdueTopicRate = 0,
  lapseRate = 0,
  examImportance = 0.5,
}) {
  const raw =
    0.35 * (1 - mastery) +
    0.25 * wrongRate +
    0.2 * overdueTopicRate +
    0.1 * lapseRate +
    0.1 * examImportance;
  return Math.min(1, Math.max(0, raw));
}

function buildWeaknessReason(t) {
  const parts = [];
  if (t.mastery < 0.5) parts.push("yeterlilik düzeyin düşük");
  if (t.wrongRate > 0.4) parts.push("yanlış oranın yüksek");
  if (t.lastSolvedDaysAgo > 14) parts.push("uzun süredir çalışılmamış");
  if (parts.length === 0) parts.push("genel zayıflık sinyali");
  return `Bu konuda ${parts.join(", ")}.`;
}

module.exports = { buildUserStudySummary };
