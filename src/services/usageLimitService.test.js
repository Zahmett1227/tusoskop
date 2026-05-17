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

  it("incrementTopicTestUsage yalnızca bir kez artar (local fallback)", async () => {
    const callable = vi.fn().mockRejectedValue(new Error("network"));
    httpsCallableMock.mockReturnValue(callable);

    const { incrementTopicTestUsage, getRemainingFreeUsage } = await loadService();
    await incrementTopicTestUsage(null, null);
    await incrementTopicTestUsage(null, null);
    const after = await getRemainingFreeUsage(null, null);
    expect(after.topicTestRemaining).toBe(0);

    await expect(incrementTopicTestUsage(null, null)).rejects.toMatchObject({
      code: "daily_topic_test_limit",
    });
    const exhausted = await getRemainingFreeUsage(null, null);
    expect(exhausted.topicTestRemaining).toBe(0);
  });

  it("incrementFullExamUsage limit dolunca UsageLimitError fırlatır", async () => {
    const callable = vi.fn().mockRejectedValue(new Error("network"));
    httpsCallableMock.mockReturnValue(callable);

    const { incrementFullExamUsage } = await loadService();
    await incrementFullExamUsage(null, null);
    await expect(incrementFullExamUsage(null, null)).rejects.toMatchObject({
      code: "monthly_exam_limit",
    });
  });

  it("canStartReview premium için allowed", async () => {
    const { canStartReview } = await loadService();
    const gate = await canStartReview(null, { lifetimePremium: true }, 5);
    expect(gate.allowed).toBe(true);
  });
});
