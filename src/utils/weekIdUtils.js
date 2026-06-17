/**
 * ISO 8601 hafta kimliği yardımcıları. Hafta Pazartesi 00:00 başlar.
 * Format: "2026-W25"
 */

function getISOWeekYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

export function getCurrentWeekId(now = new Date()) {
  const { year, week } = getISOWeekYear(now);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function getWeekRange(weekId) {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

export function getTimeUntilWeekEnd(now = new Date()) {
  const weekId = getCurrentWeekId(now);
  const range = getWeekRange(weekId);
  if (!range) return null;
  const diff = range.end - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { days, hours, minutes };
}

export function formatWeekLabel(weekId) {
  const range = getWeekRange(weekId);
  if (!range) return weekId;
  const fmt = (d) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  return `${fmt(range.start)} – ${fmt(range.end)}`;
}
