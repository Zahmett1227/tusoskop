import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildTopicTestPayload,
  clearTopicTestInProgress,
  formatTopicResumeProgress,
  hasMeaningfulTopicProgress,
  loadValidatedTopicTestInProgress,
  saveTopicTestInProgress,
  validateTopicTestInProgress,
} from "./topicTestInProgressUtils";

const sampleQuestions = [
  { id: 101, ders: "Dahiliye", konu: "Nefroloji" },
  { id: 102, ders: "Dahiliye", konu: "Nefroloji" },
  { id: 103, ders: "Dahiliye", konu: "Nefroloji" },
];

describe("topicTestInProgressUtils", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("buildTopicTestPayload snapshot ve sanitize edilmiş cevap üretir", () => {
    const payload = buildTopicTestPayload({
      ders: "Dahiliye",
      konu: "Nefroloji",
      questions: sampleQuestions,
      currentIndex: 1,
      answers: {
        0: { selected: 2, revealed: true, correct: true },
        9: { selected: 1, revealed: true, correct: false }, // aralık dışı → atılır
      },
      score: 1,
      streak: 1,
    });
    expect(payload.questionIdsSnapshot).toEqual([101, 102, 103]);
    expect(payload.questionCount).toBe(3);
    expect(payload.currentIndex).toBe(1);
    expect(payload.answers[0]).toEqual({ selected: 2, revealed: true, correct: true });
    expect(payload.answers[9]).toBeUndefined();
  });

  it("validate: geçerli payload ok döner", () => {
    const payload = buildTopicTestPayload({
      ders: "Dahiliye",
      konu: "Nefroloji",
      questions: sampleQuestions,
      currentIndex: 2,
      answers: { 0: { selected: 0, revealed: true, correct: false } },
      score: 0,
      streak: 0,
    });
    const res = validateTopicTestInProgress(payload);
    expect(res.ok).toBe(true);
    expect(res.data.questionIdsSnapshot).toEqual([101, 102, 103]);
    expect(res.data.currentIndex).toBe(2);
  });

  it("validate: snapshot yoksa / index bozuksa reddeder", () => {
    expect(validateTopicTestInProgress({ ders: "D", konu: "N", questionIdsSnapshot: [] }).ok).toBe(false);
    expect(
      validateTopicTestInProgress({
        ders: "D",
        konu: "N",
        questionIdsSnapshot: [1, 2],
        currentIndex: 5,
      }).ok
    ).toBe(false);
    expect(validateTopicTestInProgress(null).ok).toBe(false);
  });

  it("hasMeaningfulTopicProgress cevap veya ilerleme varsa true", () => {
    expect(hasMeaningfulTopicProgress({ answers: {}, currentIndex: 0 })).toBe(false);
    expect(hasMeaningfulTopicProgress({ answers: { 0: {} }, currentIndex: 0 })).toBe(true);
    expect(hasMeaningfulTopicProgress({ answers: {}, currentIndex: 3 })).toBe(true);
  });

  it("save/load roundtrip ve geçersizde temizleme", () => {
    const payload = buildTopicTestPayload({
      ders: "Dahiliye",
      konu: "Nefroloji",
      questions: sampleQuestions,
      currentIndex: 1,
      answers: { 0: { selected: 1, revealed: true, correct: true } },
      score: 1,
      streak: 1,
    });
    saveTopicTestInProgress(payload);
    const loaded = loadValidatedTopicTestInProgress();
    expect(loaded?.ders).toBe("Dahiliye");
    expect(loaded?.konu).toBe("Nefroloji");
    expect(loaded?.currentIndex).toBe(1);

    // Bozuk kayıt → load null döner + temizler
    window.localStorage.setItem("tusoskopTopicTestInProgress", JSON.stringify({ ders: "X" }));
    expect(loadValidatedTopicTestInProgress()).toBeNull();
    expect(window.localStorage.getItem("tusoskopTopicTestInProgress")).toBeNull();
  });

  it("formatTopicResumeProgress okunur etiket verir", () => {
    const data = { questionCount: 40, currentIndex: 12, answers: { 0: {}, 1: {} } };
    expect(formatTopicResumeProgress(data)).toBe("12 / 40 soru");
  });

  it("clearTopicTestInProgress kaydı siler", () => {
    saveTopicTestInProgress(
      buildTopicTestPayload({
        ders: "D",
        konu: "N",
        questions: sampleQuestions,
        currentIndex: 0,
        answers: {},
        score: 0,
        streak: 0,
      })
    );
    clearTopicTestInProgress();
    expect(window.localStorage.getItem("tusoskopTopicTestInProgress")).toBeNull();
  });
});
