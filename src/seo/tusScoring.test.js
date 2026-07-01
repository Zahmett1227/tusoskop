import { describe, it, expect } from "vitest";
import {
  computeNet,
  computeBlank,
  isSectionOverflow,
  estimateTusScore,
  calculateTusResult,
  applyScoreDeduction,
  netForScore,
  TUS_SCORE_ANCHORS,
  TUS_DEDUCTION_RATE,
  MAX_MODEL_SCORE,
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

  it("computeBlank: 120 - doğru - yanlış, negatif olmaz", () => {
    expect(computeBlank(80, 20)).toBe(20);
    expect(computeBlank(0, 0)).toBe(120);
    expect(computeBlank(100, 30)).toBe(0); // 130>120 → negatifi 0'a clamp
  });

  it("isSectionOverflow: doğru+yanlış 120'yi aşıyorsa true", () => {
    expect(isSectionOverflow(100, 20)).toBe(false); // tam 120
    expect(isSectionOverflow(100, 21)).toBe(true);
    expect(isSectionOverflow(0, 0)).toBe(false);
  });

  it("applyScoreDeduction: aktif değilse aynı puanı, aktifse %5 azaltılmış puanı verir", () => {
    expect(applyScoreDeduction(70, false)).toBe(70);
    expect(applyScoreDeduction(70, true)).toBe(66.5);
    expect(TUS_DEDUCTION_RATE).toBe(0.05);
  });

  it("netForScore: çapa noktalarında estimateTusScore'un tersini verir", () => {
    for (const [net, score] of TUS_SCORE_ANCHORS) {
      expect(netForScore(score)).toBe(net);
    }
  });

  it("netForScore ve estimateTusScore birbirinin tersidir (round-trip)", () => {
    for (let net = 40; net <= 160; net += 5) {
      const score = estimateTusScore(net);
      const backNet = netForScore(score);
      expect(Math.abs(backNet - net)).toBeLessThan(1); // yuvarlama toleransı
    }
  });

  it("netForScore: 0 ve altı için 0, tavanın üstü için son çapa neti", () => {
    expect(netForScore(0)).toBe(0);
    expect(netForScore(-5)).toBe(0);
    expect(netForScore(MAX_MODEL_SCORE)).toBe(160);
    expect(netForScore(90)).toBe(160); // tavanın üstü → üst sınır neti
  });
});
