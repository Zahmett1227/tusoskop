import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const firestoreMocks = vi.hoisted(() => ({
  getDocs: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: firestoreMocks.getDocs,
  deleteDoc: firestoreMocks.deleteDoc,
  setDoc: vi.fn(),
}));

vi.mock("../firebase", () => ({ db: {} }));
vi.mock("../lib/clarity", () => ({ trackClarityEvent: vi.fn() }));

const wrongDocs = Array.from({ length: 35 }, (_, i) => ({
  id: String(i + 1),
  ref: { id: String(i + 1) },
  data: () => ({ questionId: i + 1, lastWrongAt: new Date(2026, 0, i + 1).toISOString() }),
}));

describe("enforceWrongQuestionsLimitForFreeUser", () => {
  beforeEach(() => {
    firestoreMocks.getDocs.mockReset().mockResolvedValue({ docs: wrongDocs });
    firestoreMocks.deleteDoc.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete window.Capacitor;
  });

  it("web'de free kullanıcının yanlışlarını Firestore'dan silmez", async () => {
    const { enforceWrongQuestionsLimitForFreeUser } = await import("./studyCollectionService.js");
    await enforceWrongQuestionsLimitForFreeUser({ uid: "u1" }, { plan: "free" });
    expect(firestoreMocks.getDocs).not.toHaveBeenCalled();
    expect(firestoreMocks.deleteDoc).not.toHaveBeenCalled();
  });

  it("native uygulamada limit fazlasını eskisi gibi temizler", async () => {
    window.Capacitor = { isNativePlatform: () => true };
    const { enforceWrongQuestionsLimitForFreeUser } = await import("./studyCollectionService.js");
    await enforceWrongQuestionsLimitForFreeUser({ uid: "u1" }, { plan: "free" });
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledTimes(5);
  });
});
