import { describe, it, expect } from "vitest";
import {
  computeNet,
  computeBlank,
  isSectionOverflow,
  computeStandardPuan,
  computeTPuani,
  computeKPuani,
  calculateTusResult,
  applyScoreDeduction,
  puanBandi,
  netForTargetPuan,
  TEMEL_ORTALAMA,
  TEMEL_STDDEV,
  KLINIK_ORTALAMA,
  KLINIK_STDDEV,
  T_PUANI_AGIRLIK,
  K_PUANI_AGIRLIK,
  TUS_DEDUCTION_RATE,
  TUS_BARAJ_PUANI,
} from "./tusScoring.js";

describe("tusScoring", () => {
  it("net = doğru - yanlış/4, negatif olmaz", () => {
    expect(computeNet(100, 20)).toBe(95);
    expect(computeNet(0, 0)).toBe(0);
    expect(computeNet(10, 80)).toBe(0); // negatif → 0
  });

  it("computeBlank: 100 - doğru - yanlış, negatif olmaz", () => {
    expect(computeBlank(80, 20)).toBe(0);
    expect(computeBlank(0, 0)).toBe(100);
    expect(computeBlank(80, 30)).toBe(0); // 110>100 → negatifi 0'a clamp
  });

  it("isSectionOverflow: doğru+yanlış 100'ü aşıyorsa true", () => {
    expect(isSectionOverflow(80, 20)).toBe(false); // tam 100
    expect(isSectionOverflow(80, 21)).toBe(true);
    expect(isSectionOverflow(0, 0)).toBe(false);
  });

  it("computeStandardPuan: net ortalamaya eşitse 50 döner", () => {
    expect(computeStandardPuan(TEMEL_ORTALAMA, TEMEL_ORTALAMA, TEMEL_STDDEV)).toBe(50);
    expect(computeStandardPuan(KLINIK_ORTALAMA + KLINIK_STDDEV, KLINIK_ORTALAMA, KLINIK_STDDEV)).toBe(60); // +1 stddev → +10 puan
  });

  it("computeTPuani / computeKPuani: net ortalamalarda ikisi de 50 olur", () => {
    expect(computeTPuani(TEMEL_ORTALAMA, KLINIK_ORTALAMA)).toBe(50);
    expect(computeKPuani(TEMEL_ORTALAMA, KLINIK_ORTALAMA)).toBe(50);
  });

  it("T Puanı temel ağırlıklı, K Puanı klinik ağırlıklıdır (aynı girdide farklı sonuç verir)", () => {
    // Temel neti ortalamanın çok üstünde, klinik net ortalamada → T Puanı > K Puanı olmalı
    const temelNet = TEMEL_ORTALAMA + 2 * TEMEL_STDDEV;
    const klinikNet = KLINIK_ORTALAMA;
    const t = computeTPuani(temelNet, klinikNet);
    const k = computeKPuani(temelNet, klinikNet);
    expect(t).toBeGreaterThan(k);
  });

  it("ağırlıklar toplamı 1 eder", () => {
    expect(T_PUANI_AGIRLIK.temel + T_PUANI_AGIRLIK.klinik).toBe(1);
    expect(K_PUANI_AGIRLIK.temel + K_PUANI_AGIRLIK.klinik).toBe(1);
  });

  it("calculateTusResult temel/klinik neti ve her iki puanı doğru üretir", () => {
    const r = calculateTusResult({
      temelDogru: 90,
      temelYanlis: 20, // net 85
      klinikDogru: 80,
      klinikYanlis: 20, // net 75
    });
    expect(r.temelNet).toBe(85);
    expect(r.klinikNet).toBe(75);
    expect(r.toplamNet).toBe(160);
    expect(r.tPuani).toBe(computeTPuani(85, 75));
    expect(r.kPuani).toBe(computeKPuani(85, 75));
  });

  it("applyScoreDeduction: aktif değilse aynı puanı, aktifse %5 azaltılmış puanı verir", () => {
    expect(applyScoreDeduction(70, false)).toBe(70);
    expect(applyScoreDeduction(70, true)).toBe(66.5);
    expect(TUS_DEDUCTION_RATE).toBe(0.05);
  });

  it("puanBandi: baraj altı/üstü ve üst bantları doğru etiketler", () => {
    expect(puanBandi(TUS_BARAJ_PUANI - 1).label).toBe("Baraj Altı");
    expect(puanBandi(TUS_BARAJ_PUANI).label).toBe("Baraj Üstü");
    expect(puanBandi(60).label).toBe("İyi");
    expect(puanBandi(70).label).toBe("Yüksek");
  });

  it("netForTargetPuan: hedefe ulaşmak için gereken net, o puanı geri üretir", () => {
    const fixedTemelNet = 40;
    const { neededKlinikNet } = netForTargetPuan({
      targetPuan: 55,
      puanTuru: "K",
      fixedTemelNet,
      fixedKlinikNet: 0,
    });
    const roundTrip = computeKPuani(fixedTemelNet, neededKlinikNet);
    expect(Math.abs(roundTrip - 55)).toBeLessThan(0.2);
  });
});
