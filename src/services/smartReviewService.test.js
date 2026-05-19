import { beforeEach, describe, expect, it, vi } from "vitest";

const firestoreMocks = vi.hoisted(() => ({
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: firestoreMocks.getDocs,
  setDoc: firestoreMocks.setDoc,
  deleteDoc: firestoreMocks.deleteDoc,
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
    firestoreMocks.getDocs.mockReset();
    firestoreMocks.setDoc.mockReset();
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
