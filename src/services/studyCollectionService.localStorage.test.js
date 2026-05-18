import { describe, it, expect, beforeEach, vi } from "vitest";

const WRONG_KEY = "tusoskopWrongQuestions";
const FAVORITE_KEY = "tusoskopFavoriteQuestions";

async function readWrongFromLocal(userData = null) {
  const { getWrongQuestions } = await import("./studyCollectionService.js");
  return getWrongQuestions(null, userData);
}

async function readFavoritesFromLocal() {
  const { getFavoriteQuestions } = await import("./studyCollectionService.js");
  return getFavoriteQuestions(null);
}

describe("studyCollectionService local fallback", () => {
  beforeEach(() => {
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
  });

  it("bozuk yanlış JSON patlatmaz", async () => {
    localStorage.setItem(WRONG_KEY, "{bad");
    await expect(readWrongFromLocal()).resolves.toEqual([]);
  });

  it("array olmayan yanlış veri patlatmaz", async () => {
    localStorage.setItem(WRONG_KEY, JSON.stringify({ a: 1 }));
    await expect(readWrongFromLocal()).resolves.toEqual([]);
  });

  it("geçersiz yanlış öğeleri filtreler", async () => {
    localStorage.setItem(
      WRONG_KEY,
      JSON.stringify([
        { questionId: 1, ders: "A", konu: "B" },
        { questionId: "x" },
        null,
      ])
    );
    const list = await readWrongFromLocal();
    expect(list).toHaveLength(1);
    expect(list[0].questionId).toBe(1);
  });

  it("bozuk favori JSON patlatmaz", async () => {
    localStorage.setItem(FAVORITE_KEY, "not-json");
    await expect(readFavoritesFromLocal()).resolves.toEqual([]);
  });

  it("aynı questionId duplicate yanlış kayıtları birleştirir", async () => {
    localStorage.setItem(
      WRONG_KEY,
      JSON.stringify([
        { questionId: 5, ders: "A", konu: "B", wrongCount: 1, lastWrongAt: "2020-01-01T00:00:00.000Z" },
        { questionId: 5, ders: "A", konu: "B", wrongCount: 3, lastWrongAt: "2026-01-01T00:00:00.000Z" },
      ])
    );
    const list = await readWrongFromLocal();
    expect(list).toHaveLength(1);
    expect(list[0].questionId).toBe(5);
    expect(list[0].wrongCount).toBe(3);
  });

  it("aynı questionId duplicate favori kayıtları birleştirir", async () => {
    localStorage.setItem(
      FAVORITE_KEY,
      JSON.stringify([
        { questionId: 9, ders: "A", konu: "B", addedAt: "2020-01-01T00:00:00.000Z" },
        { questionId: 9, ders: "A", konu: "B", addedAt: "2026-01-01T00:00:00.000Z" },
      ])
    );
    const list = await readFavoritesFromLocal();
    expect(list).toHaveLength(1);
    expect(list[0].questionId).toBe(9);
    expect(list[0].addedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("addWrongQuestion question.id ile kaydeder ve tekrarda duplicate oluşturmaz", async () => {
    const { addWrongQuestion } = await import("./studyCollectionService.js");
    const question = {
      id: 42,
      ders: "Patoloji",
      konu: "Test",
      correct: 1,
      options: ["A", "B", "C", "D", "E"],
    };
    await addWrongQuestion(null, question, 2);
    await addWrongQuestion(null, question, 3);
    const list = await readWrongFromLocal();
    const row = list.find((item) => item.questionId === 42);
    expect(row).toBeTruthy();
    expect(row.wrongCount).toBe(2);
    expect(row.lastSelectedAnswer).toBe(3);
  });

  it("geçersiz şık index (examIndex sızıntısı) lastSelectedAnswer olarak saklanmaz", async () => {
    const { addWrongQuestion } = await import("./studyCollectionService.js");
    const question = {
      id: 99,
      ders: "Patoloji",
      konu: "Test",
      correct: 0,
      options: ["A", "B", "C", "D", "E"],
    };
    await addWrongQuestion(null, question, 179);
    const list = await readWrongFromLocal();
    const row = list.find((item) => item.questionId === 99);
    expect(row?.lastSelectedAnswer).toBeNull();
  });

  it("buildTodayReviewQueue bankada olmayan questionId atlar", async () => {
    const { buildTodayReviewQueue } = await import("./studyCollectionService.js");
    localStorage.setItem(
      WRONG_KEY,
      JSON.stringify([{ questionId: 999999, ders: "X", konu: "Y", wrongCount: 1 }])
    );
    const queue = await buildTodayReviewQueue(null, [{ id: 1, ders: "A", konu: "B" }]);
    expect(queue).toEqual([]);
  });
});
