export const SUBJECT_TOPIC_FALLBACK = "Konu detayı yok";

/**
 * Due kayıtlarından ders bazlı sıralama; her ders için en yoğun konu.
 * @returns {{ name: string, count: number, topTopic?: string, konu?: string }[]}
 */
export function buildTopSubjectsWithTopics(items, limit = 3) {
  const dersTotals = new Map();
  const dersTopics = new Map();

  for (const item of items || []) {
    const ders = String(item.ders || "").trim();
    const konu = String(item.konu || "").trim();
    if (!ders) continue;
    dersTotals.set(ders, (dersTotals.get(ders) || 0) + 1);
    if (!konu) continue;
    if (!dersTopics.has(ders)) dersTopics.set(ders, new Map());
    const topicMap = dersTopics.get(ders);
    topicMap.set(konu, (topicMap.get(konu) || 0) + 1);
  }

  return [...dersTotals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
    .slice(0, limit)
    .map(([name, count]) => {
      const topicMap = dersTopics.get(name);
      let topTopic = "";
      if (topicMap?.size) {
        topTopic = [...topicMap.entries()].sort(
          (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr")
        )[0][0];
      }
      return topTopic
        ? { name, count, topTopic, konu: topTopic }
        : { name, count };
    });
}

export function getSubjectRowSubtitle(item) {
  const topic = String(item?.topTopic || item?.konu || "").trim();
  return topic || SUBJECT_TOPIC_FALLBACK;
}

export function buildTopicRows(summary, reviews = []) {
  if (!summary?.topTopics?.length) return [];
  return summary.topTopics.slice(0, 3).map((topic) => {
    const related = reviews.filter(
      (r) => String(r.konu || "").trim() === String(topic.name || "").trim()
    );
    const ders = related[0]?.ders || "";
    return { name: topic.name, count: topic.count, subtitle: ders };
  });
}

export function groupReviewsBySubject(reviews = []) {
  return reviews.reduce((acc, r) => {
    const ders = String(r.ders || "").trim();
    if (!ders) return acc;
    acc[ders] = (acc[ders] || 0) + 1;
    return acc;
  }, {});
}
