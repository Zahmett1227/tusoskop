import { isRecord, readLocalStorageJson } from "./safeLocalStorage";

/** localStorage — kullanıcı isteği: key sabit kalmalı */
export const TUSOSKOP_EXAM_HISTORY_KEY = "tusoskopExamHistory";

/** Sabit/dinamik deneme tanımından sonuç kaydına taşınacak meta. */
export function buildExamResultMetadata(examSet) {
  const examTitle = examSet?.title || "TUS Genel Deneme";
  const examId = examSet?.id ?? null;
  const hasFixedIds = Array.isArray(examSet?.questionIds) && examSet.questionIds.length > 0;

  if (!hasFixedIds) {
    return {
      examId,
      examKey: examId,
      examTitle,
      fixedSet: false,
    };
  }

  return {
    examId,
    examKey: examId,
    examTitle,
    fixedSet: true,
    setVersion: examSet.setVersion ?? "unknown",
    questionIdsSnapshot: [...examSet.questionIds],
  };
}

/** Eski kayıtlar için güvenli okuma. */
export function getResultSetVersion(result) {
  if (!result || typeof result !== "object") return "unknown";
  const v = result.setVersion;
  return v === undefined || v === null || v === "" ? "unknown" : String(v);
}

/**
 * Firestore Timestamp, ISO string, sayı veya { seconds } için güvenli ISO string.
 */
export function parseExamDateToIso(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "string") {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof raw === "object") {
    if (typeof raw.toDate === "function") {
      try {
        const d = raw.toDate();
        return d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
      } catch {
        return null;
      }
    }
    if (typeof raw.seconds === "number") {
      const d = new Date(raw.seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
  }
  return null;
}

export function getExamDateValue(exam) {
  if (!exam || typeof exam !== "object") return null;
  return (
    exam.completedAt ??
    exam.createdAt ??
    exam.date ??
    exam.timestamp ??
    null
  );
}

/** TUS neti: doğru − yanlış/4 (boşlar neti etkilemez). */
export function calculateTusNet(exam) {
  if (exam == null || typeof exam !== "object") return null;

  const directNet = exam.tusNet ?? exam.totalNet ?? exam.net;
  if (directNet !== undefined && directNet !== null && directNet !== "") {
    const n = Number(directNet);
    if (Number.isFinite(n)) return Number(n.toFixed(2));
  }

  const correct = Number(exam.totalCorrect ?? exam.correct ?? 0);
  const wrong = Number(exam.totalWrong ?? exam.wrong ?? 0);

  const v = correct - wrong / 4;
  if (!Number.isFinite(v)) return null;
  return Number(v.toFixed(2));
}

/**
 * Net skordan grafik için tek tahmini TUS sayısı (getEstimatedTusResult aralıklarıyla uyumlu).
 */
export function estimatedTusNumericFromNet(net) {
  const n = Number(net);
  if (!Number.isFinite(n)) return 0;
  if (n >= 140) return 72;
  if (n >= 120) return 68;
  if (n >= 95) return 62;
  if (n >= 75) return 56;
  return 50;
}

export function formatExamDate(value, index, withTime = false) {
  if (!value) return `Eski kayıt ${index + 1}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `Eski kayıt ${index + 1}`;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function normalizeFirestoreResultDoc(docSnap) {
  const data = docSnap.data();
  const stats = data.stats || {};
  const correct = Number(stats.correct ?? 0);
  const wrong = Number(stats.wrong ?? 0);
  const blank = Number(stats.empty ?? stats.blank ?? 0);
  const storedNet = Number(stats.totalNet ?? stats.net);
  const tusNet =
    data.tusNet != null && data.tusNet !== ""
      ? Number(Number(data.tusNet).toFixed(2))
      : Number.isFinite(storedNet)
        ? storedNet
        : Number((correct - wrong / 4).toFixed(2));

  const rawDate =
    parseExamDateToIso(data.completedAt) ||
    parseExamDateToIso(data.date) ||
    parseExamDateToIso(data.createdAt);

  return {
    id: docSnap.id,
    rawDate,
    completedAt: typeof data.completedAt === "string" ? data.completedAt : rawDate,
    estimatedTusScore: Number(
      data.estimatedTusScore ?? estimatedTusNumericFromNet(tusNet)
    ),
    totalCorrect: correct,
    totalWrong: wrong,
    totalBlank: blank,
    totalNet: tusNet,
    tusNet,
    examTitle: data.examTitle || "TUS Denemesi",
    examId: data.examId ?? null,
    fixedSet: Boolean(data.fixedSet),
    setVersion: getResultSetVersion(data),
    questionIdsSnapshot: Array.isArray(data.questionIdsSnapshot)
      ? data.questionIdsSnapshot
      : undefined,
    source: "firestore",
  };
}

export function normalizeLocalExamEntry(raw, index) {
  if (!isRecord(raw)) {
    throw new TypeError("normalizeLocalExamEntry: expected object");
  }
  const correct = Number(raw.totalCorrect ?? raw.stats?.correct ?? 0);
  const wrong = Number(raw.totalWrong ?? raw.stats?.wrong ?? 0);
  const blank = Number(raw.totalBlank ?? raw.stats?.empty ?? 0);
  const storedNet = Number(raw.totalNet ?? raw.stats?.totalNet ?? raw.stats?.net ?? NaN);
  const tusNet =
    raw.tusNet != null && raw.tusNet !== ""
      ? Number(Number(raw.tusNet).toFixed(2))
      : Number.isFinite(storedNet)
        ? storedNet
        : Number((correct - wrong / 4).toFixed(2));

  const rawDate =
    parseExamDateToIso(raw.completedAt) ||
    parseExamDateToIso(raw.createdAt) ||
    parseExamDateToIso(raw.date) ||
    parseExamDateToIso(raw.timestamp);

  return {
    id: raw.id ?? raw.firestoreId ?? `local-${index}`,
    rawDate,
    completedAt: typeof raw.completedAt === "string" ? raw.completedAt : rawDate,
    estimatedTusScore: Number(
      raw.estimatedTusScore ?? estimatedTusNumericFromNet(tusNet)
    ),
    totalCorrect: correct,
    totalWrong: wrong,
    totalBlank: blank,
    totalNet: tusNet,
    tusNet,
    examTitle: raw.examTitle || "TUS Denemesi",
    examId: raw.examId ?? null,
    fixedSet: Boolean(raw.fixedSet),
    setVersion: getResultSetVersion(raw),
    questionIdsSnapshot: Array.isArray(raw.questionIdsSnapshot)
      ? raw.questionIdsSnapshot
      : undefined,
    source: "local",
  };
}

export function loadLocalExamHistory() {
  const parsed = readLocalStorageJson(TUSOSKOP_EXAM_HISTORY_KEY, { fallback: [] });
  return Array.isArray(parsed) ? parsed : [];
}

/** Tek geçersiz kayıt tüm geçmişi düşürmez; normalize edilemeyenler atlanır. */
export function safeNormalizeLocalExamEntry(raw, index) {
  if (!isRecord(raw)) return null;
  try {
    return normalizeLocalExamEntry(raw, index);
  } catch {
    return null;
  }
}

/** Bitmiş deneme geçmişi — bozuk JSON patlatmaz; geçersiz satırlar filtrelenir. */
export function loadNormalizedLocalExamHistory() {
  const raw = loadLocalExamHistory();
  const rows = [];
  for (let i = 0; i < raw.length; i += 1) {
    const row = safeNormalizeLocalExamEntry(raw[i], i);
    if (row) rows.push(row);
  }
  return rows;
}

export function appendLocalExamHistory(entry) {
  if (typeof window === "undefined") return;
  try {
    const list = loadLocalExamHistory();
    list.push(entry);
    localStorage.setItem(TUSOSKOP_EXAM_HISTORY_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("appendLocalExamHistory:", e);
  }
}

/** Firestore + local kayıtları id ile birleştir (Firestore öncelikli). */
export function mergeExamHistories(firestoreRows, localRows) {
  const map = new Map();

  firestoreRows.forEach((row) => {
    if (row.id) map.set(row.id, row);
  });

  localRows.forEach((row) => {
    if (!row.id) return;
    if (!map.has(row.id)) map.set(row.id, row);
  });

  return Array.from(map.values());
}

/**
 * Grafik satırları — caller çoktan zamana göre artan sıralı dizi vermeli.
 * Son chartPointLimit deneme gösterilir.
 */
export function buildChartRows(sortedExamsAscending, { chartPointLimit = 20 } = {}) {
  const slice = sortedExamsAscending.slice(-chartPointLimit);
  const baseOffset = Math.max(0, sortedExamsAscending.length - slice.length);

  return slice.map((exam, idx) => {
    const rawDate = exam.rawDate ?? parseExamDateToIso(getExamDateValue(exam));
    const labelIndex = baseOffset + idx;
    const tusNetVal = calculateTusNet({ ...exam, rawDate }) ?? 0;
    return {
      ...exam,
      rawDate,
      chartIndex: idx,
      shortDate: formatExamDate(rawDate, labelIndex, false),
      fullDate: formatExamDate(rawDate, labelIndex, true),
      tusNet: tusNetVal,
      correct: Number(exam.totalCorrect ?? 0),
      wrong: Number(exam.totalWrong ?? 0),
      blank: Number(exam.totalBlank ?? 0),
    };
  });
}

/** Özet: son / en iyi / ortalama TUS neti (tüm birleşik geçmiş). */
export function summarizeNetStats(exams) {
  if (!exams?.length) {
    return { last: null, best: null, avg: null };
  }

  const sorted = [...exams].sort((a, b) => {
    const ta = a.rawDate ? new Date(a.rawDate).getTime() : Number.MAX_SAFE_INTEGER;
    const tb = b.rawDate ? new Date(b.rawDate).getTime() : Number.MAX_SAFE_INTEGER;
    if (ta !== tb) return ta - tb;
    return String(a.id ?? "").localeCompare(String(b.id ?? ""));
  });

  const nets = sorted
    .map((e) => calculateTusNet(e))
    .filter((n) => n !== null && Number.isFinite(n));
  if (!nets.length) return { last: null, best: null, avg: null };

  const last = calculateTusNet(sorted[sorted.length - 1]);
  const best = Math.max(...nets);
  const avg = nets.reduce((s, x) => s + x, 0) / nets.length;

  return {
    last: last !== null && Number.isFinite(last) ? Math.round(last * 100) / 100 : null,
    best: Number.isFinite(best) ? Math.round(best * 100) / 100 : null,
    avg: Number.isFinite(avg) ? Math.round(avg * 10) / 10 : null,
  };
}
