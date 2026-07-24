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

  it("incrementQuestionUsage gerçekten geçici (functions/unavailable) hatada izin verir", async () => {
    const transientErr = Object.assign(new Error("unavailable"), {
      code: "functions/unavailable",
    });
    const callable = vi.fn().mockRejectedValue(transientErr);
    httpsCallableMock.mockReturnValue(callable);

    const { incrementQuestionUsage } = await loadService();
    // Açık altyapı/timeout kodu geçici sayılır; kullanıcı bloke edilmez
    await expect(incrementQuestionUsage(null, null, 1)).resolves.toBeNull();
  });

  it("incrementQuestionUsage kodsuz ağ/CORS hatasında bloklar (fail-closed)", async () => {
    const callable = vi.fn().mockRejectedValue(new Error("network"));
    httpsCallableMock.mockReturnValue(callable);

    const { incrementQuestionUsage } = await loadService();
    // Kodsuz hata (CORS/platform reddi) artık geçici sayılmaz → sayaç
    // doğrulanamadığı için işleme izin verilmez
    await expect(incrementQuestionUsage(null, null, 1)).rejects.toMatchObject({
      code: "usage_counter_unavailable",
    });
  });

  it("incrementTopicTestUsage kodsuz ağ/CORS hatasında bloklar (fail-closed)", async () => {
    const callable = vi.fn().mockRejectedValue(new Error("network"));
    httpsCallableMock.mockReturnValue(callable);

    const { incrementTopicTestUsage } = await loadService();
    await expect(incrementTopicTestUsage(null, null)).rejects.toMatchObject({
      code: "usage_counter_unavailable",
    });
  });

  it("incrementFullExamUsage kodsuz ağ/CORS hatasında bloklar (fail-closed)", async () => {
    const callable = vi.fn().mockRejectedValue(new Error("network"));
    httpsCallableMock.mockReturnValue(callable);

    const { incrementFullExamUsage } = await loadService();
    await expect(incrementFullExamUsage(null, null)).rejects.toMatchObject({
      code: "usage_counter_unavailable",
    });
  });

  it("incrementQuestionUsage kalıcı (auth) hatada bloklamaya devam eder", async () => {
    const authErr = Object.assign(new Error("permission"), {
      code: "functions/permission-denied",
    });
    const callable = vi.fn().mockRejectedValue(authErr);
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

  it("bumpLocalUsage: callable olmadan bile limit yerel uygulanır (fail-safe)", async () => {
    const { bumpLocalUsage, canAnswerQuestion } = await loadService();
    // Sunucu callable'ı hiç çağrılmadan limite kadar yerel say (kesinti senaryosu).
    for (let i = 0; i < FREE_LIMITS.dailyQuestions; i += 1) {
      bumpLocalUsage(null, null, "question", 1);
    }
    const gate = await canAnswerQuestion(null, null);
    expect(gate.allowed).toBe(false);
    expect(httpsCallableMock).not.toHaveBeenCalled();
  });

  it("bumpLocalUsage premium için no-op", async () => {
    const { bumpLocalUsage, canAnswerQuestion } = await loadService();
    for (let i = 0; i < FREE_LIMITS.dailyQuestions + 5; i += 1) {
      bumpLocalUsage(null, { lifetimePremium: true }, "question", 1);
    }
    const gate = await canAnswerQuestion(null, { lifetimePremium: true });
    expect(gate.allowed).toBe(true);
  });
});
