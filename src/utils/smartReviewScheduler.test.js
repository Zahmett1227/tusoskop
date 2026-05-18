import { describe, expect, it } from "vitest";
import {
  clampDifficulty,
  clampStability,
  computeRetrievability,
  createInitialReviewState,
  dedupeSmartReviewsByQuestionId,
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
});
