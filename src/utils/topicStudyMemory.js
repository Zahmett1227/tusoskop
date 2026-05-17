import { TOPIC_STUDY_COUNT_OPTIONS, resolveTopicStudyCount } from "./topicStudyUtils";

/** @deprecated Tek kayıt — okuma uyumluluğu için */
export const TUSOSKOP_LAST_TOPIC_STUDY_KEY = "tusoskopLastTopicStudy";

export const TUSOSKOP_RECENT_TOPIC_STUDIES_KEY = "tusoskopRecentTopicStudies";

export const MAX_RECENT_TOPIC_STUDIES = 5;

/**
 * @typedef {{ ders: string, konu: string, countMode: number | "all", resolvedCount: number, updatedAt: string }} TopicStudyMemory
 */

export function isValidCountMode(mode) {
  return mode === "all" || TOPIC_STUDY_COUNT_OPTIONS.includes(mode);
}

export function normalizeCountMode(mode) {
  if (isValidCountMode(mode)) return mode;
  return 10;
}

export function isValidLastTopicStudyRecord(raw) {
  if (!raw || typeof raw !== "object") return false;
  const ders = raw.ders;
  const konu = raw.konu;
  if (typeof ders !== "string" || !ders.trim()) return false;
  if (typeof konu !== "string" || !konu.trim()) return false;
  const countMode = normalizeCountMode(raw.countMode);
  if (!isValidCountMode(countMode)) return false;
  const resolved = Number(raw.resolvedCount);
  if (!Number.isFinite(resolved) || resolved < 1) return false;
  return true;
}

/** @param {unknown} value */
export function normalizeRecentTopicStudies(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    if (!isValidLastTopicStudyRecord(item)) continue;
    out.push({
      ders: String(item.ders),
      konu: String(item.konu),
      countMode: normalizeCountMode(item.countMode),
      resolvedCount: Number(item.resolvedCount),
      updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date(0).toISOString(),
    });
  }
  return out.slice(0, MAX_RECENT_TOPIC_STUDIES);
}

function readRecentListFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TUSOSKOP_RECENT_TOPIC_STUDIES_KEY);
    if (!raw) return [];
    return normalizeRecentTopicStudies(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeRecentListToStorage(list) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      TUSOSKOP_RECENT_TOPIC_STUDIES_KEY,
      JSON.stringify(normalizeRecentTopicStudies(list))
    );
  } catch {
    /* quota / private mode */
  }
}

/**
 * @param {TopicStudyMemory[]} list
 * @param {TopicStudyMemory} entry
 */
export function upsertRecentTopicStudies(list, entry) {
  const normalized = normalizeRecentTopicStudies(list);
  const rest = normalized.filter((e) => !(e.ders === entry.ders && e.konu === entry.konu));
  return [entry, ...rest].slice(0, MAX_RECENT_TOPIC_STUDIES);
}

export function saveRecentTopicStudy({ ders, konu, countMode, resolvedCount }) {
  if (typeof window === "undefined") return;
  if (!ders || !konu) return;
  const safeMode = normalizeCountMode(countMode);
  const resolved = Number(resolvedCount);
  if (!Number.isFinite(resolved) || resolved < 1) return;
  const entry = {
    ders: String(ders),
    konu: String(konu),
    countMode: safeMode,
    resolvedCount: resolved,
    updatedAt: new Date().toISOString(),
  };
  const next = upsertRecentTopicStudies(readRecentListFromStorage(), entry);
  writeRecentListToStorage(next);
}

/** @returns {TopicStudyMemory[]} */
export function getRecentTopicStudies() {
  const list = readRecentListFromStorage();
  if (list.length > 0) return list;
  const legacy = getLastTopicStudy();
  return legacy ? [legacy] : [];
}

export function clearRecentTopicStudies() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TUSOSKOP_RECENT_TOPIC_STUDIES_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * @param {number | "all"} storedMode
 * @param {number} available
 * @returns {number | "all" | null}
 */
export function pickResumeCountMode(storedMode, available) {
  const total = Number(available) || 0;
  if (total < 1) return null;
  const mode = normalizeCountMode(storedMode);
  if (mode === "all") return "all";
  if (mode <= total) return mode;
  if (total >= 40) return 40;
  if (total >= 20) return 20;
  if (total >= 10) return 10;
  return "all";
}

export function formatLastStudyCountLabel(countMode) {
  const mode = normalizeCountMode(countMode);
  if (mode === "all") return "Tüm konu";
  return `${mode} soru`;
}

/** @deprecated Yeni kayıtlar saveRecentTopicStudy kullanır */
export function saveLastTopicStudy(entry) {
  saveRecentTopicStudy(entry);
}

/** @returns {TopicStudyMemory | null} */
export function getLastTopicStudy() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TUSOSKOP_LAST_TOPIC_STUDY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidLastTopicStudyRecord(parsed)) return null;
    return {
      ders: String(parsed.ders),
      konu: String(parsed.konu),
      countMode: normalizeCountMode(parsed.countMode),
      resolvedCount: Number(parsed.resolvedCount),
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function clearLastTopicStudy() {
  clearRecentTopicStudies();
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TUSOSKOP_LAST_TOPIC_STUDY_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * @returns {{ memory: TopicStudyMemory, countMode: number | "all", available: number, resolvedCount: number } | null}
 */
export function buildResumePlan(memory, topicCountMap, ders) {
  if (!isValidLastTopicStudyRecord(memory)) return null;
  if (memory.ders !== ders) return null;
  const available = topicCountMap.get(memory.konu) || 0;
  if (available < 1) return null;
  const countMode = pickResumeCountMode(memory.countMode, available);
  if (countMode == null) return null;
  const resolvedCount = resolveTopicStudyCount(countMode, available);
  if (resolvedCount < 1) return null;
  return { memory, countMode, available, resolvedCount };
}

export function recentStudyKey(memory) {
  return `${memory.ders}\u0000${memory.konu}`;
}
