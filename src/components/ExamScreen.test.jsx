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

vi.mock("../services/studyCollectionService", () => ({
  addWrongQuestion: vi.fn(),
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

const mockQuestion = {
  id: 42,
  ders: "Patoloji",
  konu: "Hücre",
  q: "Örnek soru metni?",
  options: ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı", "E şıkkı"],
  correct: 1,
};

describe("App.jsx ExamScreen prop ve cevap anahtarı", () => {
  it("handleExamSelect examIndex ile saveExamAnswer kullanır", () => {
    const block = appSource.slice(
      appSource.indexOf("const handleExamSelect = "),
      appSource.indexOf("const handleExamSelectForQuestion = ")
    );
    expect(block).toContain("saveExamAnswer(examIndex, optionIndex)");
    expect(block).not.toMatch(/saveExamAnswer\([^)]*\.id/);
  });

  it("ExamScreen gerekli handler prop'larını alır", () => {
    const block = appSource.slice(
      appSource.indexOf('case "exam"'),
      appSource.indexOf('case "examAnalysis"')
    );
    expect(block).toContain("handleExamSelect={handleExamSelect}");
    expect(block).toContain("handleExamNext={handleExamNext}");
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
