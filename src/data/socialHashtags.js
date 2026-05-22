/** Varsayılan hashtag havuzu — spam etiketler safetyChecker ile elenir. */
export const BASE_HASHTAGS = ["#TUS", "#TUS2026", "#TıpFakültesi", "#Tusoskop"];

export const SUBJECT_HASHTAGS = {
  Dahiliye: ["#Dahiliye", "#İçHastalıkları"],
  Pediatri: ["#Pediatri"],
  Farmakoloji: ["#Farmakoloji"],
  Patoloji: ["#Patoloji"],
  Mikrobiyoloji: ["#Mikrobiyoloji"],
  Biyokimya: ["#Biyokimya"],
  Fizyoloji: ["#Fizyoloji"],
  Anatomi: ["#Anatomi"],
  "Genel Cerrahi": ["#GenelCerrahi"],
  "Kadın Hastalıkları ve Doğum": ["#KadınDoğum"],
  "Küçük Stajlar": ["#KüçükStajlar"],
};

export function pickHashtags({ ders, extra = [], max = 6 }) {
  const pool = [...BASE_HASHTAGS];
  if (ders && SUBJECT_HASHTAGS[ders]) {
    pool.push(...SUBJECT_HASHTAGS[ders]);
  }
  pool.push(...extra);
  const unique = [...new Set(pool.map((h) => h.trim()).filter(Boolean))];
  return unique.slice(0, max);
}
