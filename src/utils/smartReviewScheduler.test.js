import { describe, expect, it } from "vitest";
import {
  applyEarlyReview,
  applyReview,
  clampDifficulty,
  clampStability,
  computeRetrievability,
  computeScheduledDays,
  createInitialReviewState,
  dedupeSmartReviewsByQuestionId,
  filterInsightReviewPool,
  getEarlyWeight,
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

describe("applyReview (ek senaryolar)", () => {
  it("due kart reviewContext aktarılır", () => {
    const now = day(0);
    const base = { ...createInitialReviewState(q, "wrong", day(-3)), dueAt: day(-1).toISOString() };
    const result = applyReview(base, "good", now, "daily_fsrs_review");
    expect(result).not.toBeNull();
    expect(result.lastReviewContext).toBe("daily_fsrs_review");
  });

  it("early correct progressRatio < 0.5: lastReviewedAt ve dueAt korunur, lastPracticeAt güncellenir", () => {
    // lastReviewed=day(-2), due=day(5) → scheduledDays=7, elapsed=2, ratio≈0.29 < 0.5
    const now = day(0);
    const futureDue = day(5);
    const oldLastReviewed = day(-2).toISOString();
    const base = {
      ...createInitialReviewState(q, "wrong", day(-5)),
      dueAt: futureDue.toISOString(),
      lastReviewedAt: oldLastReviewed,
    };
    const result = applyReview(base, "good", now, "topic_practice");
    expect(result).not.toBeNull();
    expect(new Date(result.dueAt).getTime()).toBe(futureDue.getTime());
    expect(result.lastReviewedAt).toBe(oldLastReviewed);
    expect(result.lastPracticeAt).not.toBeNull();
    expect(result.softReviewCount).toBe(1);
    expect(result.lastReviewContext).toBe("topic_practice");
  });

  it("early wrong: dueAt = min(oldDueAt, now+1gün) — yakın due durumda oldDueAt korunur", () => {
    // dueAt = 6 saat sonra (< 1 gün), lastReviewedAt = 2 gün önce (early path)
    const now = day(0);
    const nearDue = new Date(now.getTime() + 6 * 3600 * 1000);
    const base = {
      ...createInitialReviewState(q, "wrong", day(-5)),
      dueAt: nearDue.toISOString(),
      lastReviewedAt: day(-2).toISOString(),
    };
    const result = applyReview(base, "again", now);
    // min(nearDue, now+24h) = nearDue (since 6h < 24h)
    expect(new Date(result.dueAt).getTime()).toBe(nearDue.getTime());
  });
});

describe("applyEarlyReview (lapse mantığı)", () => {
  it("progressRatio < 0.75: softLapseCount artar, lapseCount değişmez", () => {
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

  it("progressRatio >= 0.75: lapseCount artar, softLapseCount değişmez", () => {
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

describe("computeScheduledDays", () => {
  it("lastReviewedAt → dueAt arasındaki gün farkını döner", () => {
    const card = {
      questionId: 1,
      lastReviewedAt: day(0).toISOString(),
      dueAt: day(5).toISOString(),
      stability: 1,
    };
    expect(computeScheduledDays(card)).toBeCloseTo(5, 0);
  });

  it("lastReviewedAt yoksa null döner", () => {
    const card = { questionId: 1, lastReviewedAt: null, dueAt: day(5).toISOString(), stability: 1 };
    expect(computeScheduledDays(card)).toBeNull();
  });
});

describe("getEarlyWeight", () => {
  it("elapsedDays çok küçükse 0.1 döner", () => {
    expect(getEarlyWeight(0.1, 10)).toBe(0.1);
  });

  it("yarıya ulaşmışsa 0.35 döner", () => {
    expect(getEarlyWeight(3, 10)).toBe(0.35);
  });

  it("scheduledDays sıfırsa 0.3 döner", () => {
    expect(getEarlyWeight(5, 0)).toBe(0.3);
  });
});

describe("applyReview", () => {
  const mkCard = (lastReviewedOffset, dueOffset) => ({
    questionId: 42,
    ders: "A",
    konu: "B",
    lastReviewedAt: day(lastReviewedOffset).toISOString(),
    dueAt: day(dueOffset).toISOString(),
    difficulty: 5,
    stability: 4,
    lapseCount: 0,
    softLapseCount: 0,
    reviewCount: 1,
    source: "wrong",
    state: "review",
  });

  it("due kart → normal FSRS update (doğru → stability artar)", () => {
    const card = mkCard(-5, -1); // due dün, son review 5 gün önce
    const now = day(0);
    const result = applyReview(card, "good", now);
    expect(result.stability).toBeGreaterThan(card.stability);
    expect(result.lapseCount).toBe(0);
  });

  it("due kart yanlış → lapseCount artar", () => {
    const card = mkCard(-5, -1);
    const result = applyReview(card, "again", day(0));
    expect(result.lapseCount).toBe(1);
    expect(result.softLapseCount).toBe(0);
  });

  it("same-day: elapsedDays < 1 → dueAt değişmez", () => {
    // Son review 7 saat önce (0.29 gün), due 5 gün sonra
    const baseNow = day(0);
    const lastReviewedAt = new Date(baseNow.getTime() - 7 * 3600 * 1000).toISOString();
    const card = {
      questionId: 42,
      ders: "A",
      konu: "B",
      lastReviewedAt,
      dueAt: day(5).toISOString(),
      difficulty: 5,
      stability: 4,
      lapseCount: 0,
      softLapseCount: 0,
      reviewCount: 1,
      source: "wrong",
      state: "review",
    };
    const result = applyReview(card, "good", baseNow);
    expect(result.dueAt).toBe(card.dueAt);
    expect(result.stability).toBe(card.stability);
    expect(result.sameDayReviewCount).toBe(1);
  });

  it("early doğru progressRatio < 0.5 → dueAt korunur", () => {
    // Son review 0 gün önce, due 10 gün sonra, elapsed = 1 gün (ratio 0.1)
    const card = mkCard(0, 10);
    const nowPlus1 = day(1); // 1 gün geçmiş, ratio = 1/10 = 0.1
    const result = applyReview(card, "good", nowPlus1);
    expect(result.dueAt).toBe(card.dueAt);
    expect(result.stability).toBeGreaterThan(card.stability);
    expect(result.stability).toBeLessThan(
      updateReviewAfterGrade(normalizeSmartReviewEntry(card), "good", nowPlus1).stability
    );
  });

  it("early yanlış progressRatio < 0.75 → softLapseCount artar, lapseCount değişmez", () => {
    // Last review bugün, due 10 gün sonra, elapsed ~4 gün (ratio ~0.4)
    const card = mkCard(0, 10);
    const nowPlus4 = day(4);
    const result = applyReview(card, "again", nowPlus4);
    expect(result.lapseCount).toBe(0);
    expect(result.softLapseCount).toBe(1);
    expect(new Date(result.dueAt).getTime()).toBeLessThanOrEqual(new Date(day(5).getTime()).getTime());
  });

  it("early yanlış progressRatio >= 0.75 → gerçek lapseCount artar", () => {
    // Last review 0, due 4, elapsed 3.2, ratio ~0.8
    const card = mkCard(0, 4);
    const nowPlus32 = new Date(day(0).getTime() + 3.2 * 86400000);
    const result = applyReview(card, "again", nowPlus32);
    expect(result.lapseCount).toBe(1);
    expect(result.softLapseCount).toBe(0);
  });
});
