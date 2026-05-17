import { describe, it, expect, beforeEach, vi } from "vitest";
import { EXAM_SETS, TEKRAR_DENEMESI_1_EXAM_ID, TEKRAR_DENEMESI_1_SET_VERSION } from "../data/exams";
import { TEKRAR_DENEMESI_1_QUESTION_IDS } from "../data/tekrarDenemesi1QuestionIds";
import {
  TUSOSKOP_EXAM_HISTORY_KEY,
  buildExamResultMetadata,
  getResultSetVersion,
  loadLocalExamHistory,
  loadNormalizedLocalExamHistory,
  normalizeFirestoreResultDoc,
  normalizeLocalExamEntry,
  safeNormalizeLocalExamEntry,
} from "./examHistoryUtils";

describe("buildExamResultMetadata", () => {
  const fixedExam = EXAM_SETS.find((e) => e.id === TEKRAR_DENEMESI_1_EXAM_ID);
  const dynamicExam = { id: 99, title: "Örnek Dinamik", questionCount: 200 };

  it("Tekrar Denemesi 1 tanımında setVersion var", () => {
    expect(fixedExam?.setVersion).toBe(TEKRAR_DENEMESI_1_SET_VERSION);
    expect(fixedExam?.fixedSet).toBe(true);
  });

  it("sabit deneme meta: setVersion ve 200 id snapshot", () => {
    const meta = buildExamResultMetadata(fixedExam);
    expect(meta.fixedSet).toBe(true);
    expect(meta.setVersion).toBe(TEKRAR_DENEMESI_1_SET_VERSION);
    expect(meta.examId).toBe(TEKRAR_DENEMESI_1_EXAM_ID);
    expect(meta.questionIdsSnapshot).toHaveLength(200);
    expect(meta.questionIdsSnapshot).toEqual(TEKRAR_DENEMESI_1_QUESTION_IDS);
  });

  it("dinamik denemede setVersion zorunlu değil", () => {
    const meta = buildExamResultMetadata(dynamicExam);
    expect(meta.fixedSet).toBe(false);
    expect(meta.setVersion).toBeUndefined();
    expect(meta.questionIdsSnapshot).toBeUndefined();
  });

  it("eski result setVersion yoksa unknown", () => {
    expect(getResultSetVersion({})).toBe("unknown");
    expect(getResultSetVersion({ examTitle: "X" })).toBe("unknown");
    expect(getResultSetVersion({ setVersion: "2026-05-v1" })).toBe("2026-05-v1");
  });
});

describe("normalize exam history (version fallback)", () => {
  it("Firestore eski kayıt setVersion olmadan patlamaz", () => {
    const row = normalizeFirestoreResultDoc({
      id: "abc",
      data: () => ({
        examTitle: "Eski",
        completedAt: "2024-01-01T00:00:00.000Z",
        tusNet: 80,
        stats: { correct: 80, wrong: 0, empty: 120 },
      }),
    });
    expect(row.setVersion).toBe("unknown");
    expect(row.fixedSet).toBe(false);
    expect(row.questionIdsSnapshot).toBeUndefined();
  });

  it("local eski kayıt setVersion olmadan patlamaz", () => {
    const row = normalizeLocalExamEntry({ examTitle: "Eski", tusNet: 70 }, 0);
    expect(row.setVersion).toBe("unknown");
    expect(calculateTusNetSafe(row)).toBe(70);
  });
});

function calculateTusNetSafe(exam) {
  const n = exam.tusNet ?? exam.totalNet;
  return Number(n);
}

describe("loadLocalExamHistory", () => {
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

  it("bozuk JSON patlatmaz, boş dizi döner", () => {
    localStorage.setItem(TUSOSKOP_EXAM_HISTORY_KEY, "{bad json");
    expect(loadLocalExamHistory()).toEqual([]);
  });

  it("array olmayan veri boş dizi döner", () => {
    localStorage.setItem(TUSOSKOP_EXAM_HISTORY_KEY, JSON.stringify({ x: 1 }));
    expect(loadLocalExamHistory()).toEqual([]);
  });

  it("geçersiz kayıt atlanır, geçerli kayıt korunur", () => {
    localStorage.setItem(
      TUSOSKOP_EXAM_HISTORY_KEY,
      JSON.stringify([
        { examTitle: "İyi", tusNet: 80, totalCorrect: 80, totalWrong: 0, totalBlank: 120 },
        null,
        "not-an-object",
        { tusNet: 50 },
      ])
    );
    const rows = loadNormalizedLocalExamHistory();
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.every((r) => r.setVersion)).toBe(true);
    expect(rows[0].examTitle).toBe("İyi");
    expect(safeNormalizeLocalExamEntry(null, 0)).toBeNull();
  });

  it("setVersion olmayan kayıt unknown ile normalize edilir", () => {
    const row = safeNormalizeLocalExamEntry({ examTitle: "Eski", tusNet: 60 }, 0);
    expect(row?.setVersion).toBe("unknown");
    expect(row?.fixedSet).toBe(false);
    expect(row?.questionIdsSnapshot).toBeUndefined();
  });
});
