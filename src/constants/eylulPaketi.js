// "Eylül Paketi" — mevcut 3 aylık Plus planının (plus_3m, 209,70₺) sezonluk
// çerçevesi. Fiyat DEĞİŞMEZ, yalnızca sunum/çerçeve değişir (plan §07-7, K6).
//
// Tek doğruluk kaynağı: hem /fiyatlandirma kıyas bloğu, hem uygulama içi
// satın alma ekranı (PremiumInfoScreen), hem funnel sonuç ekranları buradan
// beslenir — çıpa ve fiyat her yerde birebir tutarlı kalsın.
//
// DÜRÜSTLÜK GUARDRAIL'İ (plan K6 riski): dershane ile Tusoskop AYNI ürün değil
// (dershane = ders anlatımı + mentorluk; Tusoskop = soru çözme + akıllı tekrar
// motoru). Kıyas bir ÇERÇEVEDİR, birebir eşdeğerlik iddiası değil. Bu yüzden
// kanıt satırı (proofLine) her kıyasın yanında zorunludur — ucuzluk tek başına
// "kalitesiz" okunmasın. Çıpa gerçeğe dayanır ("~120.000₺'ye ulaşıyor"),
// şişirilmez.

// FİYAT OTORİTESİ: gerçek ödeme tutarı `src/config/plusPlans.js` (plus_3m:
// totalPrice 209.7 / totalPriceLabel "209,70 TL") ve sunucudaki PAYTR_PLANS'tır.
// Buradaki priceLabel yalnızca PAZARLAMA sunumu (₺ sembollü kısa biçim). Fiyat
// değişirse ikisi birlikte güncellenmeli (statik prerender'daki
// generate-seo-pages.mjs > renderPricingComparison de dâhil).
/** 3 aylık planın sezonluk adı ve çıpası. plus_3m ile aynı fiyat. */
export const EYLUL_PAKETI = {
  planId: "plus_3m",
  name: "Eylül Paketi",
  tagline: "TUS'a kadar sınırsız her şey",
  durationLabel: "90 gün · sınava kadar sınırsız",
  priceLabel: "209,70₺",
  perDayLabel: "günde ≈2,3₺",
  // Kanıt satırı — kıyasın yanında ZORUNLU (bkz. guardrail notu).
  proofLine: "7.000+ soru · akıllı tekrar (FSRS) · haftalık Türkiye ligi",
};

/** Referans dershane çıpası — kullanıcı beyanı: "TUS dershaneleri ~120.000₺". */
export const DERSHANE_ANCHOR = {
  priceLabel: "≈120.000₺",
  // Abartısız çerçeve: dershane paketleri bu banda ulaşıyor, hepsi tam bu değil.
  note: "TUS dershane paketleri bu banda ulaşıyor",
};

/** Kıyas kartı satırları (dershane vs online kamp vs Eylül Paketi). */
export const PRICING_COMPARISON_ROWS = [
  {
    key: "dershane",
    title: "TUS Dershanesi",
    price: "≈120.000₺",
    detail: "Ders anlatımı + sınıf temposu",
    highlight: false,
  },
  {
    key: "eylul",
    title: "Tusoskop Eylül Paketi",
    price: "209,70₺",
    detail: "Sınava kadar sınırsız soru + akıllı tekrar",
    highlight: true,
  },
];
