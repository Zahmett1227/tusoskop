import { describe, expect, it } from "vitest";
import { EXAM_SETS, TEKRAR_DENEMESI_1_EXAM_ID } from "./exams";
import { TEKRAR_DENEMESI_1_QUESTION_IDS } from "./tekrarDenemesi1QuestionIds";
import { buildFullExam } from "../utils/examUtils";

describe("Tekrar Denemesi 1 fixed exam", () => {
  const fixedExam = EXAM_SETS.find((e) => e.id === TEKRAR_DENEMESI_1_EXAM_ID);

  it("exam definition includes 200 unique questionIds", () => {
    expect(fixedExam?.questionIds).toBe(TEKRAR_DENEMESI_1_QUESTION_IDS);
    expect(TEKRAR_DENEMESI_1_QUESTION_IDS).toHaveLength(200);
    expect(new Set(TEKRAR_DENEMESI_1_QUESTION_IDS).size).toBe(200);
  });

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
