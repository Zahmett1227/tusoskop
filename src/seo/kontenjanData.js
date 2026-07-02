// TUS Kontenjan Tablosu — 2026-TUS 1. Dönem (Mart 2026) yerleştirme sonuçları.
//
// Her dal için: kontenjan (toplam kadro), tabanPuan (dolan kontenjanlardaki
// en düşük tahmini/gerçek TUS puanı), yerlesen (dolan kadro sayısı), puanTuru
// (o dala yerleşmek için kullanılan puan: "T" = Temel ağırlıklı, "K" = Klinik
// ağırlıklı — bkz. tusScoring.js). Başarı sırası KASITLI OLARAK yok (kullanıcı
// talebiyle çıkarıldı).
//
// tabanPuan === null → o dalda kontenjan dolmadı (taban puan oluşmadı).
//
// puanTuru KAYNAĞI: ÖSYM TUS kılavuzu — Temel Tıp Bilimleri Testi ağırlıklı
// T Puanı yalnızca 7 temel bilim dalına yerleşmek için kullanılır (Anatomi,
// Fizyoloji, Tıbbi Biyokimya, Tıbbi Mikrobiyoloji, Tıbbi Patoloji, Tıbbi
// Farmakoloji, Histoloji ve Embriyoloji). Diğer tüm dallar Klinik ağırlıklı
// K Puanı ile değerlendirilir.
//
// KAYNAK: Kullanıcı tarafından sağlanan 2026-TUS 1. Dönem verisi.
// DÖNEM: 2026-TUS 1. Dönem (Mart 2026).
// Yeni dönem açıklandığında bu dosya güncellenmelidir (bkz. CLAUDE.md).

export const KONTENJAN_DONEM_LABEL = "2026-TUS 1. Dönem (Mart 2026)";

export const KONTENJAN_DATA = [
  { dal: "Acil Tıp", kontenjan: 583, tabanPuan: 45.02, yerlesen: 439, puanTuru: "K" },
  { dal: "Adli Tıp", kontenjan: 43, tabanPuan: 54.45, yerlesen: 40, puanTuru: "K" },
  { dal: "Aile Hekimliği", kontenjan: 1611, tabanPuan: 45.02, yerlesen: 1227, puanTuru: "K" },
  { dal: "Anatomi", kontenjan: 5, tabanPuan: 58.79, yerlesen: 5, puanTuru: "T" },
  { dal: "Anesteziyoloji ve Reanimasyon", kontenjan: 561, tabanPuan: 45.03, yerlesen: 493, puanTuru: "K" },
  { dal: "Askeri Sağlık Hizmetleri", kontenjan: 1, tabanPuan: null, yerlesen: 0, puanTuru: "K" },
  { dal: "Beyin ve Sinir Cerrahisi", kontenjan: 217, tabanPuan: 45.06, yerlesen: 152, puanTuru: "K" },
  { dal: "Deri ve Zührevi Hastalıkları", kontenjan: 306, tabanPuan: 59.01, yerlesen: 303, puanTuru: "K" },
  { dal: "Enfeksiyon Hastalıkları ve Klinik Mikrobiyoloji", kontenjan: 133, tabanPuan: 54.45, yerlesen: 127, puanTuru: "K" },
  { dal: "Fiziksel Tıp ve Rehabilitasyon", kontenjan: 162, tabanPuan: 53.33, yerlesen: 154, puanTuru: "K" },
  { dal: "Fizyoloji", kontenjan: 7, tabanPuan: 61.16, yerlesen: 6, puanTuru: "T" },
  { dal: "Genel Cerrahi", kontenjan: 533, tabanPuan: 45.19, yerlesen: 274, puanTuru: "K" },
  { dal: "Göz Hastalıkları", kontenjan: 316, tabanPuan: 60.08, yerlesen: 313, puanTuru: "K" },
  { dal: "Göğüs Cerrahisi", kontenjan: 104, tabanPuan: 45.14, yerlesen: 69, puanTuru: "K" },
  { dal: "Göğüs Hastalıkları", kontenjan: 216, tabanPuan: 45.5, yerlesen: 192, puanTuru: "K" },
  { dal: "Halk Sağlığı", kontenjan: 49, tabanPuan: 52.88, yerlesen: 46, puanTuru: "K" },
  { dal: "Hava ve Uzay Hekimliği", kontenjan: 2, tabanPuan: 57.8, yerlesen: 1, puanTuru: "K" },
  { dal: "Histoloji ve Embriyoloji", kontenjan: 16, tabanPuan: 61.05, yerlesen: 15, puanTuru: "T" },
  { dal: "Kadın Hastalıkları ve Doğum", kontenjan: 500, tabanPuan: 45.03, yerlesen: 382, puanTuru: "K" },
  { dal: "Kalp ve Damar Cerrahisi", kontenjan: 166, tabanPuan: 45.12, yerlesen: 123, puanTuru: "K" },
  { dal: "Kardiyoloji", kontenjan: 317, tabanPuan: 45.48, yerlesen: 296, puanTuru: "K" },
  { dal: "Kulak, Burun, Boğaz Hastalıkları", kontenjan: 291, tabanPuan: 52.01, yerlesen: 284, puanTuru: "K" },
  { dal: "Nöroloji", kontenjan: 298, tabanPuan: 45.47, yerlesen: 258, puanTuru: "K" },
  { dal: "Nükleer Tıp", kontenjan: 47, tabanPuan: 53.86, yerlesen: 44, puanTuru: "K" },
  { dal: "Ortopedi ve Travmatoloji", kontenjan: 287, tabanPuan: 46.57, yerlesen: 274, puanTuru: "K" },
  { dal: "Plastik, Rekonstrüktif ve Estetik Cerrahi", kontenjan: 209, tabanPuan: 61.78, yerlesen: 210, puanTuru: "K" },
  { dal: "Radyasyon Onkolojisi", kontenjan: 58, tabanPuan: 64.86, yerlesen: 55, puanTuru: "K" },
  { dal: "Radyoloji", kontenjan: 366, tabanPuan: 45.48, yerlesen: 352, puanTuru: "K" },
  { dal: "Ruh Sağlığı ve Hastalıkları", kontenjan: 229, tabanPuan: 55.95, yerlesen: 226, puanTuru: "K" },
  { dal: "Spor Hekimliği", kontenjan: 13, tabanPuan: 54.92, yerlesen: 13, puanTuru: "K" },
  { dal: "Sualtı Hekimliği ve Hiperbarik Tıp", kontenjan: 17, tabanPuan: 53.98, yerlesen: 17, puanTuru: "K" },
  { dal: "Tıbbi Biyokimya", kontenjan: 54, tabanPuan: 63.41, yerlesen: 52, puanTuru: "T" },
  { dal: "Tıbbi Ekoloji ve Hidroklimatoloji", kontenjan: 3, tabanPuan: 64.2, yerlesen: 3, puanTuru: "K" },
  { dal: "Tıbbi Farmakoloji", kontenjan: 11, tabanPuan: 63.66, yerlesen: 10, puanTuru: "T" },
  { dal: "Tıbbi Genetik", kontenjan: 41, tabanPuan: 65.82, yerlesen: 38, puanTuru: "K" },
  { dal: "Tıbbi Mikrobiyoloji", kontenjan: 79, tabanPuan: 45.33, yerlesen: 78, puanTuru: "T" },
  { dal: "Tıbbi Patoloji", kontenjan: 158, tabanPuan: 54.36, yerlesen: 150, puanTuru: "T" },
  { dal: "Çocuk Cerrahisi", kontenjan: 157, tabanPuan: 45.48, yerlesen: 61, puanTuru: "K" },
  { dal: "Çocuk Sağlığı ve Hastalıkları", kontenjan: 1014, tabanPuan: 45.0, yerlesen: 486, puanTuru: "K" },
  { dal: "Çocuk ve Ergen Ruh Sağlığı ve Hastalıkları", kontenjan: 102, tabanPuan: 46.73, yerlesen: 102, puanTuru: "K" },
  { dal: "Üroloji", kontenjan: 206, tabanPuan: 52.98, yerlesen: 196, puanTuru: "K" },
  { dal: "İç Hastalıkları", kontenjan: 646, tabanPuan: 45.0, yerlesen: 540, puanTuru: "K" },
];

export const KONTENJAN_DAL_COUNT = KONTENJAN_DATA.length;
export const KONTENJAN_TOPLAM = KONTENJAN_DATA.reduce((sum, r) => sum + r.kontenjan, 0);
export const KONTENJAN_TOPLAM_YERLESEN = KONTENJAN_DATA.reduce((sum, r) => sum + r.yerlesen, 0);
