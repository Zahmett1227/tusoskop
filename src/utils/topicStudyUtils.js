/** Konu çalışması — soru sayısı seçenekleri */
export const TOPIC_STUDY_COUNT_OPTIONS = [10, 20, 40, "all"];

/**
 * Seçilen derse ait sorulardan konu → adet map'i.
 * @param {Array<{ ders?: string, konu?: string }>} questions
 * @param {string} ders
 */
export function countQuestionsByTopic(questions, ders) {
  const map = new Map();
  if (!ders || !Array.isArray(questions)) return map;
  for (const q of questions) {
    if (q?.ders !== ders) continue;
    const konu = q.konu || "—";
    map.set(konu, (map.get(konu) || 0) + 1);
  }
  return map;
}

export function sortedTopicNames(topicCountMap) {
  return [...topicCountMap.keys()].sort((a, b) => a.localeCompare(b, "tr"));
}

export function filterTopicsBySearch(topics, query) {
  const q = String(query || "")
    .trim()
    .toLocaleLowerCase("tr");
  if (!q) return topics;
  return topics.filter((t) => t.toLocaleLowerCase("tr").includes(q));
}

/**
 * @param {number | "all"} requested
 * @param {number} available
 * @returns {number}
 */
export function resolveTopicStudyCount(requested, available) {
  const total = Number(available) || 0;
  if (total < 1) return 0;
  if (requested === "all") return total;
  const n = Number(requested);
  if (!Number.isFinite(n) || n < 1) return total;
  return Math.min(n, total);
}

export function formatStudyStartLabel(count) {
  if (count === "all") return "Bu konudan çalışmaya başla";
  return `${count} soruluk çalışma başlat`;
}
