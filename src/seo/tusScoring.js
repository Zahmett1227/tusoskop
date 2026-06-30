// TUS tahmini puan hesabı — net → puan ÇAPA tablosu + lineer interpolasyon.
//
// ÖNEMLİ: Sonuç YALNIZCA TAHMİNİDİR. Gerçek TUS puanı, ÖSYM'nin ilgili dönemdeki
// ortalama ve standart sapmasına göre standardize edilir; bu araç geçmiş
// eğilimlere dayalı yaklaşık bir değer verir.
//
// Tek doğruluk kaynağı: hem React hesaplayıcı (PublicSeoPages.jsx → SeoLandingPage)
// hem de statik prerender (scripts/generate-seo-pages.mjs içindeki satır-içi JS)
// bu çapa tablosunu kullanır.

// TUS: 120 Temel Tıp + 120 Klinik Tıp = 240 soru.
export const TUS_SECTION_QUESTIONS = 120;
export const TUS_TOTAL_QUESTIONS = 240;

// Net → tahmini TUS puanı çapa noktaları (kullanıcı onaylı eğri).
// Toplam net (Temel net + Klinik net) üzerinden okunur.
export const TUS_SCORE_ANCHORS = [
  [40, 45],
  [60, 52],
  [75, 56],
  [95, 62],
  [110, 66],
  [120, 68],
  [140, 72],
  [160, 75],
];

function round1(x) {
  return Math.round(x * 10) / 10;
}

/** Bir bölümün neti: doğru − yanlış/4 (yanlış 4'te 1 götürür). Negatif olmaz. */
export function computeNet(correct, wrong) {
  const c = Number(correct) || 0;
  const w = Number(wrong) || 0;
  const net = c - w / 4;
  return net > 0 ? round1(net) : 0;
}

/**
 * Toplam netten tahmini TUS puanı (çapa tablosu + lineer interpolasyon).
 * - İlk çapanın altında: (0,0)→ilk çapa arası lineer.
 * - Son çapanın üstünde: son çapa değeri (tavan).
 */
export function estimateTusScore(net) {
  const n = Number(net);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const a = TUS_SCORE_ANCHORS;
  const first = a[0];
  const last = a[a.length - 1];
  if (n <= first[0]) {
    return round1((first[1] * n) / first[0]);
  }
  if (n >= last[0]) {
    return last[1];
  }
  for (let i = 0; i < a.length - 1; i++) {
    const [n0, p0] = a[i];
    const [n1, p1] = a[i + 1];
    if (n >= n0 && n <= n1) {
      const t = (n - n0) / (n1 - n0);
      return round1(p0 + t * (p1 - p0));
    }
  }
  return last[1];
}

/** Puan aralığına göre kısa etiket + tavsiye. */
export function tusScoreBand(score) {
  const s = Number(score) || 0;
  if (s >= 68) return { label: "Yüksek", advice: "Rekabetçi branşlar için güçlü bir aralık." };
  if (s >= 60) return { label: "İyi", advice: "Birçok branş için yeterli; netlerini biraz daha yükselt." };
  if (s >= 54) return { label: "Orta", advice: "Temel ve klinik açıklarını kapatmaya odaklan." };
  return { label: "Geliştirilmeli", advice: "Düzenli soru çözümü ve tekrarla net artışı hedefle." };
}

/**
 * Temel/Klinik doğru-yanlıştan tam sonuç paketi.
 * @returns {{temelNet:number, klinikNet:number, toplamNet:number, score:number, band:{label,advice}}}
 */
export function calculateTusResult({ temelDogru, temelYanlis, klinikDogru, klinikYanlis }) {
  const temelNet = computeNet(temelDogru, temelYanlis);
  const klinikNet = computeNet(klinikDogru, klinikYanlis);
  const toplamNet = round1(temelNet + klinikNet);
  const score = estimateTusScore(toplamNet);
  return { temelNet, klinikNet, toplamNet, score, band: tusScoreBand(score) };
}
