/**
 * FSRS-inspired lightweight scheduler; future upgrade path to full FSRS.
 * Uses D/S/R-style fields (difficulty, stability, retrievability) without external libs.
 */

export const GRADES = ["again", "hard", "good", "easy"];

const MS_PER_DAY = 86400000;
export const STABILITY_MIN = 0.5;
export const STABILITY_MAX = 365;
export const DIFFICULTY_MIN = 1;
export const DIFFICULTY_MAX = 10;
export const MAX_DUE_INTERVAL_DAYS = 90;
export const SCHEMA_VERSION = 1;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === "function") {
    const d = value.toDate();
    return Number.isNaN(d?.getTime?.()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const addDays = (date, days) => new Date(date.getTime() + days * MS_PER_DAY);

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const clampDifficulty = (value) =>
  clamp(Number(value) || DIFFICULTY_MIN, DIFFICULTY_MIN, DIFFICULTY_MAX);

export const clampStability = (value) =>
  clamp(Number(value) || STABILITY_MIN, STABILITY_MIN, STABILITY_MAX);

export const clampDueAt = (date, now = new Date()) => {
  const max = addDays(now, MAX_DUE_INTERVAL_DAYS);
  return date.getTime() > max.getTime() ? max : date;
};

export function computeRetrievability(reviewState, now = new Date()) {
  const stability = clampStability(reviewState?.stability ?? STABILITY_MIN);
  const last = toDate(reviewState?.lastReviewedAt);
  if (!last) return 1;
  const elapsedDays = Math.max(0, (now.getTime() - last.getTime()) / MS_PER_DAY);
  return Math.exp(-elapsedDays / stability);
}

export function isDueForReview(reviewState, now = new Date()) {
  const due = toDate(reviewState?.dueAt);
  if (!due) return true;
  return due.getTime() <= now.getTime();
}

export function isOverdue(reviewState, now = new Date()) {
  const due = toDate(reviewState?.dueAt);
  if (!due) return false;
  return due.getTime() < startOfDay(now).getTime();
}

export function getNextDueDate(reviewState, grade, now = new Date()) {
  const stability = clampStability(reviewState?.stability ?? 1);
  const intervals = {
    again: 1,
    hard: Math.max(1, Math.round(stability * 1.2)),
    good: Math.max(2, Math.round(stability * 2.5)),
    easy: Math.max(4, Math.round(stability * 4)),
  };
  const days = intervals[grade] ?? 1;
  return clampDueAt(addDays(now, days), now);
}

export function createInitialReviewState(question, source = "wrong", now = new Date()) {
  const questionId = Number(question?.id);
  // İlk yanlış: bugün tekrar kuyruğunda görünsün; favori/manuel kayıt yarın.
  const dueAt = source === "wrong" ? now : addDays(now, 1);
  return {
    questionId,
    ders: String(question?.ders || ""),
    konu: String(question?.konu || ""),
    source: String(source || "wrong"),
    state: "review",
    dueAt: dueAt.toISOString(),
    lastReviewedAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    difficulty: 5,
    stability: 1,
    retrievability: 1,
    reviewCount: 0,
    lapseCount: source === "wrong" ? 1 : 0,
    lastGrade: source === "wrong" ? "again" : null,
    lastAnswerCorrect: false,
    schemaVersion: SCHEMA_VERSION,
  };
}

export function updateReviewAfterGrade(reviewState, grade, now = new Date()) {
  const base = normalizeSmartReviewEntry(reviewState, now);
  if (!base) return null;

  let difficulty = base.difficulty;
  let stability = base.stability;
  let lapseCount = base.lapseCount;

  if (grade === "again") {
    difficulty = clampDifficulty(difficulty + 1.2);
    stability = clampStability(Math.max(STABILITY_MIN, stability * 0.5));
    lapseCount += 1;
  } else if (grade === "hard") {
    difficulty = clampDifficulty(difficulty + 0.5);
    stability = clampStability(stability + 0.4);
  } else if (grade === "good") {
    difficulty = clampDifficulty(difficulty - 0.3);
    stability = clampStability(stability + 1.2);
  } else if (grade === "easy") {
    difficulty = clampDifficulty(difficulty - 0.6);
    stability = clampStability(stability + 2.5);
  }

  const dueAt = getNextDueDate({ ...base, stability }, grade, now);
  const lastAnswerCorrect = grade === "good" || grade === "easy";

  return normalizeSmartReviewEntry(
    {
      ...base,
      difficulty,
      stability,
      lapseCount,
      dueAt: dueAt.toISOString(),
      lastReviewedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      reviewCount: base.reviewCount + 1,
      lastGrade: grade,
      lastAnswerCorrect,
      retrievability: computeRetrievability(
        { stability, lastReviewedAt: now.toISOString() },
        now
      ),
    },
    now
  );
}

export function normalizeSmartReviewEntry(raw, now = new Date()) {
  if (!raw || typeof raw !== "object") return null;
  const questionId = Number(raw.questionId);
  if (!Number.isFinite(questionId) || questionId <= 0) return null;

  const due = toDate(raw.dueAt) || addDays(now, 1);
  const normalized = {
    questionId,
    ders: String(raw.ders || ""),
    konu: String(raw.konu || ""),
    source: String(raw.source || "wrong"),
    state: String(raw.state || "review"),
    dueAt: due.toISOString(),
    lastReviewedAt: raw.lastReviewedAt
      ? (toDate(raw.lastReviewedAt)?.toISOString() ?? null)
      : null,
    lastPracticeAt: raw.lastPracticeAt
      ? (toDate(raw.lastPracticeAt)?.toISOString() ?? null)
      : null,
    createdAt: raw.createdAt
      ? (toDate(raw.createdAt)?.toISOString() ?? now.toISOString())
      : now.toISOString(),
    updatedAt: raw.updatedAt
      ? (toDate(raw.updatedAt)?.toISOString() ?? now.toISOString())
      : now.toISOString(),
    difficulty: clampDifficulty(raw.difficulty),
    stability: clampStability(raw.stability),
    retrievability: Number(raw.retrievability ?? 1),
    reviewCount: Math.max(0, Number(raw.reviewCount) || 0),
    lapseCount: Math.max(0, Number(raw.lapseCount) || 0),
    softLapseCount: Math.max(0, Number(raw.softLapseCount) || 0),
    softReviewCount: Math.max(0, Number(raw.softReviewCount) || 0),
    lastGrade: GRADES.includes(raw.lastGrade) ? raw.lastGrade : null,
    lastAnswerCorrect: Boolean(raw.lastAnswerCorrect),
    lastReviewContext: raw.lastReviewContext ? String(raw.lastReviewContext) : null,
    schemaVersion: Number(raw.schemaVersion) || SCHEMA_VERSION,
  };

  normalized.retrievability = computeRetrievability(normalized, now);
  return normalized;
}

export function dedupeSmartReviewsByQuestionId(list = []) {
  const map = new Map();
  for (const raw of list) {
    const item = normalizeSmartReviewEntry(raw);
    if (!item) continue;
    const prev = map.get(item.questionId);
    if (!prev) {
      map.set(item.questionId, item);
      continue;
    }
    const prevDue = toDate(prev.dueAt)?.getTime() ?? 0;
    const itemDue = toDate(item.dueAt)?.getTime() ?? 0;
    const keep = itemDue <= prevDue ? item : prev;
    map.set(item.questionId, normalizeSmartReviewEntry(keep));
  }
  return [...map.values()];
}

/** Yerel + uzak listeyi birleştirir; aynı soruda en güncel kayıt kalır. */
export function mergeSmartReviewLists(local = [], remote = []) {
  const map = new Map();
  for (const raw of [...local, ...remote]) {
    const item = normalizeSmartReviewEntry(raw);
    if (!item) continue;
    const prev = map.get(item.questionId);
    if (!prev) {
      map.set(item.questionId, item);
      continue;
    }
    const prevUpdated = toDate(prev.updatedAt)?.getTime() ?? 0;
    const itemUpdated = toDate(item.updatedAt)?.getTime() ?? 0;
    map.set(item.questionId, itemUpdated >= prevUpdated ? item : prev);
  }
  return [...map.values()];
}

/** Kör nokta paneli: bugün tekrar + henüz zayıf / yanlış işaretli kayıtlar. */
export function filterInsightReviewPool(reviews = [], now = new Date()) {
  return dedupeSmartReviewsByQuestionId(reviews).filter(
    (item) =>
      isDueForReview(item, now) ||
      item.lapseCount > 0 ||
      item.lastAnswerCorrect === false
  );
}

export function sortDueReviews(reviews, now = new Date()) {
  const list = dedupeSmartReviewsByQuestionId(reviews).filter((item) =>
    isDueForReview(item, now)
  );
  return list.sort((a, b) => {
    const aOver = isOverdue(a, now) ? 0 : 1;
    const bOver = isOverdue(b, now) ? 0 : 1;
    if (aOver !== bOver) return aOver - bOver;
    const rA = computeRetrievability(a, now);
    const rB = computeRetrievability(b, now);
    if (rA !== rB) return rA - rB;
    const dueA = toDate(a.dueAt)?.getTime() ?? 0;
    const dueB = toDate(b.dueAt)?.getTime() ?? 0;
    if (dueA !== dueB) return dueA - dueB;
    const upA = toDate(a.updatedAt)?.getTime() ?? 0;
    const upB = toDate(b.updatedAt)?.getTime() ?? 0;
    return upA - upB;
  });
}

export function gradeFromAnswerCorrect(isCorrect) {
  return isCorrect ? "good" : "again";
}

function applyNormalReview(base, grade, context, now) {
  const updated = updateReviewAfterGrade(base, grade, now);
  if (!updated) return null;
  return normalizeSmartReviewEntry({
    ...updated,
    lastPracticeAt: now.toISOString(),
    lastReviewContext: context ?? updated.lastReviewContext,
  }, now);
}

export function applyEarlyReview(base, grade, context, progressRatio = 1, now = new Date()) {
  const isCorrect = grade === "good" || grade === "easy";

  if (isCorrect && progressRatio < 0.5) {
    // Very early correct: preserve dueAt and lastReviewedAt; only track practice
    return normalizeSmartReviewEntry({
      ...base,
      lastPracticeAt: now.toISOString(),
      lastReviewContext: context ?? base.lastReviewContext,
      softReviewCount: (base.softReviewCount || 0) + 1,
      updatedAt: now.toISOString(),
    }, now);
  }

  if (isCorrect) {
    // Early correct with meaningful progress: apply delta from normalResult, not spread
    const normalResult = updateReviewAfterGrade(base, grade, now);
    return normalizeSmartReviewEntry({
      ...base,
      difficulty: normalResult?.difficulty ?? base.difficulty,
      stability: normalResult?.stability ?? base.stability,
      dueAt: normalResult?.dueAt ?? base.dueAt,
      lastReviewedAt: now.toISOString(),
      lastPracticeAt: now.toISOString(),
      lastReviewContext: context ?? base.lastReviewContext,
      softReviewCount: (base.softReviewCount || 0) + 1,
      reviewCount: base.reviewCount + 1,
      lastGrade: grade,
      lastAnswerCorrect: true,
      updatedAt: now.toISOString(),
    }, now);
  }

  // Wrong during early review
  const oldDueMsec = toDate(base.dueAt)?.getTime() ?? Infinity;
  const nextDayMsec = addDays(now, 1).getTime();
  const newDueAt = new Date(Math.min(oldDueMsec, nextDayMsec));

  let { lapseCount } = base;
  let softLapseCount = base.softLapseCount || 0;
  if (progressRatio < 0.75) {
    softLapseCount += 1;
  } else {
    lapseCount += 1;
  }

  return normalizeSmartReviewEntry({
    ...base,
    dueAt: newDueAt.toISOString(),
    lastPracticeAt: now.toISOString(),
    lastReviewContext: context ?? base.lastReviewContext,
    softReviewCount: (base.softReviewCount || 0) + 1,
    lapseCount,
    softLapseCount,
    lastGrade: grade,
    lastAnswerCorrect: false,
    updatedAt: now.toISOString(),
  }, now);
}

/**
 * Ana tekrar uygulama fonksiyonu.
 * Sıra: isDue → isSameDay → earlyReview
 */
export function applyReview(reviewState, grade, context = null, progressRatio = 1, now = new Date()) {
  const base = normalizeSmartReviewEntry(reviewState, now);
  if (!base) return null;

  // 1. isDue → normal FSRS review
  if (isDueForReview(base, now)) {
    return applyNormalReview(base, grade, context, now);
  }

  // 2. isSameDay → bugün zaten tekrar edilmiş, schedule değişmez
  const lastReviewed = toDate(base.lastReviewedAt);
  if (lastReviewed && startOfDay(lastReviewed).getTime() === startOfDay(now).getTime()) {
    return normalizeSmartReviewEntry({
      ...base,
      lastPracticeAt: now.toISOString(),
      lastReviewContext: context ?? base.lastReviewContext,
      updatedAt: now.toISOString(),
    }, now);
  }

  // 3. Early review
  return applyEarlyReview(base, grade, context, progressRatio, now);
}
