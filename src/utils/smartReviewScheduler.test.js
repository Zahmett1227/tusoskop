import { describe, expect, it } from "vitest";
import {
  applyEarlyReview,
  applyReview,
  clampDifficulty,
  clampStability,
  computeRetrievability,
  createInitialReviewState,
  dedupeSmartReviewsByQuestionId,
  filterInsightReviewPool,
  isDueForReview,
  normalizeSmartReviewEntry,
  sortDueReviews,
  updateReviewAfterGrade,
} from "./smartReviewScheduler.js";

const q = { id: 2354, ders: "Fizyoloji", konu: "Sinir-Kas" };
const day = (offset = 0) => {
  const d = new Date("2026-05-17T12:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};

describe("smartReviewScheduler", () => {
  it("createInitialReviewState wrong için dueAt bugün (hemen tekrar)", () => {
    const now = day(0);
    const state = createInitialReviewState(q, "wrong", now);
    const due = new Date(state.dueAt);
    expect(due.getTime()).toBe(now.getTime());
    expect(isDueForReview(state, now)).toBe(true);
    expect(state.lapseCount).toBe(1);
    expect(state.lastGrade).toBe("again");
  });

  it("again grade difficulty artırır, stability düşürür, dueAt yakın tutar", () => {
    const now = day(0);
    let state = createInitialReviewState(q, "wrong", now);
    state = updateReviewAfterGrade(state, "again", now);
    expect(state.difficulty).toBeGreaterThan(5);
    expect(state.stability).toBeLessThanOrEqual(1);
    const due = new Date(state.dueAt);
    expect(due.getTime()).toBe(day(1).getTime());
    expect(state.lapseCount).toBe(2);
  });

  it("good grade stability artırır, dueAt ileri alır", () => {
    const now = day(0);
    let state = createInitialReviewState(q, "wrong", now);
    const beforeDue = new Date(state.dueAt).getTime();
    state = updateReviewAfterGrade(state, "good", now);
    expect(state.stability).toBeGreaterThan(1);
    expect(new Date(state.dueAt).getTime()).toBeGreaterThan(beforeDue);
    expect(state.reviewCount).toBe(1);
  });

  it("easy grade good'dan daha ileri dueAt verir", () => {
    const now = day(0);
    const base = createInitialReviewState(q, "wrong", now);
    const good = updateReviewAfterGrade({ ...base }, "good", now);
    const easy = updateReviewAfterGrade({ ...base }, "easy", now);
    expect(new Date(easy.dueAt).getTime()).toBeGreaterThan(new Date(good.dueAt).getTime());
  });

  it("difficulty 1-10 clamp edilir", () => {
    expect(clampDifficulty(0)).toBe(1);
    expect(clampDifficulty(99)).toBe(10);
  });

  it("stability min/max clamp edilir", () => {
    expect(clampStability(0.1)).toBe(0.5);
    expect(clampStability(999)).toBe(365);
  });

  it("retrievability zaman geçtikçe azalır", () => {
    const now = day(0);
    const state = {
      stability: 2,
      lastReviewedAt: day(-5).toISOString(),
    };
    const rNow = computeRetrievability(state, now);
    const rLater = computeRetrievability(state, day(5));
    expect(rNow).toBeLessThan(1);
    expect(rLater).toBeLessThan(rNow);
  });

  it("due reviews doğru sıralanır", () => {
    const now = day(0);
    const reviews = [
      {
        questionId: 1,
        dueAt: day(2).toISOString(),
        stability: 3,
        lastReviewedAt: day(-1).toISOString(),
        updatedAt: day(-1).toISOString(),
        ders: "A",
        konu: "x",
      },
      {
        questionId: 2,
        dueAt: day(-2).toISOString(),
        stability: 1,
        lastReviewedAt: day(-10).toISOString(),
        updatedAt: day(-10).toISOString(),
        ders: "B",
        konu: "y",
      },
    ];
    const sorted = sortDueReviews(reviews, now);
    expect(sorted[0].questionId).toBe(2);
  });

  it("duplicate questionId dedupe edilir", () => {
    const list = dedupeSmartReviewsByQuestionId([
      { questionId: 5, dueAt: day(3).toISOString(), stability: 1 },
      { questionId: 5, dueAt: day(1).toISOString(), stability: 1 },
    ]);
    expect(list).toHaveLength(1);
    expect(new Date(list[0].dueAt).getTime()).toBe(day(1).getTime());
  });

  it("bozuk entry normalize edilmez", () => {
    expect(normalizeSmartReviewEntry(null)).toBeNull();
    expect(normalizeSmartReviewEntry({ questionId: "bad" })).toBeNull();
  });

  it("isDueForReview geçmiş dueAt için true döner", () => {
    const entry = { questionId: 1, dueAt: day(-1).toISOString(), stability: 1 };
    expect(isDueForReview(entry, day(0))).toBe(true);
  });

  it("filterInsightReviewPool gelecek due olsa bile yanlış kayıtları dahil eder", () => {
    const now = day(0);
    const futureDue = createInitialReviewState(q, "wrong", now);
    const graded = updateReviewAfterGrade(futureDue, "good", now);
    const pool = filterInsightReviewPool([graded], now);
    expect(pool).toHaveLength(1);
    expect(isDueForReview(graded, now)).toBe(false);
  });

  it("normalizeSmartReviewEntry softReviewCount ve lastReviewContext alanlarını içerir", () => {
    const now = day(0);
    const entry = normalizeSmartReviewEntry({ questionId: 1, softReviewCount: 3, lastReviewContext: "daily_fsrs_review" }, now);
    expect(entry.softReviewCount).toBe(3);
    expect(entry.lastReviewContext).toBe("daily_fsrs_review");
  });
});

describe("applyReview", () => {
  it("due soru normal review tetikler — dueAt ilerler, reviewCount artar", () => {
    const now = day(0);
    const base = { ...createInitialReviewState(q, "wrong", day(-3)), dueAt: day(-1).toISOString() };
    const result = applyReview(base, "good", "daily_fsrs_review", 1, now);
    expect(result).not.toBeNull();
    expect(new Date(result.dueAt).getTime()).toBeGreaterThan(now.getTime());
    expect(result.reviewCount).toBe(1);
    expect(result.lastReviewContext).toBe("daily_fsrs_review");
  });

  it("same-day non-due: scheduling değişmez", () => {
    const now = day(0);
    const futureDue = day(3);
    // lastReviewedAt = bugün, 30 dk önce
    const reviewedToday = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    const base = {
      ...createInitialReviewState(q, "wrong", day(-5)),
      dueAt: futureDue.toISOString(),
      lastReviewedAt: reviewedToday,
    };
    const result = applyReview(base, "good", "daily_fsrs_review", 1, now);
    expect(result).not.toBeNull();
    expect(new Date(result.dueAt).getTime()).toBe(futureDue.getTime());
    expect(result.lastPracticeAt).not.toBeNull();
  });

  it("early correct progressRatio < 0.5: lastReviewedAt ve dueAt korunur, lastPracticeAt güncellenir", () => {
    const now = day(0);
    const futureDue = day(5);
    const oldLastReviewed = day(-2).toISOString();
    const base = {
      ...createInitialReviewState(q, "wrong", day(-5)),
      dueAt: futureDue.toISOString(),
      lastReviewedAt: oldLastReviewed,
    };
    const result = applyReview(base, "good", "topic_practice", 0.3, now);
    expect(result).not.toBeNull();
    expect(new Date(result.dueAt).getTime()).toBe(futureDue.getTime());
    expect(result.lastReviewedAt).toBe(oldLastReviewed);
    expect(result.lastPracticeAt).not.toBeNull();
    expect(result.softReviewCount).toBe(1);
  });

  it("early wrong: dueAt = min(oldDueAt, now+1gün)", () => {
    const now = day(0);
    // Kart çok uzakta due, min → now+1
    const farBase = { ...createInitialReviewState(q, "wrong", day(-5)), dueAt: day(10).toISOString() };
    const r1 = applyReview(farBase, "again", "wrongs_practice", 0.8, now);
    expect(new Date(r1.dueAt).getTime()).toBe(day(1).getTime());
    // Kart yakında due, min → oldDueAt
    const nearBase = { ...createInitialReviewState(q, "wrong", day(-5)), dueAt: day(0).toISOString() };
    // addDays(day(0), 1) = day(1); min(day(0), day(1)) = day(0)
    const r2 = applyReview(nearBase, "again", "wrongs_practice", 0.8, now);
    expect(new Date(r2.dueAt).getTime()).toBeLessThanOrEqual(day(1).getTime());
  });

  it("early wrong progressRatio < 0.75: softLapseCount artar, lapseCount değişmez", () => {
    const now = day(0);
    const base = {
      ...createInitialReviewState(q, "wrong", day(-5)),
      dueAt: day(5).toISOString(),
      lapseCount: 1,
      softLapseCount: 0,
    };
    const result = applyEarlyReview(base, "again", "wrongs_practice", 0.5, now);
    expect(result.lapseCount).toBe(1);
    expect(result.softLapseCount).toBe(1);
  });

  it("early wrong progressRatio >= 0.75: lapseCount artar, softLapseCount değişmez", () => {
    const now = day(0);
    const base = {
      ...createInitialReviewState(q, "wrong", day(-5)),
      dueAt: day(5).toISOString(),
      lapseCount: 1,
      softLapseCount: 0,
    };
    const result = applyEarlyReview(base, "again", "wrongs_practice", 0.8, now);
    expect(result.lapseCount).toBe(2);
    expect(result.softLapseCount).toBe(0);
  });
});
