import { readLocalStorageJson } from "./safeLocalStorage";
import { normalizeAnswerValue } from "./examUtils";

/** localStorage — mevcut anahtar sabit kalmalı */
export const QUESTION_HISTORY_STORAGE_KEY = "tusoskop-question-history";
export const QUESTION_HISTORY_SCHEMA_VERSION = 1;

const VALID_SOURCES = new Set(["topic", "study", "review", "exam"]);

export function normalizeHistorySource(modeOrSource) {
  const raw = String(modeOrSource || "study").toLowerCase();
  if (raw === "topic") return "topic";
  if (raw === "review") return "review";
  if (raw === "exam") return "exam";
  return "study";
}

export function getQuestionIdFromQuestion(question) {
  const id = Number(question?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function normalizeSelectedForHistory(value, optionCount = 5) {
  const normalized = normalizeAnswerValue(value);
  if (normalized === null) return null;
  const maxIndex = Math.max(0, Number(optionCount) - 1);
  if (normalized < 0 || normalized > maxIndex) return null;
  return normalized;
}

/**
 * Firestore + TopicTracker için birleşik history kaydı.
 * previous: Firestore doc veya eski local satır.
 */
export function buildNextQuestionHistoryEntry(
  question,
  selectedAnswer,
  previous = null,
  source = "study",
  now = new Date()
) {
  const questionId = getQuestionIdFromQuestion(question);
  if (!questionId) return null;

  const optionCount = Array.isArray(question?.options) ? question.options.length : 5;
  const lastAnswer = normalizeSelectedForHistory(selectedAnswer, optionCount);
  const correctAnswer = Number(question.correct);
  const lastCorrect =
    lastAnswer !== null &&
    Number.isFinite(correctAnswer) &&
    lastAnswer === correctAnswer;

  const nowIso = now instanceof Date ? now.toISOString() : new Date().toISOString();
  const prev = previous && typeof previous === "object" ? previous : null;

  const prevSolved = Math.max(0, Number(prev?.solvedCount) || 0);
  const prevCorrect = Math.max(0, Number(prev?.correctCount) || 0);
  const prevWrong = Math.max(0, Number(prev?.wrongCount) || 0);

  const firstSolvedAt =
    prev?.firstSolvedAt ||
    prev?.answeredAt ||
    nowIso;

  return {
    questionId,
    ders: String(question?.ders || prev?.ders || ""),
    konu: String(question?.konu || prev?.konu || ""),
    firstSolvedAt,
    lastSolvedAt: nowIso,
    solvedCount: prevSolved + 1,
    correctCount: prevCorrect + (lastCorrect ? 1 : 0),
    wrongCount: prevWrong + (lastCorrect ? 0 : 1),
    lastCorrect,
    lastAnswer,
    correctAnswer: Number.isFinite(correctAnswer) ? correctAnswer : null,
    source: normalizeHistorySource(source),
    updatedAt: nowIso,
    schemaVersion: QUESTION_HISTORY_SCHEMA_VERSION,
  };
}

/** Eski localStorage satırını yeni şemaya uyarlar. */
export function normalizeQuestionHistoryEntry(raw, now = new Date()) {
  if (!raw || typeof raw !== "object") return null;
  const questionId = Number(raw.questionId);
  if (!Number.isFinite(questionId) || questionId <= 0) return null;

  const lastCorrect =
    raw.lastCorrect !== undefined
      ? Boolean(raw.lastCorrect)
      : Boolean(raw.isCorrect);

  const solvedCount = Math.max(1, Number(raw.solvedCount) || 1);
  const rawCorrect = Number(raw.correctCount);
  const rawWrong = Number(raw.wrongCount);
  const correctCount = Math.max(
    0,
    Number.isFinite(rawCorrect) ? rawCorrect : lastCorrect ? 1 : 0
  );
  const wrongCount = Math.max(
    0,
    Number.isFinite(rawWrong) ? rawWrong : lastCorrect ? 0 : 1
  );

  const lastSolvedAt =
    raw.lastSolvedAt || raw.answeredAt || raw.updatedAt || now.toISOString();

  return {
    questionId,
    ders: String(raw.ders || ""),
    konu: String(raw.konu || ""),
    firstSolvedAt: raw.firstSolvedAt || raw.answeredAt || lastSolvedAt,
    lastSolvedAt,
    solvedCount,
    correctCount,
    wrongCount,
    lastCorrect,
    lastAnswer:
      raw.lastAnswer !== undefined
        ? raw.lastAnswer
        : normalizeAnswerValue(raw.selected),
    correctAnswer:
      raw.correctAnswer !== undefined
        ? Number(raw.correctAnswer)
        : Number(raw.correct),
    source: normalizeHistorySource(raw.source || raw.mode),
    updatedAt: raw.updatedAt || lastSolvedAt,
    schemaVersion: Number(raw.schemaVersion) || QUESTION_HISTORY_SCHEMA_VERSION,
  };
}

export function dedupeQuestionHistoryByQuestionId(list = []) {
  const map = new Map();
  for (const raw of list) {
    const item = normalizeQuestionHistoryEntry(raw);
    if (!item) continue;
    const prev = map.get(item.questionId);
    if (!prev) {
      map.set(item.questionId, item);
      continue;
    }
    const prevTime = new Date(prev.lastSolvedAt).getTime() || 0;
    const itemTime = new Date(item.lastSolvedAt).getTime() || 0;
    const newer = itemTime >= prevTime ? item : prev;
    const older = itemTime >= prevTime ? prev : item;
    map.set(item.questionId, normalizeQuestionHistoryEntry({
      ...newer,
      firstSolvedAt: older.firstSolvedAt || newer.firstSolvedAt,
      solvedCount: Math.max(prev.solvedCount, item.solvedCount),
      correctCount: Math.max(prev.correctCount, item.correctCount),
      wrongCount: Math.max(prev.wrongCount, item.wrongCount),
    }));
  }
  return [...map.values()];
}

export function mergeQuestionHistoryLists(local = [], remote = []) {
  return dedupeQuestionHistoryByQuestionId([...local, ...remote]);
}

/** TopicTracker map girdisi — examIndex kullanılmaz. */
export function toTrackerHistoryView(entry) {
  const normalized = normalizeQuestionHistoryEntry(entry);
  if (!normalized) return null;
  return {
    questionId: normalized.questionId,
    ders: normalized.ders,
    konu: normalized.konu,
    isCorrect: normalized.lastCorrect,
    lastCorrect: normalized.lastCorrect,
    solvedCount: normalized.solvedCount,
    correctCount: normalized.correctCount,
    wrongCount: normalized.wrongCount,
    lastSolvedAt: normalized.lastSolvedAt,
  };
}

export function buildQuestionHistoryMap(entries = []) {
  const map = {};
  for (const raw of entries) {
    const view = toTrackerHistoryView(raw);
    if (view?.questionId) map[view.questionId] = view;
  }
  return map;
}

export function loadLocalQuestionHistoryList() {
  const parsed = readLocalStorageJson(QUESTION_HISTORY_STORAGE_KEY, {
    fallback: [],
    clearOnError: true,
  });
  if (!Array.isArray(parsed)) return [];
  return dedupeQuestionHistoryByQuestionId(parsed);
}

export function getTopicStatsFromHistory(ders, konu, questions, historyMap) {
  const topicQuestions = (questions || []).filter(
    (q) => q.ders === ders && q.konu === konu
  );
  let solvedCount = 0;
  let correctCount = 0;
  let wrongCount = 0;

  topicQuestions.forEach((q) => {
    const h = historyMap[q.id];
    if (!h) return;
    solvedCount += 1;
    if (h.correctCount != null && h.wrongCount != null) {
      correctCount += h.correctCount;
      wrongCount += h.wrongCount;
    } else if (h.isCorrect || h.lastCorrect) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }
  });

  const attempts = correctCount + wrongCount;
  const percent =
    attempts > 0
      ? Math.round((correctCount / attempts) * 100)
      : solvedCount > 0
        ? Math.round((correctCount / solvedCount) * 100)
        : null;

  return {
    total: topicQuestions.length,
    solvedCount,
    correctCount,
    wrongCount,
    percent,
  };
}
