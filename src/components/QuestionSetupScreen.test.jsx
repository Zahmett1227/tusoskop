import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React, { useEffect, useRef, useState } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SUBJECTS } from "../data/subjects";
import QuestionSetupScreen from "./QuestionSetupScreen";

vi.mock("../utils/topicStudyMemory", () => ({
  getRecentTopicStudies: () => [],
  buildResumePlan: vi.fn(),
  formatLastStudyCountLabel: (mode) => String(mode),
  recentStudyKey: (m) => `${m.ders}-${m.konu}`,
}));

vi.mock("../utils/questionSetupWrongCard", () => ({
  getWrongReviewCardCopy: () => ({
    canStart: false,
    buttonLabel: "Tekrar başlat",
    statusLine: "",
  }),
}));

const SUBJECT_COUNTS = Object.fromEntries(SUBJECTS.map((s) => [s.name, 100]));

function flushPromises() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function findSubjectCardButton(container, subjectName) {
  const buttons = container.querySelectorAll("button");
  for (const btn of buttons) {
    const text = btn.textContent || "";
    if (text.includes(subjectName) && text.includes("soru") && !text.includes("Panele")) {
      return btn;
    }
  }
  return null;
}

function TestHarness({ ensureSubjectQuestions, stateRef, ...overrides }) {
  const [selectedLesson, setSelectedLesson] = useState(overrides.selectedLesson ?? "");
  const [selectedTopic, setSelectedTopic] = useState(overrides.selectedTopic ?? "eski-konu");
  const searchRef = useRef(null);

  useEffect(() => {
    if (stateRef) {
      stateRef.current = { selectedLesson, selectedTopic, searchRef };
    }
  });

  return (
    <QuestionSetupScreen
      subjectCatalog={SUBJECTS}
      subjectQuestionCounts={SUBJECT_COUNTS}
      selectedLesson={selectedLesson}
      setSelectedLesson={setSelectedLesson}
      selectedTopic={selectedTopic}
      setSelectedTopic={setSelectedTopic}
      ensureSubjectQuestions={ensureSubjectQuestions}
      startTopicTest={vi.fn()}
      goDashboard={vi.fn()}
      wrongCount={0}
      {...overrides}
    />
  );
}

describe("QuestionSetupScreen ders seçimi", () => {
  /** @type {HTMLDivElement} */
  let container;
  /** @type {import('react-dom/client').Root} */
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  async function renderHarness(ensureSubjectQuestions, options = {}) {
    const stateRef = { current: null };
    await act(async () => {
      root.render(
        <TestHarness
          ensureSubjectQuestions={ensureSubjectQuestions}
          stateRef={stateRef}
          {...options}
        />
      );
    });
    await act(flushPromises);
    return stateRef;
  }

  async function clickSubject(subjectName) {
    const btn = findSubjectCardButton(container, subjectName);
    expect(btn).toBeTruthy();
    await act(async () => {
      btn.click();
      await flushPromises();
      await flushPromises();
    });
  }

  it("render sonrası ders kartları görünür", async () => {
    const ensure = vi.fn().mockResolvedValue([]);
    await renderHarness(ensure);
    expect(findSubjectCardButton(container, "Patoloji")).toBeTruthy();
    expect(
      findSubjectCardButton(container, "Kadın Hastalıkları ve Doğum")
    ).toBeTruthy();
    expect(findSubjectCardButton(container, "Küçük Stajlar")).toBeTruthy();
  });

  it("Patoloji tıklanınca ders seçilir, konu temizlenir, ensureSubjectQuestions çağrılır", async () => {
    const ensure = vi.fn().mockResolvedValue([
      { id: 1, ders: "Patoloji", konu: "Hücre Hasarı" },
    ]);
    const stateRef = await renderHarness(ensure);

    await clickSubject("Patoloji");

    expect(stateRef.current?.selectedLesson).toBe("Patoloji");
    expect(stateRef.current?.selectedTopic).toBe("");
    expect(ensure).toHaveBeenCalledWith("Patoloji");
    expect(container.textContent).toContain("Hücre Hasarı");
  });

  it("ensureSubjectQuestions hata verirse çökmez, hata metni gösterilir", async () => {
    const ensure = vi.fn().mockRejectedValue(new Error("network"));
    await renderHarness(ensure);

    await clickSubject("Patoloji");

    expect(container.textContent).toContain("Konu listesi yüklenemedi.");
    expect(container.textContent).not.toContain("Hücre Hasarı");
  });

  it("Kadın Hastalıkları ve Doğum exact ders adıyla çalışır", async () => {
    const exact = "Kadın Hastalıkları ve Doğum";
    const ensure = vi.fn().mockResolvedValue([
      { id: 1, ders: exact, konu: "Jinekoloji" },
    ]);
    const stateRef = await renderHarness(ensure);

    await clickSubject(exact);

    expect(stateRef.current?.selectedLesson).toBe(exact);
    expect(ensure).toHaveBeenCalledWith(exact);
    expect(container.textContent).toContain("Jinekoloji");
  });

  it("Küçük Stajlar exact ders adıyla çalışır", async () => {
    const exact = "Küçük Stajlar";
    const ensure = vi.fn().mockResolvedValue([
      { id: 1, ders: exact, konu: "Nöroloji" },
    ]);
    const stateRef = await renderHarness(ensure);

    await clickSubject(exact);

    expect(stateRef.current?.selectedLesson).toBe(exact);
    expect(ensure).toHaveBeenCalledWith(exact);
    expect(container.textContent).toContain("Nöroloji");
  });

  it("Panele dön goDashboard çağırır", async () => {
    const goDashboard = vi.fn();
    await renderHarness(vi.fn().mockResolvedValue([]), { goDashboard });

    const backBtn = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Panele dön")
    );
    expect(backBtn).toBeTruthy();
    await act(() => {
      backBtn.click();
    });
    expect(goDashboard).toHaveBeenCalledTimes(1);
  });

  it("ders değişince önceki konu seçimi temizlenir", async () => {
    const ensure = vi.fn().mockImplementation(async (ders) => {
      if (ders === "Patoloji") {
        return [{ id: 1, ders: "Patoloji", konu: "Konu A" }];
      }
      return [{ id: 2, ders: "Fizyoloji", konu: "Konu B" }];
    });
    const stateRef = await renderHarness(ensure, { selectedTopic: "eski-konu" });

    await clickSubject("Patoloji");
    expect(stateRef.current?.selectedTopic).toBe("");

    await clickSubject("Fizyoloji");
    expect(stateRef.current?.selectedLesson).toBe("Fizyoloji");
    expect(stateRef.current?.selectedTopic).toBe("");
    expect(container.textContent).toContain("Konu B");
  });

});

describe("QuestionSetupScreen kaynak guard'ları", () => {
  const screenSource = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "./QuestionSetupScreen.jsx"),
    "utf8"
  );

  it("eksik setter prop'ları handleSelectLesson içinde açık hata verir", () => {
    expect(screenSource).toContain("setSelectedLesson prop must be a function");
    expect(screenSource).toContain("setSelectedTopic prop must be a function");
  });

  it("ensureSubjectQuestions fonksiyon değilse yükleme patlatmaz", () => {
    expect(screenSource).toContain('typeof ensureSubjectQuestions !== "function"');
    expect(screenSource).toContain("Konu listesi yüklenemedi.");
  });
});

describe("App.jsx QuestionSetupScreen prop bağlantısı", () => {
  const appSource = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../App.jsx"),
    "utf8"
  );

  it("gerekli setter ve ensure prop'ları hook üzerinden geçirilir", () => {
    expect(appSource).toContain("useTopicStudyFlow");
    expect(appSource).toContain("{...questionSetupScreenProps}");
    expect(appSource).toContain("{...questionSetupScreenProps}");
    const hookSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../hooks/useTopicStudyFlow.js"),
      "utf8"
    );
    expect(hookSource).toContain("startTopicTest");
    expect(hookSource).toContain("selectedLesson");
    expect(hookSource).toContain("setSelectedLesson");
  });

  it("ensureQuestionsForSubject useCallback ile stabil referans", () => {
    expect(appSource).toMatch(/const ensureQuestionsForSubject = useCallback\(/);
    expect(appSource).toMatch(/const withQuestionLoading = useCallback\(/);
  });
});
