import { describe, expect, it } from "vitest";
import { SUBJECTS } from "../data/subjects";
import { EXAM_SETS } from "../data/exams";
import { TEKRAR_DENEMESI_1_QUESTION_IDS } from "../data/tekrarDenemesi1QuestionIds";
import { loadAllQuestions } from "../data/questions";
import {
  analyzeExamResults,
  getExamAnswerAtIndex,
  getFixedExamQuestions,
  getSelectedAnswerIndex,
} from "./examUtils";
import { buildExamResultMetadata } from "./examHistoryUtils";

const TEMEL = new Set(SUBJECTS.filter((s) => s.type === "Temel").map((s) => s.name));
const KLINIK = new Set(SUBJECTS.filter((s) => s.type === "Klinik").map((s) => s.name));
const FIXED_EXAMS = EXAM_SETS.filter((e) => e.fixedSet === true);

function subjectTypeForDers(ders) {
  if (TEMEL.has(ders)) return "Temel";
  if (KLINIK.has(ders)) return "Klinik";
  return null;
}

describe("fixed exam flow regression", () => {
  describe("1. question order and Temel/Klinik split", () => {
    it.each(FIXED_EXAMS.map((e) => [e.title, e]))(
      "%s: getFixedExamQuestions preserves questionIds order",
      async (_title, exam) => {
        const all = await loadAllQuestions();
        const ordered = getFixedExamQuestions(exam.questionIds, all);
        expect(ordered).toHaveLength(200);
        ordered.forEach((q, index) => {
          expect(Number(q.id)).toBe(Number(exam.questionIds[index]));
        });
      },
      60_000
    );

    it.each(FIXED_EXAMS.map((e) => [e.title, e]))(
      "%s: first 100 Temel, last 100 Klinik",
      async (_title, exam) => {
        const all = await loadAllQuestions();
        const ordered = getFixedExamQuestions(exam.questionIds, all);
        ordered.slice(0, 100).forEach((q) => {
          expect(subjectTypeForDers(q.ders)).toBe("Temel");
        });
        ordered.slice(100, 200).forEach((q) => {
          expect(subjectTypeForDers(q.ders)).toBe("Klinik");
        });
      },
      60_000
    );
  });

  describe("2. question 100 → 101 (Temel → Klinik)", () => {
    it.each(FIXED_EXAMS.map((e) => [e.title, e]))(
      "%s: index 99 Temel, index 100 Klinik",
      async (_title, exam) => {
        const all = await loadAllQuestions();
        const ordered = getFixedExamQuestions(exam.questionIds, all);
        expect(subjectTypeForDers(ordered[99].ders)).toBe("Temel");
        expect(subjectTypeForDers(ordered[100].ders)).toBe("Klinik");
      },
      60_000
    );
  });

  describe("3. answers keyed by examIndex only (no id bleed)", () => {
    it("178→A, 182 empty then B, 178 stays A when ids collide with indices", () => {
      const answers = { 178: 0 };
      const q178 = { id: 182 };
      const q182 = { id: 178 };

      expect(getSelectedAnswerIndex(answers, q182, 182)).toBeUndefined();
      expect(getSelectedAnswerIndex(answers, q178, 178)).toBe(0);

      answers[182] = 1;
      expect(getSelectedAnswerIndex(answers, q178, 178)).toBe(0);
      expect(getSelectedAnswerIndex(answers, q182, 182)).toBe(1);
    });

    it("getExamAnswerAtIndex never reads via question.id", () => {
      const answers = { 13: 2 };
      expect(getSelectedAnswerIndex(answers, { id: 13 }, 25)).toBeUndefined();
      expect(getExamAnswerAtIndex(answers, 13)).toBe(2);
    });

    it("Tekrar Denemesi 1: index 114 (id 182) isolated from answers[182]", () => {
      const ids = TEKRAR_DENEMESI_1_QUESTION_IDS;
      expect(ids[114]).toBe(182);
      expect(ids[182]).not.toBe(182);

      const q114 = { id: ids[114] };
      const answers = { 114: 0 };
      expect(getSelectedAnswerIndex(answers, q114, 114)).toBe(0);

      answers[182] = 1;
      expect(getSelectedAnswerIndex(answers, q114, 114)).toBe(0);
      expect(getExamAnswerAtIndex(answers, 182)).toBe(1);
    });

    it("Tekrar Denemesi 1: Q2 / Q14 / Q26 chain does not cross-contaminate", () => {
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

  describe("4. blank answers in analysis", () => {
    it("partial answers: unanswered slots count as blank, not wrong", () => {
      const questions = [
        { id: 1, ders: "Fizyoloji", konu: "A", correct: 0, options: ["a", "b"] },
        { id: 2, ders: "Dahiliye", konu: "B", correct: 1, options: ["a", "b"] },
        { id: 3, ders: "Pediatri", konu: "C", correct: 2, options: ["a", "b", "c"] },
      ];
      const answers = { 0: 0, 2: 0 };
      const result = analyzeExamResults(questions, answers);

      expect(result.summary.blank).toBe(1);
      expect(result.summary.correct).toBe(1);
      expect(result.summary.wrong).toBe(1);
    });

    it("does not attribute id-keyed phantom answers to wrong slots", () => {
      const questions = [
        { id: 182, ders: "Küçük Stajlar", konu: "A", correct: 0, options: ["a", "b"] },
        { id: 186, ders: "Dahiliye", konu: "B", correct: 1, options: ["a", "b"] },
      ];
      const answers = { 182: 0 };
      const result = analyzeExamResults(questions, answers);
      expect(result.summary.blank).toBe(2);
      expect(result.summary.correct).toBe(0);
      expect(result.summary.wrong).toBe(0);
    });

    it("index-keyed answers score each slot independently", () => {
      const questions = [
        { id: 182, ders: "Küçük Stajlar", konu: "A", correct: 0, options: ["a", "b"] },
        { id: 186, ders: "Dahiliye", konu: "B", correct: 1, options: ["a", "b"] },
      ];
      const answers = { 0: 0, 1: 0 };
      const result = analyzeExamResults(questions, answers);
      expect(result.summary.correct).toBe(1);
      expect(result.summary.wrong).toBe(1);
      expect(result.summary.blank).toBe(0);
    });
  });

  describe("5. result metadata", () => {
    it.each(FIXED_EXAMS.map((e) => [e.title, e]))("%s: fixedSet, setVersion, snapshot, ids", (title, exam) => {
      const meta = buildExamResultMetadata(exam);
      expect(meta.fixedSet).toBe(true);
      expect(meta.setVersion).toBe(exam.setVersion);
      expect(meta.examId).toBe(exam.id);
      expect(meta.examTitle).toBe(title);
      expect(meta.questionIdsSnapshot).toHaveLength(200);
      expect(meta.questionIdsSnapshot).toEqual(exam.questionIds);
    });

    it("Tekrar Denemesi 1 setVersion comes from exam constant, not hardcoded default", () => {
      const td1 = EXAM_SETS.find((e) => e.id === 7);
      const meta = buildExamResultMetadata(td1);
      expect(meta.setVersion).toBe(td1.setVersion);
      expect(meta.setVersion).not.toBe("unknown");
    });
  });

  describe("6. non-fixed exam metadata", () => {
    it("dynamic exam without questionIds does not throw", () => {
      const dynamic = { id: 99, title: "Örnek Dinamik", questionCount: 200 };
      expect(() => buildExamResultMetadata(dynamic)).not.toThrow();
      const meta = buildExamResultMetadata(dynamic);
      expect(meta.fixedSet).toBe(false);
      expect(meta.setVersion).toBeUndefined();
      expect(meta.questionIdsSnapshot).toBeUndefined();
      expect(meta.examId).toBe(99);
    });

    it("null examSet yields safe metadata", () => {
      const meta = buildExamResultMetadata(null);
      expect(meta.fixedSet).toBe(false);
      expect(meta.examTitle).toBe("TUS Genel Deneme");
    });
  });
});
