const PREFIXES = [
  "DrTus", "Tusiyer", "TusAday", "MedPro", "KlinikUs",
  "PatolojiUs", "FarmakoUs", "DahiliyeUs", "AnatomUs", "BiyokimUs",
  "MikroUs", "PediUs", "CerrahUs", "KadDogUs", "FizyolUs",
];

const ADJECTIVES = [
  "Güçlü", "Hızlı", "Kararlı", "Odaklı", "Azimli",
];

export function generateSuggestedNickname() {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const num = Math.floor(1000 + Math.random() * 8999);
  return `${prefix}${num}`;
}

export function generateNicknameSuggestions(count = 3) {
  const results = new Set();
  while (results.size < count) {
    results.add(generateSuggestedNickname());
  }
  return [...results];
}

export function normalizeNickname(nick) {
  return String(nick || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function validateNickname(nick) {
  if (!nick || typeof nick !== "string") {
    return { valid: false, error: "Rumuz boş olamaz." };
  }
  const trimmed = nick.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: "Rumuz en az 3 karakter olmalı." };
  }
  if (trimmed.length > 20) {
    return { valid: false, error: "Rumuz en fazla 20 karakter olabilir." };
  }
  if (!/^[a-zA-ZğüşıöçĞÜŞİÖÇ0-9_]+$/.test(trimmed)) {
    return { valid: false, error: "Rumuz yalnızca harf, rakam ve alt çizgi içerebilir." };
  }
  if (/^_+$/.test(trimmed)) {
    return { valid: false, error: "Geçerli bir rumuz gir." };
  }
  return { valid: true, error: null };
}
