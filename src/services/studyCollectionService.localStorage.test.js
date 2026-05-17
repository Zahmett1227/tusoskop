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
});
