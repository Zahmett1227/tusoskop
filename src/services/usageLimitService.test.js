import { beforeEach, describe, expect, it, vi } from "vitest";
import { FREE_LIMITS } from "../config/limits";

const getDocMock = vi.fn();
const httpsCallableMock = vi.fn();

vi.mock("../firebase", () => ({
  db: {},
  functions: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((...args) => ({ path: args.join("/") })),
  getDoc: (...args) => getDocMock(...args),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: (...args) => httpsCallableMock(...args),
}));

describe("usageLimitService", () => {
  beforeEach(() => {
    vi.resetModules();
    getDocMock.mockReset();
    httpsCallableMock.mockReset();
    const store = {};
    vi.stubGlobal("localStorage", {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => {
        store[k] = v;
      },
      removeItem: (k) => {
        delete store[k];
      },
    });
    localStorage.removeItem("tusoskopUsage");
  });

  async function loadService() {
    return import("./usageLimitService.js");
  }

  it("getRemainingFreeUsage premium kullanıcıda unlimited döner", async () => {
    const { getRemainingFreeUsage } = await loadService();
    const future = new Date(Date.now() + 86400000 * 30);
    const usage = await getRemainingFreeUsage(null, {
      plan: "plus",
      premiumStatus: "active",
      premiumUntil: future,
    });
    expect(usage.unlimited).toBe(true);
  });

  it("lifetimePremium kullanıcıda unlimited döner", async () => {
    const { getRemainingFreeUsage } = await loadService();
    const usage = await getRemainingFreeUsage(null, { lifetimePremium: true });
    expect(usage.unlimited).toBe(true);
  });

  it("premiumUntil geçmiş kullanıcı free remaining döner", async () => {
    const { getRemainingFreeUsage } = await loadService();
    const past = new Date(Date.now() - 86400000);
    const usage = await getRemainingFreeUsage(null, {
      plan: "plus",
      premiumStatus: "active",
      premiumUntil: past,
    });
    expect(usage.unlimited).toBe(false);
    expect(usage.questionRemaining).toBe(FREE_LIMITS.dailyQuestions);
  });

  it("incrementQuestionUsage premium için no-op", async () => {
    const { incrementQuestionUsage } = await loadService();
    const result = await incrementQuestionUsage(null, { lifetimePremium: true }, 1);
    expect(result).toBeNull();
    expect(httpsCallableMock).not.toHaveBeenCalled();
  });

  it("incrementTopicTestUsage callable hatasında işlemi kapatır", async () => {
    const callable = vi.fn().mockRejectedValue(new Error("network"));
    httpsCallableMock.mockReturnValue(callable);

    const { incrementTopicTestUsage, getRemainingFreeUsage } = await loadService();
    await expect(incrementTopicTestUsage(null, null)).rejects.toMatchObject({
      code: "usage_counter_unavailable",
    });
    const after = await getRemainingFreeUsage(null, null);
    expect(after.topicTestRemaining).toBe(FREE_LIMITS.dailyTopicTests);
  });

  it("incrementFullExamUsage callable hatasında işlemi kapatır", async () => {
    const callable = vi.fn().mockRejectedValue(new Error("network"));
    httpsCallableMock.mockReturnValue(callable);

    const { incrementFullExamUsage } = await loadService();
    await expect(incrementFullExamUsage(null, null)).rejects.toMatchObject({
      code: "usage_counter_unavailable",
    });
  });

  it("incrementQuestionUsage callable hatasında işlemi kapatır", async () => {
    const callable = vi.fn().mockRejectedValue(new Error("network"));
    httpsCallableMock.mockReturnValue(callable);

    const { incrementQuestionUsage } = await loadService();
    await expect(incrementQuestionUsage(null, null, 1)).rejects.toMatchObject({
      code: "usage_counter_unavailable",
    });
  });

  it("canStartReview premium için allowed", async () => {
    const { canStartReview } = await loadService();
    const gate = await canStartReview(null, { lifetimePremium: true }, 5);
    expect(gate.allowed).toBe(true);
  });
});
