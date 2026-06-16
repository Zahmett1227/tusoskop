import { beforeEach, describe, expect, it, vi } from "vitest";

const firestoreMocks = vi.hoisted(() => ({
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  runTransaction: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: firestoreMocks.getDoc,
  getDocs: firestoreMocks.getDocs,
  setDoc: firestoreMocks.setDoc,
  deleteDoc: firestoreMocks.deleteDoc,
  increment: vi.fn((value) => ({ __increment: value })),
  runTransaction: firestoreMocks.runTransaction,
  serverTimestamp: vi.fn(() => ({ __serverTimestamp: true })),
}));

const authMock = vi.hoisted(() => ({ currentUser: null }));

vi.mock("../firebase", () => ({
  db: {},
  auth: authMock,
}));

const storage = {};

describe("smartReviewService", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.currentUser = null;
    firestoreMocks.getDoc.mockReset();
    firestoreMocks.getDocs.mockReset();
    firestoreMocks.setDoc.mockReset();
    firestoreMocks.runTransaction.mockReset();
    firestoreMocks.runTransaction.mockImplementation(async (_db, callback) =>
      callback({
        get: vi.fn(async () => ({ exists: () => false })),
        set: vi.fn(),
      })
    );
    Object.keys(storage).forEach((k) => delete storage[k]);
    vi.stubGlobal("localStorage", {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => {
        storage[key] = value;
      },
      removeItem: (key) => {
        delete storage[key];
      },
    });
  });

  it("localStorage bozuk JSON patlatmaz", async () => {
    storage.tusoskopSmartReviews = "{bad";
    const { getSmartReviews } = await import("./smartReviewService.js");
    firestoreMocks.getDocs.mockRejectedValue(new Error("offline"));
    const list = await getSmartReviews(null);
    expect(Array.isArray(list)).toBe(true);
  });

  it("boş Firestore yanıtı yerel smart review kayıtlarını silmez", async () => {
    const { upsertSmartReview, getSmartReviews } = await import("./smartReviewService.js");
    authMock.currentUser = { uid: "u1" };
    const question = { id: 99, ders: "Patoloji", konu: "Tümör" };
    firestoreMocks.getDocs.mockResolvedValue({ docs: [] });
    firestoreMocks.setDoc.mockResolvedValue(undefined);
    await upsertSmartReview({ uid: "u1" }, question, "wrong");
    firestoreMocks.getDocs.mockResolvedValue({ docs: [] });
    const list = await getSmartReviews({ uid: "u1" });
    expect(list.some((x) => x.questionId === 99)).toBe(true);
  });

  it("aynı questionId iki kez upsert edilince duplicate olmaz", async () => {
    const { upsertSmartReview, getSmartReviews } = await import("./smartReviewService.js");
    firestoreMocks.getDocs.mockResolvedValue({ docs: [] });
    firestoreMocks.setDoc.mockResolvedValue(undefined);
    const question = { id: 42, ders: "A", konu: "B" };
    await upsertSmartReview(null, question, "wrong");
    await upsertSmartReview(null, question, "wrong", "again");
    const list = await getSmartReviews(null);
    expect(list.filter((x) => x.questionId === 42)).toHaveLength(1);
  });

  it("missing questionId review başlatmada atlanır", async () => {
    const { resolveQuestionsFromReviews } = await import("./smartReviewService.js");
    const questions = [{ id: 1, ders: "A", konu: "B" }];
    const resolved = resolveQuestionsFromReviews(
      [{ questionId: 1 }, { questionId: 999 }],
      questions
    );
    expect(resolved).toHaveLength(1);
    expect(resolved[0].id).toBe(1);
  });

  it("dueCount doğru hesaplanır", async () => {
    const { getSmartReviewSummary } = await import("./smartReviewService.js");
    authMock.currentUser = { uid: "u1" };
    const now = new Date("2026-05-17T12:00:00.000Z");
    const past = new Date("2026-05-15T12:00:00.000Z").toISOString();
    const future = new Date("2026-05-20T12:00:00.000Z").toISOString();
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        { id: "1", data: () => ({ questionId: 1, dueAt: past, stability: 1, ders: "A", konu: "x" }) },
        { id: "2", data: () => ({ questionId: 2, dueAt: future, stability: 1, ders: "B", konu: "y" }) },
      ],
    });
    const summary = await getSmartReviewSummary({ uid: "u1" }, now);
    expect(summary.dueCount).toBe(1);
    expect(summary.totalCount).toBe(2);
  });

  it("ensureSmartReviewsForFavorites mevcut kart varsa setDoc çağırmaz", async () => {
    const { ensureSmartReviewsForFavorites } = await import("./smartReviewService.js");
    authMock.currentUser = { uid: "u1" };
    const question = { id: 55, ders: "Fizyoloji", konu: "Test" };
    // Kart zaten var
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        { id: "55", data: () => ({ questionId: 55, dueAt: new Date(Date.now() + 86400000 * 2).toISOString(), stability: 2, ders: "Fizyoloji", konu: "Test" }) },
      ],
    });
    firestoreMocks.setDoc.mockResolvedValue(undefined);
    const created = await ensureSmartReviewsForFavorites({ uid: "u1" }, [question]);
    expect(created).toHaveLength(0);
    expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
  });

  it("ensureSmartReviewsForFavorites kart yoksa source:favorite ile oluşturur", async () => {
    const { ensureSmartReviewsForFavorites } = await import("./smartReviewService.js");
    authMock.currentUser = { uid: "u1" };
    const question = { id: 77, ders: "Patoloji", konu: "Neoplazi" };
    firestoreMocks.getDocs.mockResolvedValue({ docs: [] });
    firestoreMocks.setDoc.mockResolvedValue(undefined);
    const created = await ensureSmartReviewsForFavorites({ uid: "u1" }, [question]);
    expect(created).toHaveLength(1);
    expect(created[0].source).toBe("favorite");
    expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1);
  });

  it("topSubjects her ders için en yoğun konuyu içerir", async () => {
    const { getSmartReviewSummary } = await import("./smartReviewService.js");
    authMock.currentUser = { uid: "u1" };
    const now = new Date("2026-05-17T12:00:00.000Z");
    const past = new Date("2026-05-15T12:00:00.000Z").toISOString();
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        {
          id: "1",
          data: () => ({ questionId: 1, dueAt: past, stability: 1, ders: "Pediatri", konu: "Yenidoğan" }),
        },
        {
          id: "2",
          data: () => ({ questionId: 2, dueAt: past, stability: 1, ders: "Pediatri", konu: "Yenidoğan" }),
        },
        {
          id: "3",
          data: () => ({ questionId: 3, dueAt: past, stability: 1, ders: "Pediatri", konu: "Aşılar" }),
        },
      ],
    });
    const summary = await getSmartReviewSummary({ uid: "u1" }, now);
    expect(summary.dueCount).toBe(3);
    expect(summary.topSubjects[0]).toMatchObject({
      name: "Pediatri",
      count: 3,
      topTopic: "Yenidoğan",
    });
  });
});
