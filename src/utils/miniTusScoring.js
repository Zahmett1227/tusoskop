// Mini TUS — 20 soruluk karışık deneme için İSTATİSTİKSEL TAHMİN puanlaması.
//
// ÖNEMLİ: Bu modülün ürettiği "kalibrasyon puanı" ve yüzdelik, ÖSYM'nin gerçek
// T Puanı / K Puanı hesabıyla (bkz. src/seo/tusScoring.js) AYNI ŞEY DEĞİLDİR.
// Gerçek TUS 200 soruluk (100 temel + 100 klinik) bir sınavdır; burada 20 soruluk
// bir örneklemden tahmin üretiyoruz. Kullanıcıya asla "T Puanın X" denmez,
// yalnızca "tahmini kalibrasyon puanı" ve "istatistiksel tahmin" ibaresiyle sunulur.
//
// YÖNTEM: tusScoring.js'teki gerçek TUS ortalama/standart sapma sabitleri
// (TEMEL_ORTALAMA, TEMEL_STDDEV, KLINIK_ORTALAMA, KLINIK_STDDEV), bağımsız
// varyansların toplanabilirliği varsayımıyla 200 sorudan 20 soruya ölçeklenir:
//   ortalama_20  = (TEMEL_ORTALAMA + KLINIK_ORTALAMA) × (20/200)
//   varyans_20   = (TEMEL_STDDEV² + KLINIK_STDDEV²) × (20/200)
// Bu, "soru başına ortalama zorluk/varyans tüm bankada homojen" varsayımına
// dayanan bir yaklaşıklamadır — kesin bir dağılım değil, dürüst bir tahmindir.
// Kullanıcının standart skoru (z) bu tahmini dağılıma göre hesaplanır ve
// standart normal dağılım fonksiyonuyla bir yüzdelik dilime çevrilir.

import {
  TEMEL_ORTALAMA,
  TEMEL_STDDEV,
  KLINIK_ORTALAMA,
  KLINIK_STDDEV,
  TUS_TOTAL_QUESTIONS,
} from "../seo/tusScoring";

export const MINI_TUS_QUESTION_COUNT = 20;

const SCALE = MINI_TUS_QUESTION_COUNT / TUS_TOTAL_QUESTIONS;
const MINI_TUS_ORTALAMA = (TEMEL_ORTALAMA + KLINIK_ORTALAMA) * SCALE;
const MINI_TUS_VARYANS =
  (TEMEL_STDDEV * TEMEL_STDDEV + KLINIK_STDDEV * KLINIK_STDDEV) * SCALE;
const MINI_TUS_STDDEV = Math.sqrt(MINI_TUS_VARYANS);

/** Abramowitz–Stegun 7.1.26 yaklaşıklamasıyla hata fonksiyonu (max hata ~1.5e-7). */
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-ax * ax);
  return sign * y;
}

/** Standart normal dağılımın kümülatif dağılım fonksiyonu Φ(z). */
function normalCdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function round1(x) {
  return Math.round(x * 10) / 10;
}

/**
 * 20 soruluk karışık denemenin doğru/yanlış sayısından istatistiksel tahmin üretir.
 * Boş soru YOK (UI her soruyu cevaplatıyor) — wrong = total - correct.
 *
 * @param {{correct: number, total?: number}} p
 * @returns {{net:number, z:number, tahminiPuan:number, topPercent:number}}
 */
export function estimateMiniTusResult({ correct, total = MINI_TUS_QUESTION_COUNT }) {
  const c = Math.max(0, Number(correct) || 0);
  const wrong = Math.max(0, total - c);
  const net = Math.max(0, c - wrong / 4);

  const z = (net - MINI_TUS_ORTALAMA) / MINI_TUS_STDDEV;
  // T-skoru konvansiyonuyla tutarlı (ortalama 50, sapma 10) ama bilinçli olarak
  // "T Puanı" DENMEZ — gerçek ÖSYM formülüyle karıştırılmasın diye ayrı isim.
  const tahminiPuan = round1(Math.max(0, 50 + 10 * z));

  // "Türkiye'de tahmini ilk %X" — üstünde olduğun dilim. Küçük X = iyi performans.
  // Aşırı iddialı uçlara (ör. "ilk %1" veya "ilk %99") kilitlenmesin diye clamp.
  const topPercentRaw = (1 - normalCdf(z)) * 100;
  const topPercent = Math.min(99, Math.max(1, Math.round(topPercentRaw)));

  return { net: round1(net), z: round1(z), tahminiPuan, topPercent };
}
