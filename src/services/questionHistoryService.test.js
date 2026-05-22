import { beforeEach, describe, expect, it, vi } from "vitest";

const firestoreMocks = vi.hoisted(() => ({
  getDocs: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn((_db, ...parts) => ({ path: parts.join("/") })),
  getDocs: firestoreMocks.getDocs,
  setDoc: firestoreMocks.setDoc,
}));

const authMock = vi.hoisted(() => ({ currentUser: null }));

vi.mock("../firebase", () => ({
  db: {},
  auth: authMock,
}));

const storage = {};

describe("questionHistoryService", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.currentUser = null;
    firestoreMocks.getDocs.mockReset();
    firestoreMocks.setDoc.mockReset();
    firestoreMocks.getDocs.mockResolvedValue({ docs: [] });
    firestoreMocks.setDoc.mockResolvedValue(undefined);
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

  const q = (id) => ({
    id,
    ders: "Patoloji",
    konu: "Tümör",
    correct: 1,
    options: ["A", "B", "C", "D", "E"],
  });

  it("login yoksa local fallback çalışır", async () => {
    const { recordQuestionHistory, loadQuestionHistoryForTracker } = await import(
      "./questionHistoryService.js"
    );
    await recordQuestionHistory(null, { question: q(7), selectedOption: 0, source: "topic" });
    const { map, source } = await loadQuestionHistoryForTracker(null);
    expect(map[7]).toBeTruthy();
    expect(source).toBe("local");
    expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
  });

  it("Firestore yazımı question.id ile yapılır", async () => {
    authMock.currentUser = { uid: "u1" };
    const { recordQuestionHistory } = await import("./questionHistoryService.js");
    await recordQuestionHistory({ uid: "u1" }, { question: q(99), selectedOption: 2, source: "study" });
    expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1);
    const payload = firestoreMocks.setDoc.mock.calls[0][1];
    expect(payload.questionId).toBe(99);
    expect(String(firestoreMocks.setDoc.mock.calls[0][0].path)).toContain("/questionHistory/99");
  });

  it("loadQuestionHistoryForTracker Firestore verisi varsa cloud kaynağı döner", async () => {
    authMock.currentUser = { uid: "u1" };
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        {
          id: "55",
          data: () => ({
            questionId: 55,
            ders: "A",
            konu: "B",
            firstSolvedAt: "2026-05-01T00:00:00.000Z",
            lastSolvedAt: "2026-05-02T00:00:00.000Z",
            solvedCount: 1,
            correctCount: 1,
            wrongCount: 0,
            lastCorrect: true,
            lastAnswer: 0,
            source: "topic",
            updatedAt: "2026-05-02T00:00:00.000Z",
            schemaVersion: 1,
          }),
        },
      ],
    });
    const { loadQuestionHistoryForTracker } = await import("./questionHistoryService.js");
    const { map, source } = await loadQuestionHistoryForTracker({ uid: "u1" });
    expect(source).toBe("cloud");
    expect(map[55]).toBeTruthy();
  });
});
