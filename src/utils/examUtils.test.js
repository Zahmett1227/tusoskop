import { describe, it, expect } from "vitest";
import { scaleBlueprintToTotal, groupByTopic } from "./examUtils";

describe("scaleBlueprintToTotal", () => {
  it("ölçekler ve toplam kotayı hedef sayıya yaklaştırır", () => {
    const bp = { A: 10, B: 10 };
    const scaled = scaleBlueprintToTotal(bp, 20);
    const sum = Object.values(scaled).reduce((a, b) => a + b, 0);
    expect(sum).toBe(20);
  });

  it("sıfır hedefte boş nesne döner", () => {
    expect(scaleBlueprintToTotal({ A: 5 }, 0)).toEqual({});
  });
});

describe("groupByTopic", () => {
  it("konu anahtarlarına göre gruplar", () => {
    const grouped = groupByTopic([
      { id: 1, konu: "X" },
      { id: 2, konu: "Y" },
      { id: 3, konu: "X" },
    ]);
    expect(Object.keys(grouped).sort()).toEqual(["X", "Y"]);
    expect(grouped.X.length).toBe(2);
  });
});
