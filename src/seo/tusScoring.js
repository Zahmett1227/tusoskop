// TUS tahmini puan hesabı — gerçek ÖSYM T Puanı / K Puanı formülüne dayanır.
//
// ÖNEMLİ: Sonuç YALNIZCA TAHMİNİDİR. ÖSYM, dönem bazlı ortalama ve standart
// sapma değerlerini resmi olarak yayımlamaz (2018'den sonra değerlendirme
// raporları da kesildi); buradaki TEMEL_ORTALAMA/KLİNİK_ORTALAMA gibi referans
// değerler yakın dönem gözlemlerine dayalı YAKLAŞIK tahminlerdir.
//
// FORMÜL (ÖSYM'nin 2024 Ağustos kılavuzuyla yürürlüğe giren ağırlıklar):
//   Standart Puan (SP)  = 50 + 10 × (Net − Ortalama) / Standart Sapma  (bölüm başına ayrı ayrı)
//   T Puanı (Temel ağırlıklı) = 0.6 × SP(Temel) + 0.4 × SP(Klinik)  — 7 temel bilim dalı için
//   K Puanı (Klinik ağırlıklı) = 0.4 × SP(Temel) + 0.6 × SP(Klinik) — diğer tüm dallar için
//   Baraj: T veya K puanından 45'in altında kalan aday o puan türüyle tercih yapamaz.
//
// Tek doğruluk kaynağı: hem React hesaplayıcı (PublicSeoPages.jsx → SeoLandingPage)
// hem de statik prerender (scripts/generate-seo-pages.mjs içindeki satır-içi JS)
// bu modülün sabitlerini ve formülünü kullanır.

// TUS: 100 Temel Tıp + 100 Klinik Tıp = 200 soru.
export const TUS_SECTION_QUESTIONS = 100;
export const TUS_TOTAL_QUESTIONS = 200;

// Referans ortalama/standart sapma — yakın dönem gözlemlerine dayalı yaklaşık
// değerler. Gerçek dönem istatistikleri ÖSYM tarafından yayımlanmadığı için
// kesin değildir.
export const TEMEL_ORTALAMA = 16.87;
export const TEMEL_STDDEV = 19.6;
export const KLINIK_ORTALAMA = 23.07;
export const KLINIK_STDDEV = 20.2;

// ÖSYM'nin 2024 Ağustos kılavuzuyla yürürlüğe giren ağırlık katsayıları.
export const T_PUANI_AGIRLIK = { temel: 0.6, klinik: 0.4 };
export const K_PUANI_AGIRLIK = { temel: 0.4, klinik: 0.6 };

// T veya K puanından bu değerin altında kalan aday o puan türüyle tercih yapamaz.
export const TUS_BARAJ_PUANI = 45;

// %5 puan kesintisi: daha önce TUS ile yerleşip devam etmemiş adaylar için
// (ÖSYM TUS kılavuzu kuralı). Kullanıcı toggle ile açıp kapatır.
export const TUS_DEDUCTION_RATE = 0.05;

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

/** Bölümdeki boş soru sayısı (100 − doğru − yanlış). Negatif olmaz. */
export function computeBlank(correct, wrong) {
  const c = Number(correct) || 0;
  const w = Number(wrong) || 0;
  const blank = TUS_SECTION_QUESTIONS - c - w;
  return blank >= 0 ? blank : 0;
}

/** Bölüm girişi 100 soruyu aşıyor mu (girdi hatası). */
export function isSectionOverflow(correct, wrong) {
  const c = Number(correct) || 0;
  const w = Number(wrong) || 0;
  return c + w > TUS_SECTION_QUESTIONS;
}

/** Ham net → standart puan (ortalama 50, standart sapma 10). */
export function computeStandardPuan(net, ortalama, stddev) {
  const n = Number(net) || 0;
  return 50 + (10 * (n - ortalama)) / stddev;
}

/** Temel/Klinik netten T Puanı (Temel ağırlıklı, 0.6/0.4). */
export function computeTPuani(temelNet, klinikNet) {
  const spTemel = computeStandardPuan(temelNet, TEMEL_ORTALAMA, TEMEL_STDDEV);
  const spKlinik = computeStandardPuan(klinikNet, KLINIK_ORTALAMA, KLINIK_STDDEV);
  const puan = T_PUANI_AGIRLIK.temel * spTemel + T_PUANI_AGIRLIK.klinik * spKlinik;
  return round1(Math.max(0, puan));
}

/** Temel/Klinik netten K Puanı (Klinik ağırlıklı, 0.4/0.6). */
export function computeKPuani(temelNet, klinikNet) {
  const spTemel = computeStandardPuan(temelNet, TEMEL_ORTALAMA, TEMEL_STDDEV);
  const spKlinik = computeStandardPuan(klinikNet, KLINIK_ORTALAMA, KLINIK_STDDEV);
  const puan = K_PUANI_AGIRLIK.temel * spTemel + K_PUANI_AGIRLIK.klinik * spKlinik;
  return round1(Math.max(0, puan));
}

// %5 kesinti uygulanmış puan (aktifse); değilse puanı değiştirmeden döner.
export function applyScoreDeduction(score, active) {
  const s = Number(score) || 0;
  if (!active) return s;
  return round1(s * (1 - TUS_DEDUCTION_RATE));
}

/** Puana göre kısa etiket + tavsiye (baraj-farkında). */
export function puanBandi(score) {
  const s = Number(score) || 0;
  if (s < TUS_BARAJ_PUANI) {
    return { label: "Baraj Altı", advice: `${TUS_BARAJ_PUANI} puan barajının altındasın; bu puan türüyle tercih hakkın doğmuyor.` };
  }
  if (s < 55) return { label: "Baraj Üstü", advice: "Barajı geçtin; rekabetin düşük olduğu dallarda seçeneklerin olabilir." };
  if (s < 65) return { label: "İyi", advice: "Birçok branş için yeterli; netlerini biraz daha yükselt." };
  return { label: "Yüksek", advice: "Rekabetçi branşlar için güçlü bir aralık." };
}

/**
 * Temel/Klinik doğru-yanlıştan tam sonuç paketi: her iki puan türü de (T ve K) hesaplanır.
 */
export function calculateTusResult({ temelDogru, temelYanlis, klinikDogru, klinikYanlis }) {
  const temelNet = computeNet(temelDogru, temelYanlis);
  const klinikNet = computeNet(klinikDogru, klinikYanlis);
  const toplamNet = round1(temelNet + klinikNet);
  const tPuani = computeTPuani(temelNet, klinikNet);
  const kPuani = computeKPuani(temelNet, klinikNet);
  return {
    temelNet,
    klinikNet,
    toplamNet,
    tPuani,
    kPuani,
    tBand: puanBandi(tPuani),
    kBand: puanBandi(kPuani),
  };
}

/**
 * Ters hesap: hedef T veya K puanına ulaşmak için, bir bölümün neti SABİT
 * tutulurken diğer bölümde gereken net (z-skor formülünün cebirsel tersi).
 * Section sınırlarının (0-100) dışına çıkarsa clamp edilmeden ham değer döner;
 * çağıran taraf "ulaşılamaz" durumunu bu sınırlara göre değerlendirir.
 */
export function netForTargetPuan({ targetPuan, puanTuru, fixedTemelNet = 0, fixedKlinikNet = 0 }) {
  const target = Number(targetPuan);
  if (!Number.isFinite(target)) return { neededTemelNet: null, neededKlinikNet: null };
  const agirlik = puanTuru === "T" ? T_PUANI_AGIRLIK : K_PUANI_AGIRLIK;

  const spTemelFixed = computeStandardPuan(fixedTemelNet, TEMEL_ORTALAMA, TEMEL_STDDEV);
  const neededSpKlinik = (target - agirlik.temel * spTemelFixed) / agirlik.klinik;
  const neededKlinikNet = round1(KLINIK_ORTALAMA + (KLINIK_STDDEV * (neededSpKlinik - 50)) / 10);

  const spKlinikFixed = computeStandardPuan(fixedKlinikNet, KLINIK_ORTALAMA, KLINIK_STDDEV);
  const neededSpTemel = (target - agirlik.klinik * spKlinikFixed) / agirlik.temel;
  const neededTemelNet = round1(TEMEL_ORTALAMA + (TEMEL_STDDEV * (neededSpTemel - 50)) / 10);

  return { neededTemelNet, neededKlinikNet };
}
