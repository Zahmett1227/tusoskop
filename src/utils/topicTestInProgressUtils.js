import { isRecord, readLocalStorageJson } from "./safeLocalStorage";

/**
 * Yarım kalan konu testi — kaldığı yerden devam.
 * examInProgressUtils muadili; yalnızca bu key kullanılır (bitmiş özet/geçmişe dokunulmaz).
 */
export const TUSOSKOP_TOPIC_TEST_IN_PROGRESS_KEY = "tusoskopTopicTestInProgress";

export const TOPIC_TEST_IN_PROGRESS_SCHEMA_VERSION = 1;

/** @param {unknown} answers @param {number} count */
export function sanitizeTopicAnswers(answers, count) {
  const out = {};
  if (!answers || typeof answers !== "object") return out;
  for (const [key, value] of Object.entries(answers)) {
    const idx = Number(key);
    if (!Number.isInteger(idx) || idx < 0 || idx >= count) continue;
    if (!value || typeof value !== "object") continue;
    const selectedRaw = value.selected;
    const selected =
      selectedRaw === null || selectedRaw === undefined ? null : Number(selectedRaw);
    out[idx] = {
      selected: Number.isFinite(selected) ? selected : null,
      revealed: Boolean(value.revealed),
      correct: Boolean(value.correct),
    };
  }
  return out;
}

export function buildTopicTestPayload({
  ders,
  konu,
  countMode = null,
  questions,
  currentIndex,
  answers,
  score,
  streak,
}) {
  const questionIdsSnapshot = (questions || [])
    .map((q) => Number(q?.id))
    .filter((n) => Number.isFinite(n) && n > 0);
  const questionCount = questionIdsSnapshot.length;
  return {
    schemaVersion: TOPIC_TEST_IN_PROGRESS_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    ders: String(ders || ""),
    konu: String(konu || ""),
    countMode: countMode ?? null,
    questionCount,
    questionIdsSnapshot,
    currentIndex: Math.min(Math.max(0, Number(currentIndex) || 0), Math.max(0, questionCount - 1)),
    answers: sanitizeTopicAnswers(answers, questionCount),
    score: Math.max(0, Number(score) || 0),
    streak: Math.max(0, Number(streak) || 0),
  };
}

/**
 * @returns {{ ok: true, data: object } | { ok: false, reason: string }}
 */
export function validateTopicTestInProgress(raw) {
  if (!isRecord(raw)) return { ok: false, reason: "invalid" };
  const ders = raw.ders;
  const konu = raw.konu;
  if (typeof ders !== "string" || !ders.trim()) return { ok: false, reason: "no_ders" };
  if (typeof konu !== "string" || !konu.trim()) return { ok: false, reason: "no_konu" };

  const snapshot = Array.isArray(raw.questionIdsSnapshot)
    ? raw.questionIdsSnapshot.map(Number).filter((n) => Number.isFinite(n) && n > 0)
    : [];
  if (snapshot.length < 1) return { ok: false, reason: "no_snapshot" };

  const currentIndex = Number(raw.currentIndex);
  if (!Number.isFinite(currentIndex) || currentIndex < 0 || currentIndex >= snapshot.length) {
    return { ok: false, reason: "bad_index" };
  }

  return {
    ok: true,
    data: {
      schemaVersion: TOPIC_TEST_IN_PROGRESS_SCHEMA_VERSION,
      ders: String(ders),
      konu: String(konu),
      countMode: raw.countMode ?? null,
      questionCount: snapshot.length,
      questionIdsSnapshot: snapshot,
      currentIndex,
      answers: sanitizeTopicAnswers(raw.answers, snapshot.length),
      score: Math.max(0, Number(raw.score) || 0),
      streak: Math.max(0, Number(raw.streak) || 0),
      savedAt: typeof raw.savedAt === "string" ? raw.savedAt : null,
    },
  };
}

export function loadTopicTestInProgressRaw() {
  const parsed = readLocalStorageJson(TUSOSKOP_TOPIC_TEST_IN_PROGRESS_KEY, {
    fallback: null,
    clearOnError: true,
  });
  if (!isRecord(parsed)) {
    if (parsed != null && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(TUSOSKOP_TOPIC_TEST_IN_PROGRESS_KEY);
      } catch {
        /* ignore */
      }
    }
    return null;
  }
  return parsed;
}

/** Kayıtlı yarım testi doğrula; uyumsuzsa temizle. @returns {object|null} data */
export function loadValidatedTopicTestInProgress() {
  const raw = loadTopicTestInProgressRaw();
  if (!raw) return null;
  const result = validateTopicTestInProgress(raw);
  if (!result.ok) {
    clearTopicTestInProgress();
    return null;
  }
  return result.data;
}

export function saveTopicTestInProgress(payload) {
  if (typeof window === "undefined" || !payload) return;
  try {
    localStorage.setItem(TUSOSKOP_TOPIC_TEST_IN_PROGRESS_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function clearTopicTestInProgress() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TUSOSKOP_TOPIC_TEST_IN_PROGRESS_KEY);
  } catch {
    /* ignore */
  }
}

export function hasMeaningfulTopicProgress(data) {
  if (!data) return false;
  const answered = data.answers && Object.keys(data.answers).length > 0;
  return Boolean(answered) || Number(data.currentIndex) > 0;
}

/** UI: "12 / 40 soru" gibi kısa etiket. */
export function formatTopicResumeProgress(data) {
  if (!data) return "";
  const total = Number(data.questionCount) || (data.questionIdsSnapshot?.length ?? 0);
  const answered = data.answers ? Object.keys(data.answers).length : 0;
  const position = Math.max(answered, Number(data.currentIndex) || 0);
  return `${Math.min(position, total)} / ${total} soru`;
}
