import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  EXAM_IN_PROGRESS_SCHEMA_VERSION,
  buildInProgressExamPayload,
  clearInProgressExam,
  loadInProgressExamRaw,
  loadValidatedInProgressExam,
  looksLikeIdBasedAnswers,
  saveInProgressExam,
  shouldNotifyInProgressReset,
  TUSOSKOP_EXAM_IN_PROGRESS_KEY,
  validateInProgressExam,
} from "./examInProgressUtils";
import { EXAM_SETS, TEKRAR_DENEMESI_1_EXAM_ID, TEKRAR_DENEMESI_1_SET_VERSION } from "../data/exams";
import { TEKRAR_DENEMESI_1_QUESTION_IDS } from "../data/tekrarDenemesi1QuestionIds";

const fixedExam = EXAM_SETS.find((e) => e.id === TEKRAR_DENEMESI_1_EXAM_ID);
const dynamicExam = { id: 99, title: "Örnek Dinamik", questionCount: 200 };

describe("validateInProgressExam", () => {
  const validPayload = () =>
    buildInProgressExamPayload({
      examSet: fixedExam,
      examQuestions: TEKRAR_DENEMESI_1_QUESTION_IDS.map((id) => ({ id })),
      examIndex: 5,
      answers: { 5: 1 },
      examSelected: 1,
    });

  it("setVersion aynı ise geçerli", () => {
    const payload = validPayload();
    const result = validateInProgressExam(payload, fixedExam);
    expect(result.ok).toBe(true);
    expect(result.data.examIndex).toBe(5);
  });

  it("setVersion farklı ise restore edilmez", () => {
    const payload = { ...validPayload(), setVersion: "eski-surum" };
    const result = validateInProgressExam(payload, fixedExam);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("set_version_mismatch");
  });

  it("questionIdsSnapshot uzunluğu yanlışsa restore edilmez", () => {
    const payload = {
      ...validPayload(),
      questionIdsSnapshot: TEKRAR_DENEMESI_1_QUESTION_IDS.slice(0, 10),
    };
    const result = validateInProgressExam(payload, fixedExam);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("snapshot_length");
  });

  it("questionIdsSnapshot sırası farklıysa restore edilmez", () => {
    const shuffled = [...TEKRAR_DENEMESI_1_QUESTION_IDS];
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    const payload = {
      ...validPayload(),
      questionIdsSnapshot: shuffled,
    };
    const result = validateInProgressExam(payload, fixedExam);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("snapshot_mismatch");
  });

  it("snapshot yok ama setVersion uyumluysa exam.questionIds ile kabul edilir", () => {
    const payload = { ...validPayload(), questionIdsSnapshot: undefined };
    const result = validateInProgressExam(payload, fixedExam);
    expect(result.ok).toBe(true);
    expect(result.data.questionIdsSnapshot).toEqual(TEKRAR_DENEMESI_1_QUESTION_IDS);
  });

  it("bilinmeyen examId ile restore edilmez", () => {
    const payload = { ...validPayload(), examId: 9999 };
    expect(validateInProgressExam(payload, undefined).reason).toBe("exam_mismatch");
  });

  it("eski schema sürümü reddedilir", () => {
    const payload = { ...validPayload(), schemaVersion: 1 };
    const result = validateInProgressExam(payload, fixedExam);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("old_schema");
  });

  it("TD1 v1 setVersion restore edilmez", () => {
    const payload = { ...validPayload(), setVersion: "2026-05-v1" };
    const result = validateInProgressExam(payload, fixedExam);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("set_version_mismatch");
  });

  it("id tabanlı cevaplar reddedilir", () => {
    const payload = {
      ...validPayload(),
      answers: { 322: 2 },
    };
    expect(
      looksLikeIdBasedAnswers(payload.answers, 200, payload.questionIdsSnapshot)
    ).toBe(true);
    const result = validateInProgressExam(payload, fixedExam);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("id_based_answers");
  });

  it("bozuk obje patlatmaz", () => {
    expect(validateInProgressExam(null, fixedExam).ok).toBe(false);
    expect(validateInProgressExam("x", fixedExam).ok).toBe(false);
  });

  it("dinamik denemede setVersion zorunlu değil", () => {
    const payload = buildInProgressExamPayload({
      examSet: dynamicExam,
      examQuestions: [{ id: 1 }, { id: 2 }],
      examIndex: 0,
      answers: {},
      examSelected: null,
    });
    expect(payload.setVersion).toBeUndefined();
    const result = validateInProgressExam(payload, dynamicExam);
    expect(result.ok).toBe(true);
  });
});

describe("looksLikeIdBasedAnswers", () => {
  it("index anahtarlarını id sanmaz", () => {
    expect(looksLikeIdBasedAnswers({ 0: 1, 5: 2 }, 200, TEKRAR_DENEMESI_1_QUESTION_IDS)).toBe(false);
  });
});

describe("localStorage in-progress", () => {
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
    clearInProgressExam();
  });

  it("kayıt ve okuma round-trip", () => {
    const payload = buildInProgressExamPayload({
      examSet: fixedExam,
      examQuestions: TEKRAR_DENEMESI_1_QUESTION_IDS.slice(0, 3).map((id) => ({ id })),
      examIndex: 1,
      answers: { 1: 0 },
      examSelected: 0,
    });
    saveInProgressExam(payload);
    const raw = loadInProgressExamRaw();
    expect(raw.schemaVersion).toBe(EXAM_IN_PROGRESS_SCHEMA_VERSION);
    expect(raw.setVersion).toBe(TEKRAR_DENEMESI_1_SET_VERSION);
    expect(raw.questionIdsSnapshot).toHaveLength(3);
  });

  it("clear yalnızca in-progress key'ini siler", () => {
    localStorage.setItem(TUSOSKOP_EXAM_IN_PROGRESS_KEY, "{}");
    localStorage.setItem("tusoskopExamHistory", "[]");
    clearInProgressExam();
    expect(loadInProgressExamRaw()).toBeNull();
    expect(localStorage.getItem("tusoskopExamHistory")).toBe("[]");
  });

  it("uyumsuz kayıt loadValidatedInProgressExam ile temizlenir", () => {
    saveInProgressExam({
      ...buildInProgressExamPayload({
        examSet: fixedExam,
        examQuestions: TEKRAR_DENEMESI_1_QUESTION_IDS.map((id) => ({ id })),
        examIndex: 2,
        answers: { 2: 0 },
        examSelected: 0,
      }),
      setVersion: "2026-05-v1",
    });
    const result = loadValidatedInProgressExam(fixedExam);
    expect(result.cleared).toBe(true);
    expect(result.reason).toBe("set_version_mismatch");
    expect(loadInProgressExamRaw()).toBeNull();
    expect(localStorage.getItem("tusoskopExamHistory")).toBeNull();
  });

  it("bozuk JSON loadInProgressExamRaw null döner", () => {
    localStorage.setItem(TUSOSKOP_EXAM_IN_PROGRESS_KEY, "{not json");
    expect(loadInProgressExamRaw()).toBeNull();
  });
});

describe("shouldNotifyInProgressReset", () => {
  it("kullanıcıya gösterilecek reset nedenlerini bilir", () => {
    expect(shouldNotifyInProgressReset("set_version_mismatch")).toBe(true);
    expect(shouldNotifyInProgressReset("snapshot_mismatch")).toBe(true);
    expect(shouldNotifyInProgressReset("invalid")).toBe(false);
  });
});
