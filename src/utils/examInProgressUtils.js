import { buildExamResultMetadata, getResultSetVersion } from "./examHistoryUtils";

/** Yarım kalan deneme — yalnızca bu key; bitmiş geçmişe dokunulmaz. */
export const TUSOSKOP_EXAM_IN_PROGRESS_KEY = "tusoskopExamInProgress";

/** 2 = cevaplar deneme içi index ile tutulur. */
export const EXAM_IN_PROGRESS_SCHEMA_VERSION = 2;

export const EXAM_IN_PROGRESS_RESET_MESSAGE =
  "Deneme seti güncellendiği için eski yarım deneme sıfırlandı.";

const RESET_NOTIFY_REASONS = new Set([
  "set_version_mismatch",
  "snapshot_mismatch",
  "snapshot_length",
  "id_based_answers",
  "old_schema",
  "exam_mismatch",
]);

export function shouldNotifyInProgressReset(reason) {
  return RESET_NOTIFY_REASONS.has(reason);
}

export function buildInProgressExamPayload({
  examSet,
  examQuestions,
  examIndex,
  answers,
  examSelected,
}) {
  const meta = buildExamResultMetadata(examSet);
  const questionIdsSnapshot = (examQuestions || []).map((q) => Number(q.id));

  return {
    ...meta,
    schemaVersion: EXAM_IN_PROGRESS_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    examIndex: Number(examIndex) || 0,
    examSelected: examSelected ?? null,
    answers: answers && typeof answers === "object" ? { ...answers } : {},
    questionCount: questionIdsSnapshot.length,
    questionIdsSnapshot,
  };
}

/**
 * Eski question.id anahtarlı cevap map'i mi (index tabanlı değil).
 */
export function looksLikeIdBasedAnswers(answers, questionCount, questionIdsSnapshot = []) {
  if (!answers || typeof answers !== "object") return false;
  const keys = Object.keys(answers)
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n));
  if (!keys.length) return false;

  const count = Number(questionCount) || 0;
  const idSet = new Set(
    (Array.isArray(questionIdsSnapshot) ? questionIdsSnapshot : []).map((id) => Number(id))
  );

  let indexStyle = 0;
  let idOnlyStyle = 0;

  for (const key of keys) {
    const inIndexRange = count > 0 && key >= 0 && key < count;
    const matchesId = idSet.has(key);
    if (inIndexRange) {
      indexStyle += 1;
    } else if (matchesId) {
      idOnlyStyle += 1;
    }
  }

  if (idOnlyStyle > 0) return true;
  if (count > 0 && keys.length > 0 && keys.every((k) => k >= count)) return true;
  return false;
}

/**
 * @returns {{ ok: true, data: object } | { ok: false, reason: string }}
 */
export function validateInProgressExam(raw, examSet) {
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "invalid" };
  }

  try {
    const examId = raw.examId ?? raw.examKey ?? null;

    if (examId != null && !examSet) {
      return { ok: false, reason: "exam_mismatch" };
    }

    if (examSet && examId != null && examSet.id != null && Number(examId) !== Number(examSet.id)) {
      return { ok: false, reason: "exam_mismatch" };
    }

    const isFixed = Boolean(
      examSet?.fixedSet ||
        (Array.isArray(examSet?.questionIds) && examSet.questionIds.length > 0)
    );

    let questionIdsSnapshot = Array.isArray(raw.questionIdsSnapshot)
      ? raw.questionIdsSnapshot.map(Number)
      : [];

    if (isFixed && examSet) {
      const savedVersion = getResultSetVersion(raw);
      const currentVersion = getResultSetVersion({ setVersion: examSet.setVersion });
      if (savedVersion !== currentVersion) {
        return { ok: false, reason: "set_version_mismatch" };
      }

      if (!questionIdsSnapshot.length) {
        questionIdsSnapshot = examSet.questionIds.map(Number);
      }

      if (questionIdsSnapshot.length !== examSet.questionIds.length) {
        return { ok: false, reason: "snapshot_length" };
      }

      const snapshotMatches = questionIdsSnapshot.every(
        (id, i) => Number(id) === Number(examSet.questionIds[i])
      );
      if (!snapshotMatches) {
        return { ok: false, reason: "snapshot_mismatch" };
      }
    }

    const questionCount =
      questionIdsSnapshot.length || Number(raw.questionCount) || examSet?.questionCount || 0;

    if (!questionCount || questionCount < 1) {
      return { ok: false, reason: "invalid" };
    }

    const schemaVersion = Number(raw.schemaVersion);
    if (isFixed && (!Number.isFinite(schemaVersion) || schemaVersion < EXAM_IN_PROGRESS_SCHEMA_VERSION)) {
      return { ok: false, reason: "old_schema" };
    }

    const answers = raw.answers ?? raw.examAnswers ?? {};
    if (looksLikeIdBasedAnswers(answers, questionCount, questionIdsSnapshot)) {
      return { ok: false, reason: "id_based_answers" };
    }

    const examIndex = Number(raw.examIndex);
    if (!Number.isFinite(examIndex) || examIndex < 0 || examIndex >= questionCount) {
      return { ok: false, reason: "invalid" };
    }

    return {
      ok: true,
      data: {
        ...raw,
        schemaVersion: EXAM_IN_PROGRESS_SCHEMA_VERSION,
        examId,
        examKey: examId,
        questionIdsSnapshot,
        questionCount,
        examIndex,
        answers,
      },
    };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export function loadInProgressExamRaw() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TUSOSKOP_EXAM_IN_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveInProgressExam(payload) {
  if (typeof window === "undefined" || !payload) return;
  try {
    localStorage.setItem(TUSOSKOP_EXAM_IN_PROGRESS_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearInProgressExam() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TUSOSKOP_EXAM_IN_PROGRESS_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Kayıtlı yarım denemeyi doğrula; uyumsuzsa temizle.
 * @returns {{ cleared: boolean, reason?: string, data?: object }}
 */
export function loadValidatedInProgressExam(examSet) {
  const raw = loadInProgressExamRaw();
  if (!raw) return { cleared: false };

  const result = validateInProgressExam(raw, examSet);
  if (!result.ok) {
    clearInProgressExam();
    return { cleared: true, reason: result.reason };
  }

  return { cleared: false, data: result.data };
}

export function hasMeaningfulExamProgress(data) {
  if (!data) return false;
  const answers = data.answers ?? {};
  const answered = Object.keys(answers).length > 0;
  return answered || Number(data.examIndex) > 0;
}
