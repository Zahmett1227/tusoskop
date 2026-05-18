import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EXAM_SETS } from "../data/exams";
import ExamSetSelectScreen from "./ExamSetSelectScreen";

const appSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../App.jsx"),
  "utf8"
);

describe("App.jsx ExamSetSelectScreen prop bağlantısı", () => {
  it("onSelectSet ve goDashboard geçirilir", () => {
    const block = appSource.slice(
      appSource.indexOf('case "examSetSelect"'),
      appSource.indexOf('case "exam"')
    );
    expect(block).toContain("<ExamSetSelectScreen");
    expect(block).toContain("onSelectSet={startFullExam}");
    expect(block).toContain("goDashboard={goDashboard}");
  });
});

describe("ExamSetSelectScreen seçim ve geri", () => {
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

  function renderScreen(overrides = {}) {
    const onSelectSet = vi.fn();
    const goDashboard = vi.fn();
    act(() => {
      root.render(
        <ExamSetSelectScreen
          onSelectSet={onSelectSet}
          goDashboard={goDashboard}
          {...overrides}
        />
      );
    });
    return { onSelectSet, goDashboard };
  }

  it("deneme kartı tıklanınca onSelectSet exam id ile çağrılır", () => {
    const firstExam = EXAM_SETS[0];
    const { onSelectSet } = renderScreen();
    const titleBtn = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(firstExam.title)
    );
    expect(titleBtn).toBeTruthy();
    act(() => {
      titleBtn.click();
    });
    expect(onSelectSet).toHaveBeenCalledWith(firstExam.id);
  });

  it("Geri Dön butonu goDashboard çağırır", () => {
    const { goDashboard } = renderScreen();
    const backBtn = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Geri Dön")
    );
    expect(backBtn).toBeTruthy();
    act(() => {
      backBtn.click();
    });
    expect(goDashboard).toHaveBeenCalledTimes(1);
  });
});
