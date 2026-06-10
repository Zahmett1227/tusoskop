import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ExamScreen from "./ExamScreen";

vi.mock("../firebase", () => ({
  auth: { currentUser: { displayName: "Test", uid: "u1", email: "t@test.com" } },
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: "doc1" }),
  serverTimestamp: vi.fn(),
}));

vi.mock("../services/streakService", () => ({
  updateStreak: vi.fn(),
}));

vi.mock("../services/examFinishBatchService", () => ({
  saveExamWrongAndSmartReviewsBatch: vi.fn().mockResolvedValue({ ok: true, count: 0 }),
}));

vi.mock("../lib/clarity", () => ({
  trackClarityEvent: vi.fn(),
}));

vi.mock("../hooks/useSwipeHandlers", () => ({
  usePrefersReducedMotion: () => true,
  useSwipeHandlers: () => ({}),
}));

const appSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../App.jsx"),
  "utf8"
);
const examStateSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../hooks/useExamState.js"),
  "utf8"
);
const examScreenSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "./ExamScreen.jsx"),
  "utf8"
);
const examAnalysisSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "./ExamAnalysisScreen.jsx"),
  "utf8"
);
const studyScreenSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "./StudyScreen.jsx"),
  "utf8"
);

const mockQuestion = {
  id: 42,
  ders: "Patoloji",
  konu: "Hücre",
  q: "Örnek soru metni?",
  options: ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı", "E şıkkı"],
  correct: 1,
  exp: "Bu açıklama deneme sırasında görünmemeli.",
};

describe("App.jsx ExamScreen prop ve cevap anahtarı", () => {
  it("handleExamSelect examIndex ile saveExamAnswer kullanır", () => {
    const block = examStateSource.slice(
      examStateSource.indexOf("const handleExamSelect = "),
      examStateSource.indexOf("const handleExamSelectForQuestion = ")
    );
    expect(block).toContain("saveExamAnswer(examIndex, optionIndex)");
    expect(block).not.toMatch(/saveExamAnswer\([^)]*\.id/);
  });

  it("ExamScreen gerekli handler prop'larını alır", () => {
    const block = appSource.slice(
      appSource.indexOf('case "exam"'),
      appSource.indexOf('case "examAnalysis"')
    );
    expect(block).toContain("handleExamSelect={examState.handleExamSelect}");
    expect(block).toContain("handleExamNext={examState.handleExamNext}");
    expect(block).toContain("goDashboard={goDashboard}");
    expect(block).not.toContain("examTitle=");
  });
});

describe("ExamScreen şık seçimi", () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("şık tıklanınca handleExamSelect doğru indeksle çağrılır", async () => {
    const handleExamSelect = vi.fn();
    const examQuestions = [mockQuestion, { ...mockQuestion, id: 43, q: "İkinci soru?" }];

    await act(async () => {
      root.render(
        <ExamScreen
          examQ={mockQuestion}
          examIndex={0}
          examQuestions={examQuestions}
          examAnswers={{}}
          examSelected={null}
          examSetMeta={{ examId: 1 }}
          onJump={vi.fn()}
          handleExamSelect={handleExamSelect}
          handleExamSelectForQuestion={vi.fn()}
          handleExamBlank={vi.fn()}
          handleExamNext={vi.fn()}
          handleExamPrev={vi.fn()}
          getExamAnswersSnapshot={() => ({})}
          goDashboard={vi.fn()}
          onExamCompleted={vi.fn()}
          userId="u1"
          userData={null}
        />
      );
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const optionButtons = [...container.querySelectorAll("button[aria-pressed]")];
    expect(optionButtons.length).toBeGreaterThanOrEqual(2);
    await act(() => {
      optionButtons[1].click();
    });
    expect(handleExamSelect).toHaveBeenCalledWith(1);
  });

  it("Panele dön butonu goDashboard çağırır", async () => {
    const goDashboard = vi.fn();
    await act(async () => {
      root.render(
        <ExamScreen
          examQ={mockQuestion}
          examIndex={0}
          examQuestions={[mockQuestion]}
          examAnswers={{}}
          examSelected={null}
          examSetMeta={{ examId: 1 }}
          onJump={vi.fn()}
          handleExamSelect={vi.fn()}
          handleExamSelectForQuestion={vi.fn()}
          handleExamBlank={vi.fn()}
          handleExamNext={vi.fn()}
          handleExamPrev={vi.fn()}
          getExamAnswersSnapshot={() => ({})}
          goDashboard={goDashboard}
          onExamCompleted={vi.fn()}
          userId="u1"
          userData={null}
        />
      );
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const dashBtn = container.querySelector(
      'button[aria-label="Panele dön ve sınavdan çık"]'
    );
    expect(dashBtn).toBeTruthy();
    await act(() => {
      dashBtn.click();
    });
    expect(goDashboard).toHaveBeenCalled();
  });
});

describe("ExamScreen deneme modu — çalışma/review UI yok", () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderActiveExam = async (overrides = {}) => {
    const handleExamNext = vi.fn();
    const examQuestions = [
      mockQuestion,
      { ...mockQuestion, id: 43, q: "İkinci soru?" },
    ];
    await act(async () => {
      root.render(
        <ExamScreen
          examQ={mockQuestion}
          examIndex={0}
          examQuestions={examQuestions}
          examAnswers={{}}
          examSelected={0}
          examSetMeta={{ examId: 1 }}
          onJump={vi.fn()}
          handleExamSelect={vi.fn()}
          handleExamSelectForQuestion={vi.fn()}
          handleExamBlank={vi.fn()}
          handleExamNext={handleExamNext}
          handleExamPrev={vi.fn()}
          getExamAnswersSnapshot={() => ({})}
          goDashboard={vi.fn()}
          onExamCompleted={vi.fn()}
          userId="u1"
          userData={null}
          {...overrides}
        />
      );
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    return { handleExamNext };
  };

  it("yanlış cevapta Sonraki doğrudan sonraki soruya geçer", async () => {
    const { handleExamNext } = await renderActiveExam();
    const sonraki = [...container.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "Sonraki"
    );
    expect(sonraki).toBeTruthy();
    expect(sonraki.disabled).toBe(false);
    await act(() => {
      sonraki.click();
    });
    expect(handleExamNext).toHaveBeenCalled();
  });

  it("deneme sırasında doğru cevap, açıklama ve FSRS grade görünmez", async () => {
    await renderActiveExam();
    expect(container.textContent).not.toMatch(/Doğru cevap:/);
    expect(container.textContent).not.toContain(mockQuestion.exp);
    expect(container.textContent).not.toMatch(/Bu soruyu ne kadar zorlandın/i);
    expect(container.textContent).not.toMatch(/Yanlış cevap — inceleme/);
    expect(container.textContent).not.toMatch(/Çok Zor|Tekrar et/i);
  });

  it("önceki soruya dönünce seçili cevap korunur", async () => {
    await renderActiveExam({
      examIndex: 1,
      examSelected: 2,
      examAnswers: { 0: 0, 1: 2 },
      examQ: { ...mockQuestion, id: 43, q: "İkinci soru?" },
    });
    const pressed = container.querySelector('button[aria-pressed="true"]');
    expect(pressed).toBeTruthy();
  });
});

describe("ExamScreen kaynak regresyonu", () => {
  it("aktif deneme ekranında FsrsDifficultyRating ve showWrongFeedback yok", () => {
    expect(examScreenSource).not.toContain("FsrsDifficultyRating");
    expect(examScreenSource).not.toContain("showWrongFeedback");
    expect(examScreenSource).not.toContain("Yanlış cevap — inceleme");
  });

  it("ExamAnalysisScreen deneme sonrası açıklama göstermeye devam eder", () => {
    expect(examAnalysisSource).toMatch(/wq\.exp/);
    expect(examAnalysisSource).toMatch(/Doğru cevap:/);
  });

  it("StudyScreen FSRS grade bileşenini kullanır", () => {
    expect(studyScreenSource).toContain("FsrsDifficultyRating");
  });

  it("handleFinish çift tıklama için useRef tabanlı guard kullanır", () => {
    expect(examScreenSource).toContain("finishInProgressRef");
    expect(examScreenSource).toMatch(/useRef\(false\)/);
    expect(examScreenSource).toMatch(
      /if \(finishInProgressRef\.current \|\| isFinished\) return/
    );
    expect(examScreenSource).toMatch(/finishInProgressRef\.current = true/);
  });

  it("handleFinish içinde usage increment / kullanım sayacı çağrısı yok", () => {
    expect(examScreenSource).not.toMatch(/incrementUsage|increment_usage/i);
    expect(examScreenSource).not.toMatch(/incrementDailyUsage/);
  });

  it("deneme bitişinde saveExamWrongAndSmartReviewsBatch kullanılır", () => {
    expect(examScreenSource).toContain("saveExamWrongAndSmartReviewsBatch");
    expect(examScreenSource).not.toContain("addWrongQuestion");
    expect(examScreenSource).not.toContain("upsertSmartReview");
  });
});

describe("ExamScreen handleFinish double-submit guard", () => {
  let container;
  let root;
  let firestoreModule;
  let batchModule;
  let firebaseModule;
  let historyKey;

  beforeEach(async () => {
    vi.stubGlobal("alert", vi.fn());
    const store = {};
    vi.stubGlobal("localStorage", {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => {
        store[key] = String(value);
      },
      removeItem: (key) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key]);
      },
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    firestoreModule = await import("firebase/firestore");
    batchModule = await import("../services/examFinishBatchService");
    firebaseModule = await import("../firebase");
    const utils = await import("../utils/examHistoryUtils");
    historyKey = utils.TUSOSKOP_EXAM_HISTORY_KEY;
    firebaseModule.auth.currentUser = { displayName: "Test", uid: "u1", email: "t@test.com" };
    firestoreModule.addDoc.mockClear();
    batchModule.saveExamWrongAndSmartReviewsBatch.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  const renderAtLastQuestion = async (overrides = {}) => {
    const examQuestions = [
      { ...mockQuestion, id: 100, correct: 0 },
      { ...mockQuestion, id: 101, correct: 1 },
    ];
    await act(async () => {
      root.render(
        <ExamScreen
          examQ={examQuestions[1]}
          examIndex={1}
          examQuestions={examQuestions}
          examAnswers={{ 0: 0, 1: 2 }}
          examSelected={2}
          examSetMeta={{
            examId: 7,
            examTitle: "Sabit Deneme 7",
            fixedSet: true,
            setVersion: "v1",
            questionIdsSnapshot: [100, 101],
          }}
          onJump={vi.fn()}
          handleExamSelect={vi.fn()}
          handleExamSelectForQuestion={vi.fn()}
          handleExamBlank={vi.fn()}
          handleExamNext={vi.fn()}
          handleExamPrev={vi.fn()}
          getExamAnswersSnapshot={() => ({ 0: 0, 1: 2 })}
          goDashboard={vi.fn()}
          onExamCompleted={vi.fn()}
          userId="u1"
          userData={null}
          {...overrides}
        />
      );
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  };

  const findBitir = () =>
    [...container.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "Bitir"
    );

  it("Bitir butonuna hızlı çift basılınca Firestore'a tek sonuç yazılır", async () => {
    await renderAtLastQuestion();
    const bitir = findBitir();
    expect(bitir).toBeTruthy();

    await act(async () => {
      bitir.click();
      bitir.click();
      await new Promise((r) => setTimeout(r, 0));
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(firestoreModule.addDoc).toHaveBeenCalledTimes(1);
    const localHistory = JSON.parse(localStorage.getItem(historyKey) || "[]");
    expect(localHistory).toHaveLength(1);
    expect(localHistory[0].fixedSet).toBe(true);
    expect(localHistory[0].setVersion).toBe("v1");
    expect(localHistory[0].questionIdsSnapshot).toEqual([100, 101]);
    expect(batchModule.saveExamWrongAndSmartReviewsBatch).toHaveBeenCalledTimes(1);
    const wrongArg = batchModule.saveExamWrongAndSmartReviewsBatch.mock.calls[0][1];
    expect(wrongArg).toHaveLength(1);
    expect(wrongArg[0].questionId).toBe(101);
    expect(wrongArg[0].examIndex).toBe(1);
  });

  it("başarılı bitişten sonra ikinci tetikleme yeni kayıt oluşturmaz", async () => {
    await renderAtLastQuestion();
    const bitir = findBitir();

    await act(async () => {
      bitir.click();
      await new Promise((r) => setTimeout(r, 0));
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(firestoreModule.addDoc).toHaveBeenCalledTimes(1);

    // İlk bitişten sonra analiz ekranı render olur, Bitir butonu artık DOM'da değil.
    expect(findBitir()).toBeFalsy();

    const localHistory = JSON.parse(localStorage.getItem(historyKey) || "[]");
    expect(localHistory).toHaveLength(1);
  });

  it("ilk kayıt hata verirse kullanıcı tekrar deneyebilir", async () => {
    firestoreModule.addDoc
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ id: "doc-retry" });

    await renderAtLastQuestion();
    const bitir = findBitir();

    await act(async () => {
      bitir.click();
      await new Promise((r) => setTimeout(r, 0));
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(firestoreModule.addDoc).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(historyKey) || "[]")).toHaveLength(0);

    // Guard hata sonrası serbest kalmış olmalı; Bitir butonu hâlâ ekrandadır.
    const bitirAfterError = findBitir();
    expect(bitirAfterError).toBeTruthy();

    await act(async () => {
      bitirAfterError.click();
      await new Promise((r) => setTimeout(r, 0));
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(firestoreModule.addDoc).toHaveBeenCalledTimes(2);
    const localHistory = JSON.parse(localStorage.getItem(historyKey) || "[]");
    expect(localHistory).toHaveLength(1);
    expect(localHistory[0].id).toBe("doc-retry");
  });
});
