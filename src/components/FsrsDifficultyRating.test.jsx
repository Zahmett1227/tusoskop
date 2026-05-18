import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FsrsDifficultyRating from "./FsrsDifficultyRating";

const { updateSmartReviewGrade } = vi.hoisted(() => ({
  updateSmartReviewGrade: vi.fn().mockResolvedValue({}),
}));

vi.mock("../services/smartReviewService", () => ({
  updateSmartReviewGrade,
}));

const question = { id: 42, ders: "Fizyoloji", konu: "Test" };

describe("FsrsDifficultyRating", () => {
  let container;
  let root;

  beforeEach(() => {
    updateSmartReviewGrade.mockClear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderRating = (props) =>
    act(async () => {
      root.render(
        <FsrsDifficultyRating
          question={question}
          user={{ uid: "user-1" }}
          onRated={vi.fn()}
          onSkip={vi.fn()}
          {...props}
        />
      );
      await new Promise((r) => setTimeout(r, 0));
    });

  it('"Çok Zor" butonuna basınca updateSmartReviewGrade again ile çağrılır', async () => {
    const onRated = vi.fn();
    const user = { uid: "user-1" };

    await renderRating({ user, onRated });

    const buttons = [...container.querySelectorAll("button")];
    const cokZor = buttons.find((b) => b.textContent.includes("Çok Zor"));
    expect(cokZor).toBeTruthy();

    await act(async () => {
      cokZor.click();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(updateSmartReviewGrade).toHaveBeenCalledWith(user, question, "again");
    expect(onRated).toHaveBeenCalledWith("again");
  });

  it("user yokken Firebase çağrısı yapılmaz", async () => {
    const onRated = vi.fn();

    await renderRating({ user: null, onRated });

    const normal = [...container.querySelectorAll("button")].find((b) =>
      b.textContent.includes("Normal")
    );
    await act(async () => {
      normal.click();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(updateSmartReviewGrade).not.toHaveBeenCalled();
    expect(onRated).toHaveBeenCalledWith("good");
  });

  it("Geç tıklanınca onSkip çağrılır", async () => {
    const onSkip = vi.fn();

    await renderRating({ onSkip });

    const skipBtn = [...container.querySelectorAll("button")].find((b) =>
      b.textContent.includes("Geç")
    );
    await act(() => {
      skipBtn.click();
    });

    expect(onSkip).toHaveBeenCalled();
  });
});
