// Günlük bulmaca seçimi — sunucusuz, deterministik.
// Tüm kullanıcılar aynı gün aynı vakayı görür (sosyal paylaşım için kritik).

// Oyunun 1 numaralı günü.
export const EPOCH = Date.UTC(2025, 0, 1); // 2025-01-01
const DAY_MS = 86_400_000;

// Yerel güne göre gün indeksi (TR kullanıcıları için yerel gece yarısı sınırı).
export function dayIndexFromDate(date = new Date()) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((local.getTime() - EPOCH) / DAY_MS);
}

// Bugünün bulmaca numarası (1 tabanlı, kullanıcıya gösterilir).
export function puzzleNumber(date = new Date()) {
  return dayIndexFromDate(date) + 1;
}

// O güne karşılık gelen vakayı havuzdan seç.
export function pickDaily(questions, date = new Date()) {
  if (!questions?.length) return null;
  const idx = ((dayIndexFromDate(date) % questions.length) + questions.length) % questions.length;
  return { question: questions[idx], number: puzzleNumber(date) };
}

// YYYY-MM-DD anahtarı (Firestore / localStorage için).
export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
