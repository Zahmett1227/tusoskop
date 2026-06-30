import { describe, it, expect } from "vitest";
import {
  computeNet,
  estimateTusScore,
  calculateTusResult,
  TUS_SCORE_ANCHORS,
} from "./tusScoring.js";

describe("tusScoring", () => {
  it("net = doğru - yanlış/4, negatif olmaz", () => {
    expect(computeNet(100, 20)).toBe(95);
    expect(computeNet(0, 0)).toBe(0);
    expect(computeNet(10, 80)).toBe(0); // negatif → 0
  });

  it("çapa noktalarında tabloyla birebir aynı puanı verir", () => {
    for (const [net, score] of TUS_SCORE_ANCHORS) {
      expect(estimateTusScore(net)).toBe(score);
    }
  });

  it("çapalar arasında monoton artan interpolasyon yapar", () => {
    // 95→62 ile 110→66 arası: 100 net ~ 63.x olmalı (62 ile 66 arasında)
    const s = estimateTusScore(100);
    expect(s).toBeGreaterThan(62);
    expect(s).toBeLessThan(66);
  });

  it("son çapanın üstünde tavan puanı verir", () => {
    expect(estimateTusScore(200)).toBe(75);
    expect(estimateTusScore(240)).toBe(75);
  });

  it("0 ve altı net 0 puan verir", () => {
    expect(estimateTusScore(0)).toBe(0);
    expect(estimateTusScore(-5)).toBe(0);
  });

  it("genel monotonluk: net arttıkça puan azalmaz", () => {
    let prev = -1;
    for (let n = 0; n <= 240; n += 5) {
      const s = estimateTusScore(n);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });

  it("calculateTusResult temel/klinik neti ve toplamı doğru birleştirir", () => {
    const r = calculateTusResult({
      temelDogru: 90,
      temelYanlis: 20, // net 85
      klinikDogru: 80,
      klinikYanlis: 20, // net 75
    });
    expect(r.temelNet).toBe(85);
    expect(r.klinikNet).toBe(75);
    expect(r.toplamNet).toBe(160);
    expect(r.score).toBe(75);
    expect(r.band.label).toBe("Yüksek");
  });
});
