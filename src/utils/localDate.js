/**
 * Yerel (cihaz saat dilimine göre) gün anahtarı yardımcıları.
 * Format: "YYYY-MM-DD".
 *
 * Streak, leaderboard ve FSRS istatistikleri AYNI gün eksenini kullanmalı;
 * aksi halde (ör. streak UTC, FSRS yerel) TR gibi UTC+3 bölgelerinde gece
 * 00:00–03:00 arasındaki çözümler farklı günlere yazılıp seri haksız yere kopar.
 */

function pad2(value) {
  return String(value).padStart(2, "0");
}

/** Verilen tarihin yerel gün anahtarını döndürür. */
export function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Bugüne göre `offset` gün kaydırılmış yerel gün anahtarı (dün için -1). */
export function getLocalDateKeyOffset(offset, base = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return getLocalDateKey(d);
}

/**
 * `dateKey` bugün mü, dün mü, yoksa daha eski mi? Streak tazeliği için.
 * @returns {"today"|"yesterday"|"stale"|"none"}
 */
export function classifyDateKey(dateKey, now = new Date()) {
  if (!dateKey) return "none";
  if (dateKey === getLocalDateKey(now)) return "today";
  if (dateKey === getLocalDateKeyOffset(-1, now)) return "yesterday";
  return "stale";
}
