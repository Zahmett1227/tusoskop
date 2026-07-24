import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_REVIEW_CONFIG, APP_STORE_ID } from "../config/appReview";
import {
  getAppReviewState,
  isEligibleForPrompt,
  markDismissedForever,
  markPrompted,
  markRated,
  openAppStoreReview,
  recordAnsweredForReview,
  shouldPromptForTrigger,
} from "./appReviewService";

const T0 = new Date("2026-01-01T10:00:00.000Z");
const daysLater = (n) => new Date(T0.getTime() + n * 24 * 60 * 60 * 1000);

describe("appReviewService", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("taze durumda uygun; eşik altı soru tetiği false, tamamlanma tetiği true", () => {
    expect(isEligibleForPrompt(T0)).toBe(true);
    expect(shouldPromptForTrigger("answered_threshold", T0)).toBe(false);
    expect(shouldPromptForTrigger("topic_test_done", T0)).toBe(true);
    expect(shouldPromptForTrigger("fsrs_daily", T0)).toBe(true);
  });

  it("20 soru sonrası answered_threshold tetiği açılır", () => {
    for (let i = 0; i < APP_REVIEW_CONFIG.minAnsweredForPrompt - 1; i += 1) {
      recordAnsweredForReview();
    }
    expect(shouldPromptForTrigger("answered_threshold", T0)).toBe(false);
    recordAnsweredForReview(); // 20
    expect(getAppReviewState().answeredTotal).toBe(APP_REVIEW_CONFIG.minAnsweredForPrompt);
    expect(shouldPromptForTrigger("answered_threshold", T0)).toBe(true);
  });

  it("markPrompted sonrası gün aralığı dolana kadar uygun değil", () => {
    markPrompted(T0);
    expect(getAppReviewState().promptCount).toBe(1);
    expect(isEligibleForPrompt(T0)).toBe(false);
    expect(isEligibleForPrompt(daysLater(APP_REVIEW_CONFIG.minDaysBetweenPrompts - 1))).toBe(false);
    expect(isEligibleForPrompt(daysLater(APP_REVIEW_CONFIG.minDaysBetweenPrompts + 1))).toBe(true);
  });

  it("markRated ve markDismissedForever kalıcı olarak kapatır", () => {
    markRated();
    expect(isEligibleForPrompt(daysLater(365))).toBe(false);
    window.localStorage.clear();
    markDismissedForever();
    expect(isEligibleForPrompt(daysLater(365))).toBe(false);
  });

  it("ömür boyu istem tavanı aşılınca uygun değil", () => {
    let day = 0;
    for (let i = 0; i < APP_REVIEW_CONFIG.maxLifetimePrompts; i += 1) {
      markPrompted(daysLater(day));
      day += APP_REVIEW_CONFIG.minDaysBetweenPrompts + 1;
    }
    expect(getAppReviewState().promptCount).toBe(APP_REVIEW_CONFIG.maxLifetimePrompts);
    expect(isEligibleForPrompt(daysLater(day + 60))).toBe(false);
  });

  it("APP_STORE_ID yapılandırılmış: openAppStoreReview doğru App Store URL'sini açar", () => {
    expect(APP_STORE_ID).toBeTruthy();
    const openSpy = vi.spyOn(window, "open").mockReturnValue({ focus: () => {} });
    try {
      expect(openAppStoreReview()).toBe(true);
      expect(openSpy).toHaveBeenCalledTimes(1);
      const url = String(openSpy.mock.calls[0][0]);
      expect(url).toContain(`id${APP_STORE_ID}`);
      expect(url).toContain("action=write-review");
    } finally {
      openSpy.mockRestore();
    }
  });
});
