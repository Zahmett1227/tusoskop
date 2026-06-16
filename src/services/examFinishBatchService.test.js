import { beforeEach, describe, expect, it, vi } from "vitest";

const firestoreMocks = vi.hoisted(() => ({
  getDoc: vi.fn(),
  runTransaction: vi.fn(),
  writeBatch: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn((_db, ...parts) => ({ path: parts.join("/") })),
  getDoc: firestoreMocks.getDoc,
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  deleteDoc: vi.fn(),
  increment: vi.fn((value) => ({ __increment: value })),
  runTransaction: firestoreMocks.runTransaction,
  serverTimestamp: vi.fn(() => ({ __serverTimestamp: true })),
  setDoc: vi.fn(),
  writeBatch: firestoreMocks.writeBatch,
}));

const authMock = vi.hoisted(() => ({ currentUser: { uid: "u1" } }));

vi.mock("../firebase", () => ({
  db: {},
  auth: authMock,
}));

vi.mock("../lib/clarity", () => ({
  trackClarityEvent: vi.fn(),
}));

const storage = {};

describe("examFinishBatchService", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.currentUser = { uid: "u1" };
    firestoreMocks.getDoc.mockReset();
    firestoreMocks.runTransaction.mockReset();
    firestoreMocks.writeBatch.mockReset();
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });
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

  const q = (id, correct = 0) => ({
    id,
    ders: "Patoloji",
    konu: "Tümör",
    correct,
    options: ["A", "B", "C", "D", "E"],
  });

  it("3 yanlış için 6 batch write hazırlar (3 wrong + 3 smartReview)", async () => {
    const { buildExamFinishBatchWrites } = await import("./examFinishBatchService.js");
    const items = [
      { question: q(1), questionId: 1, userAnswer: 2, examIndex: 0 },
      { question: q(2), questionId: 2, userAnswer: 3, examIndex: 1 },
      { question: q(3), questionId: 3, userAnswer: 4, examIndex: 2 },
    ];
    const { writes } = buildExamFinishBatchWrites("u1", items, new Map(), [], new Date("2026-05-20T12:00:00Z"));
    expect(writes).toHaveLength(6);
    expect(writes.filter((w) => w.kind === "wrong")).toHaveLength(3);
    expect(writes.filter((w) => w.kind === "smartReview")).toHaveLength(3);
  });

  it("aynı questionId iki kez gelirse duplicate write oluşturmaz", async () => {
    const { buildExamFinishBatchWrites } = await import("./examFinishBatchService.js");
    const items = [
      { question: q(42), questionId: 42, userAnswer: 1, examIndex: 0 },
      { question: q(42), questionId: 42, userAnswer: 2, examIndex: 99 },
    ];
    const { writes } = buildExamFinishBatchWrites("u1", items, new Map(), [], new Date("2026-05-20T12:00:00Z"));
    expect(writes).toHaveLength(2);
    expect(writes.every((w) => w.docId === "42")).toBe(true);
    expect(writes.some((w) => w.docId === "99")).toBe(false);
    expect(writes.some((w) => w.docId === "0")).toBe(false);
  });

  it("document id question.id olur, examIndex doc id olmaz", async () => {
    const { buildExamFinishBatchWrites } = await import("./examFinishBatchService.js");
    const items = [{ question: q(179), questionId: 179, userAnswer: 2, examIndex: 183 }];
    const { writes } = buildExamFinishBatchWrites("u1", items, new Map(), [], new Date("2026-05-20T12:00:00Z"));
    expect(writes).toHaveLength(2);
    expect(writes.every((w) => w.docId === "179")).toBe(true);
    expect(writes.every((w) => String(w.ref.path).includes("/179"))).toBe(true);
    expect(writes.some((w) => String(w.ref.path).includes("/183"))).toBe(false);
  });

  it("smart review payload difficulty/stability/dueAt alanlarını korur", async () => {
    const { buildExamFinishBatchWrites } = await import("./examFinishBatchService.js");
    const now = new Date("2026-05-20T12:00:00Z");
    const { writes } = buildExamFinishBatchWrites(
      "u1",
      [{ question: q(7), questionId: 7, userAnswer: 1, examIndex: 0 }],
      new Map(),
      [],
      now
    );
    const smart = writes.find((w) => w.kind === "smartReview");
    expect(smart).toBeTruthy();
    expect(smart.data).toMatchObject({
      questionId: 7,
      difficulty: 5,
      stability: 1,
      lapseCount: 1,
      lastGrade: "again",
    });
    expect(typeof smart.data.dueAt).toBe("string");
    expect(smart.data.dueAt.length).toBeGreaterThan(0);
  });

  it("saveExamWrongAndSmartReviewsBatch Firestore batch commit kullanır", async () => {
    const commit = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn();
    firestoreMocks.writeBatch.mockReturnValue({ set, commit });

    const { saveExamWrongAndSmartReviewsBatch } = await import("./examFinishBatchService.js");
    const result = await saveExamWrongAndSmartReviewsBatch(
      { uid: "u1" },
      [{ question: q(10), questionId: 10, userAnswer: 2, examIndex: 0 }],
      null,
      new Date("2026-05-20T12:00:00Z")
    );

    expect(result.writeCount).toBe(2);
    expect(firestoreMocks.writeBatch).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledTimes(2);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(result.firestoreOk).toBe(true);
  });

  it("batch commit başarısız olursa yerel kayıt korunur", async () => {
    firestoreMocks.writeBatch.mockReturnValue({
      set: vi.fn(),
      commit: vi.fn().mockRejectedValue(new Error("offline")),
    });

    const { saveExamWrongAndSmartReviewsBatch } = await import("./examFinishBatchService.js");
    const result = await saveExamWrongAndSmartReviewsBatch(
      { uid: "u1" },
      [{ question: q(11), questionId: 11, userAnswer: 3, examIndex: 1 }],
      null,
      new Date("2026-05-20T12:00:00Z")
    );

    expect(result.ok).toBe(true);
    expect(result.localFallback).toBe(true);
    const wrongLocal = JSON.parse(storage.tusoskopWrongQuestions || "[]");
    const smartLocal = JSON.parse(storage.tusoskopSmartReviews || "[]");
    expect(wrongLocal.some((x) => x.questionId === 11)).toBe(true);
    expect(smartLocal.some((x) => x.questionId === 11)).toBe(true);
  });
});
