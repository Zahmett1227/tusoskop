import { describe, expect, it } from "vitest";
import { getWrongReviewCardCopy } from "./questionSetupWrongCard";

describe("getWrongReviewCardCopy", () => {
  it("enables action when wrong count is positive", () => {
    expect(getWrongReviewCardCopy(3)).toEqual({
      canStart: true,
      statusLine: "3 yanlış soru hazır",
      buttonLabel: "Yanlışları çöz",
    });
  });

  it("disables action when there are no wrong records", () => {
    expect(getWrongReviewCardCopy(0)).toEqual({
      canStart: false,
      statusLine: null,
      buttonLabel: "Henüz yanlış kaydın yok",
    });
  });

  it("treats invalid values as zero", () => {
    expect(getWrongReviewCardCopy("x").canStart).toBe(false);
  });
});
