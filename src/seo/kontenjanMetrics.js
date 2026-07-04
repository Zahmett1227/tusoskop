// Kontenjan rekabet metrikleri — hem React (PublicSeoPages.jsx) hem statik
// prerender (scripts/generate-seo-pages.mjs) tarafından kullanılan tek doğruluk
// kaynağı. Taban puan tek başına yanıltıcı olduğundan (bkz. kontenjanData.js),
// bir dalın gerçek rekabetini ORTALAMA puandan türetilen bir "rekabet rozeti" ve
// kontenjan doluluğu ile birlikte anlatırız.

// Rekabet rozeti, yerleşen adayların ORTALAMA puanına göre belirlenir.
// Eşikler 2026-TUS 1. Dönem dağılımına göre kalibre edilmiştir.
export const REKABET_TIERS = {
  cokRekabetci: { key: "cokRekabetci", label: "Çok Rekabetçi", rank: 4 },
  rekabetci: { key: "rekabetci", label: "Rekabetçi", rank: 3 },
  orta: { key: "orta", label: "Orta", rank: 2 },
  erisilebilir: { key: "erisilebilir", label: "Erişilebilir", rank: 1 },
  dolmadi: { key: "dolmadi", label: "Kontenjan Açık", rank: 0 },
};

// Ortalama puan eşikleri (>= sınır).
export const REKABET_ESIK = {
  cokRekabetci: 67,
  rekabetci: 60,
  orta: 52,
};

/** Kontenjan doluluk oranı (0–1). Kontenjan yoksa null. */
export function getDoluluk(row) {
  if (!row || !row.kontenjan) return null;
  return row.yerlesen / row.kontenjan;
}

/** Doluluk yüzdesi tam sayı olarak (ör. 0.986 → 99). */
export function getDolulukYuzde(row) {
  const d = getDoluluk(row);
  return d == null ? null : Math.round(d * 100);
}

/**
 * Bir dalın rekabet rozeti — yerleşenlerin ortalama puanından türetilir.
 * Kontenjan dolmadıysa "Kontenjan Açık" döner.
 */
export function getRekabetTier(row) {
  if (!row || row.tabanPuan == null || row.ortalamaPuan == null) {
    return REKABET_TIERS.dolmadi;
  }
  const o = row.ortalamaPuan;
  if (o >= REKABET_ESIK.cokRekabetci) return REKABET_TIERS.cokRekabetci;
  if (o >= REKABET_ESIK.rekabetci) return REKABET_TIERS.rekabetci;
  if (o >= REKABET_ESIK.orta) return REKABET_TIERS.orta;
  return REKABET_TIERS.erisilebilir;
}

/**
 * Bir adayın puanının, bir dala göre konumu:
 *   "rahat"   — puan ortalamanın üzerinde (rahat yerleşir)
 *   "sinirda" — puan taban ile ortalama arasında (girer ama alt sıralarda, rekabetçi)
 *   "uzak"    — puan tabanın altında (bu dönem yerleşemezdi)
 *   "acik"    — kontenjan dolmadı (baraj üstü herkes yerleşebilir)
 */
export function getMatchLevel(row, score) {
  if (!row) return "uzak";
  if (row.tabanPuan == null) return "acik";
  if (score < row.tabanPuan) return "uzak";
  if (row.ortalamaPuan != null && score >= row.ortalamaPuan) return "rahat";
  return "sinirda";
}
