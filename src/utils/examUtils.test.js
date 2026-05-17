import { describe, it, expect } from "vitest";
import {
  scaleBlueprintToTotal,
  groupByTopic,
  getExamAnswerAtIndex,
  getSelectedAnswerIndex,
  analyzeExamResults,
} from "./examUtils";
import { TEKRAR_DENEMESI_1_QUESTION_IDS } from "../data/tekrarDenemesi1QuestionIds";

describe("scaleBlueprintToTotal", () => {
  it("ölçekler ve toplam kotayı hedef sayıya yaklaştırır", () => {
    const bp = { A: 10, B: 10 };
    const scaled = scaleBlueprintToTotal(bp, 20);
    const sum = Object.values(scaled).reduce((a, b) => a + b, 0);
    expect(sum).toBe(20);
  });

  it("sıfır hedefte boş nesne döner", () => {
    expect(scaleBlueprintToTotal({ A: 5 }, 0)).toEqual({});
  });
});

describe("getExamAnswerAtIndex", () => {
  it("does not leak answer when question.id equals another row index (179 vs 183 bug)", () => {
    const answers = { 178: 0 };
    expect(getExamAnswerAtIndex(answers, 182)).toBeUndefined();
    expect(getExamAnswerAtIndex(answers, 178)).toBe(0);
  });

  it("never reads via question.id (id fallback removed)", () => {
    const answers = { 1: 0 };
    expect(getSelectedAnswerIndex(answers, { id: 1 }, 13)).toBeUndefined();
    expect(getSelectedAnswerIndex(answers, { id: 13 }, 25)).toBeUndefined();

    const answersQ14 = { 13: 2 };
    expect(getSelectedAnswerIndex(answersQ14, { id: 13 }, 25)).toBeUndefined();
    expect(getExamAnswerAtIndex(answersQ14, 13)).toBe(2);
  });

  it("Tekrar Denemesi 1: Q2 / Q14 / Q26 zinciri birbirine bulaşmaz", () => {
    const ids = TEKRAR_DENEMESI_1_QUESTION_IDS;
    const q2 = { id: ids[1] };
    const q14 = { id: ids[13] };
    const q26 = { id: ids[25] };

    const afterQ2 = { 1: 0 };
    expect(getSelectedAnswerIndex(afterQ2, q14, 13)).toBeUndefined();
    expect(getSelectedAnswerIndex(afterQ2, q26, 25)).toBeUndefined();

    const afterQ14 = { 13: 1 };
    expect(getSelectedAnswerIndex(afterQ14, q2, 1)).toBeUndefined();
    expect(getSelectedAnswerIndex(afterQ14, q26, 25)).toBeUndefined();

    const afterQ26 = { 25: 2 };
    expect(getSelectedAnswerIndex(afterQ26, q2, 1)).toBeUndefined();
    expect(getSelectedAnswerIndex(afterQ26, q14, 13)).toBeUndefined();
  });
});

describe("analyzeExamResults with index-keyed answers", () => {
  it("scores each slot independently", () => {
    const questions = [
      { id: 182, ders: "Küçük Stajlar", konu: "A", correct: 0, options: ["a", "b"] },
      { id: 186, ders: "Dahiliye", konu: "B", correct: 1, options: ["a", "b"] },
    ];
    const answers = { 0: 0, 1: 0 };
    const result = analyzeExamResults(questions, answers);
    expect(result.summary.correct).toBe(1);
    expect(result.summary.wrong).toBe(1);
  });
});

describe("groupByTopic", () => {
  it("konu anahtarlarına göre gruplar", () => {
    const grouped = groupByTopic([
      { id: 1, konu: "X" },
      { id: 2, konu: "Y" },
      { id: 3, konu: "X" },
    ]);
    expect(Object.keys(grouped).sort()).toEqual(["X", "Y"]);
    expect(grouped.X.length).toBe(2);
  });
});
