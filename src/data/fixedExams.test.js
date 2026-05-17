import { describe, expect, it } from "vitest";
import { SUBJECTS } from "./subjects";
import {
  EXAM_SETS,
  FIXED_EXAM_SET_VERSION,
  TEKRAR_DENEMESI_1_EXAM_ID,
  TEKRAR_DENEMESI_1_SET_VERSION,
} from "./exams";
import { TEKRAR_DENEMESI_1_QUESTION_IDS } from "./tekrarDenemesi1QuestionIds";
import FULL_EXAM_BLUEPRINT from "./examBlueprints";
import { loadAllQuestions } from "./questions";
import { getFixedExamQuestions, buildFullExam } from "../utils/examUtils";
import { buildExamResultMetadata } from "../utils/examHistoryUtils";

const TEMEL = new Set(SUBJECTS.filter((s) => s.type === "Temel").map((s) => s.name));
const KLINIK = new Set(SUBJECTS.filter((s) => s.type === "Klinik").map((s) => s.name));

const FIXED_EXAMS = EXAM_SETS.filter((e) => e.fixedSet === true);

function maxConsecutiveStreak(items, keyFn) {
  let max = 0;
  let cur = 0;
  let prev = null;
  for (const item of items) {
    const k = keyFn(item);
    if (k === prev) cur += 1;
    else {
      cur = 1;
      prev = k;
    }
    max = Math.max(max, cur);
  }
  return max;
}

function countByDers(questions) {
  return questions.reduce((acc, q) => {
    acc[q.ders] = (acc[q.ders] || 0) + 1;
    return acc;
  }, {});
}

describe("sabit denemeler (fixedSet)", () => {
  it("tüm denemeler sabit set olmalı", () => {
    expect(FIXED_EXAMS.length).toBe(EXAM_SETS.length);
    expect(EXAM_SETS.every((e) => e.fixedSet === true)).toBe(true);
  });

  it.each(FIXED_EXAMS.map((e) => [e.title, e]))(
    "%s: 200 unique questionIds, setVersion, bankada mevcut",
    async (_title, exam) => {
      expect(exam.questionIds).toHaveLength(200);
      expect(new Set(exam.questionIds).size).toBe(200);
      expect(exam.setVersion).toBeTruthy();

      const all = await loadAllQuestions();
      const byId = new Map(all.map((q) => [Number(q.id), q]));
      const ordered = getFixedExamQuestions(exam.questionIds, all);

      expect(ordered).toHaveLength(200);
      ordered.forEach((q, index) => {
        expect(q.id).toBe(exam.questionIds[index]);
        expect(byId.has(q.id)).toBe(true);
      });
    },
    60_000
  );

  it.each(FIXED_EXAMS.map((e) => [e.title, e]))(
    "%s: ilk 100 Temel, son 100 Klinik, blueprint",
    async (_title, exam) => {
      const all = await loadAllQuestions();
      const ordered = getFixedExamQuestions(exam.questionIds, all);

      ordered.slice(0, 100).forEach((q) => expect(TEMEL.has(q.ders)).toBe(true));
      ordered.slice(100, 200).forEach((q) => expect(KLINIK.has(q.ders)).toBe(true));

      const counts = countByDers(ordered);
      for (const [ders, quota] of Object.entries(FULL_EXAM_BLUEPRINT)) {
        expect(counts[ders]).toBe(quota);
      }

      const topicStreak = maxConsecutiveStreak(ordered, (q) => `${q.ders}::${q.konu}`);
      expect(topicStreak).toBeLessThan(5);
    },
    60_000
  );

  it("Tekrar Denemesi 1: v2 sabit set snapshot", () => {
    expect(TEKRAR_DENEMESI_1_QUESTION_IDS[0]).toBe(1614);
    expect(TEKRAR_DENEMESI_1_QUESTION_IDS[199]).toBe(127);
    const td1 = EXAM_SETS.find((e) => e.id === TEKRAR_DENEMESI_1_EXAM_ID);
    expect(td1?.questionIds).toBe(TEKRAR_DENEMESI_1_QUESTION_IDS);
    expect(td1?.setVersion).toBe(TEKRAR_DENEMESI_1_SET_VERSION);
    expect(TEKRAR_DENEMESI_1_SET_VERSION).toBe("2026-05-v2");
  });

  it("yeni sabit denemeler FIXED_EXAM_SET_VERSION kullanır", () => {
    const others = FIXED_EXAMS.filter((e) => e.id !== TEKRAR_DENEMESI_1_EXAM_ID);
    expect(others.every((e) => e.setVersion === FIXED_EXAM_SET_VERSION)).toBe(true);
  });

  it("result metadata setVersion ve snapshot taşır", () => {
    const exam = FIXED_EXAMS[0];
    const meta = buildExamResultMetadata(exam);
    expect(meta.fixedSet).toBe(true);
    expect(meta.setVersion).toBe(exam.setVersion);
    expect(meta.questionIdsSnapshot).toHaveLength(200);
  });

  it("dinamik buildFullExam hâlâ çalışır (örnek)", () => {
    const sample = [
      { id: 1, ders: "Fizyoloji", konu: "A", correct: 0 },
      { id: 2, ders: "Dahiliye", konu: "B", correct: 0 },
    ];
    const built = buildFullExam(sample, { Fizyoloji: 1, Dahiliye: 1 });
    expect(built.length).toBe(2);
  });
});

describe("denemeler arası id tekrarı", () => {
  it("sabit setler arasında id tekrarı olmamalı", () => {
    const all = FIXED_EXAMS.flatMap((e) => e.questionIds);
    expect(new Set(all).size).toBe(all.length);
  });
});
