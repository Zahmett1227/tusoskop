import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GUEST_LIMITS } from "../config/limits";
import {
  getGuestAnsweredCount,
  getGuestRemaining,
  isGuestLimitReached,
  isGuestSession,
  recordGuestAnswer,
  resetGuestUsage,
  setGuestSession,
} from "./guestModeService";

describe("guestModeService", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  afterEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("başlangıçta sayaç 0, kalan tam limit", () => {
    expect(getGuestAnsweredCount()).toBe(0);
    expect(getGuestRemaining()).toBe(GUEST_LIMITS.totalQuestions);
    expect(isGuestLimitReached()).toBe(false);
  });

  it("recordGuestAnswer sayaç artırır ve kalanı azaltır", () => {
    expect(recordGuestAnswer()).toBe(1);
    expect(recordGuestAnswer()).toBe(2);
    expect(getGuestAnsweredCount()).toBe(2);
    expect(getGuestRemaining()).toBe(GUEST_LIMITS.totalQuestions - 2);
  });

  it("limit dolunca isGuestLimitReached true ve kalan 0", () => {
    for (let i = 0; i < GUEST_LIMITS.totalQuestions; i += 1) recordGuestAnswer();
    expect(isGuestLimitReached()).toBe(true);
    expect(getGuestRemaining()).toBe(0);
  });

  it("resetGuestUsage sayacı sıfırlar", () => {
    recordGuestAnswer();
    recordGuestAnswer();
    resetGuestUsage();
    expect(getGuestAnsweredCount()).toBe(0);
    expect(isGuestLimitReached()).toBe(false);
  });

  it("oturum bayrağı set/temizlenebilir", () => {
    expect(isGuestSession()).toBe(false);
    setGuestSession(true);
    expect(isGuestSession()).toBe(true);
    setGuestSession(false);
    expect(isGuestSession()).toBe(false);
  });
});
