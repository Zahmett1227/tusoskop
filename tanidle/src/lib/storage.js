// localStorage tabanlı kalıcılık (giriş gerekmez).
// İstatistikler + günlük oyun durumu burada saklanır.

const STATS_KEY = "tanidle.stats.v1";
const STATE_PREFIX = "tanidle.daily."; // + dateKey

const DEFAULT_STATS = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastWonDayIndex: null,
  // kaçıncı tahminde çözüldü dağılımı (1..maxGuesses)
  distribution: {},
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* kota dolu / gizli mod — sessizce yut */
  }
}

export function loadStats() {
  return { ...DEFAULT_STATS, ...read(STATS_KEY, {}) };
}

// Bir oyun sonucunu istatistiklere işle.
// dayIndex ardışıklığı ile seri (streak) hesaplanır.
export function recordResult({ solved, guessNumber, dayIndex }) {
  const s = loadStats();
  s.played += 1;
  if (solved) {
    s.wins += 1;
    s.distribution[guessNumber] = (s.distribution[guessNumber] || 0) + 1;
    if (s.lastWonDayIndex === dayIndex - 1) s.currentStreak += 1;
    else s.currentStreak = 1;
    s.lastWonDayIndex = dayIndex;
    s.bestStreak = Math.max(s.bestStreak, s.currentStreak);
  } else {
    s.currentStreak = 0;
  }
  write(STATS_KEY, s);
  return s;
}

export function loadDailyState(dateKey) {
  return read(STATE_PREFIX + dateKey, null);
}

export function saveDailyState(dateKey, state) {
  write(STATE_PREFIX + dateKey, state);
}
