import { describe, expect, it } from "vitest";
import { SUBJECTS } from "./subjects";
import { EXAM_SETS, TEKRAR_DENEMESI_1_EXAM_ID } from "./exams";
import { TEKRAR_DENEMESI_1_QUESTION_IDS } from "./tekrarDenemesi1QuestionIds";
import { loadAllQuestions } from "./questions";
import { getFixedExamQuestions, buildFullExam } from "../utils/examUtils";

const TEMEL = new Set(SUBJECTS.filter((s) => s.type === "Temel").map((s) => s.name));
const KLINIK = new Set(SUBJECTS.filter((s) => s.type === "Klinik").map((s) => s.name));

describe("Tekrar Denemesi 1 fixed exam", () => {
  const fixedExam = EXAM_SETS.find((e) => e.id === TEKRAR_DENEMESI_1_EXAM_ID);

  it("exam definition includes 200 unique questionIds", () => {
    expect(fixedExam?.questionIds).toBe(TEKRAR_DENEMESI_1_QUESTION_IDS);
    expect(TEKRAR_DENEMESI_1_QUESTION_IDS).toHaveLength(200);
    expect(new Set(TEKRAR_DENEMESI_1_QUESTION_IDS).size).toBe(200);
  });

  it("questionIds exist in bank and order is preserved", async () => {
    const all = await loadAllQuestions();
    const byId = new Map(all.map((q) => [Number(q.id), q]));
    const ordered = getFixedExamQuestions(TEKRAR_DENEMESI_1_QUESTION_IDS, all);

    expect(ordered).toHaveLength(200);
    ordered.forEach((q, index) => {
      expect(q.id).toBe(TEKRAR_DENEMESI_1_QUESTION_IDS[index]);
      expect(byId.has(q.id)).toBe(true);
    });
  }, 60_000);

  it("first 100 are Temel, last 100 are Klinik", async () => {
    const all = await loadAllQuestions();
    const ordered = getFixedExamQuestions(TEKRAR_DENEMESI_1_QUESTION_IDS, all);

    ordered.slice(0, 100).forEach((q) => {
      expect(TEMEL.has(q.ders)).toBe(true);
    });
    ordered.slice(100, 200).forEach((q) => {
      expect(KLINIK.has(q.ders)).toBe(true);
    });
  }, 60_000);

  it("dynamic exams without questionIds still use blueprint path", () => {
    const sample = [
      { id: 1, ders: "Fizyoloji", konu: "A", correct: 0 },
      { id: 2, ders: "Fizyoloji", konu: "B", correct: 0 },
      { id: 3, ders: "Dahiliye", konu: "C", correct: 0 },
    ];
    const built = buildFullExam(sample, { Fizyoloji: 1, Dahiliye: 1 });
    expect(built.length).toBe(2);
  });
});
