import { describe, expect, it } from "vitest";
import {
  buildNextQuestionHistoryEntry,
  buildQuestionHistoryMap,
  dedupeQuestionHistoryByQuestionId,
  getTopicStatsFromHistory,
  normalizeQuestionHistoryEntry,
} from "./questionHistoryUtils";

const question = (id, correct = 0) => ({
  id,
  ders: "Fizyoloji",
  konu: "Sinir-Kas",
  correct,
  options: ["A", "B", "C", "D", "E"],
});

describe("questionHistoryUtils", () => {
  it("aynı questionId için duplicate oluşturmaz", () => {
    const now = new Date("2026-05-20T10:00:00Z");
    const first = buildNextQuestionHistoryEntry(question(42), 1, null, "topic", now);
    const second = buildNextQuestionHistoryEntry(question(42), 2, first, "topic", now);
    const list = dedupeQuestionHistoryByQuestionId([first, second]);
    expect(list).toHaveLength(1);
    expect(list[0].questionId).toBe(42);
    expect(list[0].solvedCount).toBe(2);
  });

  it("solvedCount artar", () => {
    const now = new Date("2026-05-20T10:00:00Z");
    const first = buildNextQuestionHistoryEntry(question(1), 0, null, "study", now);
    const second = buildNextQuestionHistoryEntry(question(1), 0, first, "study", now);
    expect(second.solvedCount).toBe(2);
  });

  it("doğru cevap correctCount artırır", () => {
    const entry = buildNextQuestionHistoryEntry(question(2, 1), 1, null, "study");
    expect(entry.correctCount).toBe(1);
    expect(entry.wrongCount).toBe(0);
    expect(entry.lastCorrect).toBe(true);
  });

  it("yanlış cevap wrongCount artırır", () => {
    const entry = buildNextQuestionHistoryEntry(question(3, 1), 0, null, "review");
    expect(entry.correctCount).toBe(0);
    expect(entry.wrongCount).toBe(1);
    expect(entry.lastCorrect).toBe(false);
  });

  it("question.id kullanılır, examIndex doc id olmaz", () => {
    const entry = buildNextQuestionHistoryEntry(question(179), 2, null, "study");
    expect(entry.questionId).toBe(179);
    const map = buildQuestionHistoryMap([entry]);
    expect(map[179]).toBeTruthy();
    expect(map[183]).toBeUndefined();
  });

  it("bozuk localStorage satırı patlatmaz", () => {
    expect(normalizeQuestionHistoryEntry(null)).toBeNull();
    expect(normalizeQuestionHistoryEntry({ questionId: "bad" })).toBeNull();
    const legacy = normalizeQuestionHistoryEntry({
      questionId: 5,
      ders: "A",
      konu: "B",
      isCorrect: true,
      selected: 1,
      correct: 1,
      answeredAt: "2026-01-01T00:00:00.000Z",
    });
    expect(legacy?.questionId).toBe(5);
    expect(legacy?.lastCorrect).toBe(true);
  });

  it("TopicTracker konu özeti doğru üretir", () => {
    const questions = [
      { id: 10, ders: "Fizyoloji", konu: "X" },
      { id: 11, ders: "Fizyoloji", konu: "X" },
    ];
    const map = buildQuestionHistoryMap([
      buildNextQuestionHistoryEntry(question(10, 0), 0, null, "topic"),
      buildNextQuestionHistoryEntry(question(11, 1), 0, null, "topic"),
    ]);
    const stats = getTopicStatsFromHistory("Fizyoloji", "X", questions, map);
    expect(stats.solvedCount).toBe(2);
    expect(stats.correctCount).toBe(1);
    expect(stats.wrongCount).toBe(1);
    expect(stats.percent).toBe(50);
  });
});
