// Mini TUS (20 soruluk kalibrasyon) tahmini puan + yüzdelik hesabı.
//
// Gerçek TUS 200 soru (100 Temel + 100 Klinik); bu ürün 20 soru (10 Temel + 10
// Klinik). Bölüm başına 10 soruluk mini-net, 100 soruluk bölüme ×10 ile
// PROJEKTE edilip `tusScoring.js`'in gerçek formülüne verilir → TAHMİNİ T/K puan.
//
// ÖNEMLİ (plan riski): Sonuç yalnızca TAHMİNİ / KALİBRASYON'dur. 20 soruluk
// örneklem küçük olduğu için puan bir ±band (aralık) olarak sunulur, tek nokta
// olarak değil. Dil her yerde "tahmini / kalibrasyon / aralık" olmalı.

import {
  computeTPuani,
  computeKPuani,
  puanBandi,
  TUS_SECTION_QUESTIONS,
  TEMEL_ORTALAMA,
  KLINIK_ORTALAMA,
} from "./tusScoring";

/** Mini TUS'ta bölüm başına soru sayısı (10 Temel + 10 Klinik = 20). */
export const MINI_TUS_PER_SECTION = 10;

/** Küçük örneklem belirsizliği için puan gösterim bandı (± puan). */
export const MINI_TUS_PUAN_BAND = 5;

/**
 * Küçük örneklem düzeltmesi (shrinkage): 20 soruluk sonuç, gerçek 200 soruluk
 * performansın yüksek varyanslı bir tahminidir. Ham ×10 projeksiyonu uç
 * skorları abartır (ör. 15/20 → "ilk %1" — istatistiksel olarak savunulamaz).
 * Projekte net, bölüm ortalamasına doğru bu oranda çekilir (0=tamamen ortalama,
 * 1=ham projeksiyon). 0.55 kalibrasyonu makul/dürüst buckets veriyor.
 */
export const MINI_TUS_SHRINK = 0.55;

/**
 * 20 soruluk testten "ilk %X" iddiası için taban: 20 soruyla top-1% ile top-3%
 * ayırt edilemez, o yüzden yüzdelik en fazla bu kadar iddialı olur.
 */
export const MINI_TUS_MIN_YUZDELIK = 3;

function round1(x) {
  return Math.round(x * 10) / 10;
}

/** Abramowitz-Stegun 7.1.26 yaklaşımıyla hata fonksiyonu (erf). */
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

/** Standart normal kümülatif dağılım Φ(z). */
export function normalCdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/**
 * Standart puandan (ortalama 50, sd 10) Türkiye genelinde ALTINDA kalan
 * yüzdelik. Puan zaten z-skor tabanlı olduğu için normal CDF tutarlıdır.
 * 1-99 aralığına clamp edilir (uçlarda "%0 / %100" iddiası yapılmaz).
 */
export function percentileBelow(puan) {
  const p = normalCdf((Number(puan) - 50) / 10) * 100;
  return Math.min(99, Math.max(1, Math.round(p)));
}

/** Mini bölüm neti: doğru − yanlış/4 (boş yok varsayımı; cevap = doğru + yanlış). */
function miniSectionNet(dogru, cevaplanan) {
  const d = Number(dogru) || 0;
  const yanlis = Math.max(0, (Number(cevaplanan) || 0) - d);
  return d - yanlis / 4;
}

/**
 * 10 soruluk mini-neti 100 soruluk bölüme projekte et; bölüm ortalamasına doğru
 * shrinkage uygula (küçük örneklem düzeltmesi), [0,100]'e clamp.
 */
function projectToFullSection(miniNet, sectionMean) {
  const raw = miniNet * (TUS_SECTION_QUESTIONS / MINI_TUS_PER_SECTION);
  const shrunk = sectionMean + MINI_TUS_SHRINK * (raw - sectionMean);
  return Math.min(TUS_SECTION_QUESTIONS, Math.max(0, shrunk));
}

/**
 * Temel/Klinik doğru + cevaplanan sayısından tahmini Mini TUS sonucu.
 * @returns {{
 *   dogru: number, toplamCevap: number,
 *   temelDogru: number, klinikDogru: number,
 *   tPuani: number, kPuani: number,
 *   tBand: {label:string,advice:string}, kBand: {label:string,advice:string},
 *   tPuanAralik: [number, number], kPuanAralik: [number, number],
 *   enIyiPuan: number, enIyiPuanTuru: "T"|"K",
 *   ilkYuzdelik: number   // "Türkiye'de tahmini ilk %X"
 * }}
 */
export function estimateMiniTusResult({ temelDogru, temelCevap, klinikDogru, klinikCevap }) {
  const temelNet100 = projectToFullSection(miniSectionNet(temelDogru, temelCevap), TEMEL_ORTALAMA);
  const klinikNet100 = projectToFullSection(miniSectionNet(klinikDogru, klinikCevap), KLINIK_ORTALAMA);

  const tPuani = computeTPuani(temelNet100, klinikNet100);
  const kPuani = computeKPuani(temelNet100, klinikNet100);
  const enIyiPuanTuru = kPuani >= tPuani ? "K" : "T";
  const enIyiPuan = Math.max(tPuani, kPuani);

  const band = MINI_TUS_PUAN_BAND;
  const aralik = (p) => [Math.max(0, round1(p - band)), round1(p + band)];

  return {
    dogru: (Number(temelDogru) || 0) + (Number(klinikDogru) || 0),
    toplamCevap: (Number(temelCevap) || 0) + (Number(klinikCevap) || 0),
    temelDogru: Number(temelDogru) || 0,
    klinikDogru: Number(klinikDogru) || 0,
    tPuani,
    kPuani,
    tBand: puanBandi(tPuani),
    kBand: puanBandi(kPuani),
    tPuanAralik: aralik(tPuani),
    kPuanAralik: aralik(kPuani),
    enIyiPuan,
    enIyiPuanTuru,
    ilkYuzdelik: Math.max(MINI_TUS_MIN_YUZDELIK, 100 - percentileBelow(enIyiPuan)),
  };
}

/**
 * Funnel cevap dizisinden (`session.answers`) ve kampanya sorularından tahmini
 * sonuç. Her cevap `section` ile eşleştirilip Temel/Klinik doğru/cevap sayılır.
 */
export function estimateMiniTusFromAnswers(answers, questions) {
  const sectionById = new Map((questions || []).map((q) => [String(q.id), q.section]));
  let temelDogru = 0;
  let temelCevap = 0;
  let klinikDogru = 0;
  let klinikCevap = 0;
  for (const a of answers || []) {
    const section = sectionById.get(String(a?.questionId));
    if (section === "temel") {
      temelCevap += 1;
      if (a.isCorrect) temelDogru += 1;
    } else if (section === "klinik") {
      klinikCevap += 1;
      if (a.isCorrect) klinikDogru += 1;
    }
  }
  return estimateMiniTusResult({ temelDogru, temelCevap, klinikDogru, klinikCevap });
}
