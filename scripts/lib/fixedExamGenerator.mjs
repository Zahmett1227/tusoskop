import FULL_EXAM_BLUEPRINT from "../../src/data/examBlueprints.js";

export const MAX_TOPIC_STREAK = 2;
export const TEMEL_ORDER = [
  "Anatomi",
  "Fizyoloji",
  "Biyokimya",
  "Mikrobiyoloji",
  "Patoloji",
  "Farmakoloji",
];
export const KLINIK_ORDER = [
  "Dahiliye",
  "Pediatri",
  "Genel Cerrahi",
  "Kadın Hastalıkları ve Doğum",
  "Küçük Stajlar",
];

export function pickBalancedByTopic(questions, count, { usedIds = new Set(), topicStartOffset = 0 } = {}) {
  const pool = questions.filter((q) => !usedIds.has(Number(q.id)));
  if (pool.length < count) {
    throw new Error(`Yetersiz soru: ${count} gerekli, ${pool.length} uygun`);
  }

  const byTopic = new Map();
  for (const q of pool) {
    const k = q.konu || "—";
    if (!byTopic.has(k)) byTopic.set(k, []);
    byTopic.get(k).push(q);
  }
  for (const arr of byTopic.values()) {
    arr.sort((a, b) => a.id - b.id);
  }

  const topics = [...byTopic.keys()].sort((a, b) => a.localeCompare(b, "tr"));
  const queues = topics.map((t) => [...byTopic.get(t)]);

  const result = [];
  let lastTopic = null;
  let streak = 0;
  let start = topicStartOffset % Math.max(1, topics.length);

  while (result.length < count) {
    let placed = false;

    for (let pass = 0; pass < topics.length; pass += 1) {
      const qi = (start + pass) % topics.length;
      if (queues[qi].length === 0) continue;
      const topic = topics[qi];
      if (topic === lastTopic && streak >= MAX_TOPIC_STREAK) continue;

      const picked = queues[qi].shift();
      result.push(picked);
      usedIds.add(Number(picked.id));

      if (topic === lastTopic) streak += 1;
      else {
        lastTopic = topic;
        streak = 1;
      }
      start = (qi + 1) % topics.length;
      placed = true;
      break;
    }

    if (!placed) {
      for (let qi = 0; qi < topics.length; qi += 1) {
        if (queues[qi].length === 0) continue;
        const topic = topics[qi];
        const picked = queues[qi].shift();
        result.push(picked);
        usedIds.add(Number(picked.id));
        lastTopic = topic;
        streak = 1;
        start = (qi + 1) % topics.length;
        placed = true;
        break;
      }
    }

    if (!placed) {
      throw new Error(`Konu round-robin tükendi: ${count} gerekli, ${result.length} seçildi`);
    }
  }

  return result;
}

export function interleaveSubjectQueues(subjectQueues, order) {
  const queues = order.map((d) => [...subjectQueues[d]]);
  const out = [];
  const total = queues.reduce((s, q) => s + q.length, 0);

  while (out.length < total) {
    for (let i = 0; i < order.length; i += 1) {
      if (queues[i].length > 0) {
        out.push(queues[i].shift());
      }
    }
  }

  return out;
}

export function buildFixedExamQuestionList(bySubject, { usedIds = new Set(), topicStartOffset = 0 } = {}) {
  const subjectQueues = {};

  for (const ders of [...TEMEL_ORDER, ...KLINIK_ORDER]) {
    const quota = FULL_EXAM_BLUEPRINT[ders];
    const pool = bySubject[ders] || [];
    subjectQueues[ders] = pickBalancedByTopic(pool, quota, { usedIds, topicStartOffset });
  }

  const temel = interleaveSubjectQueues(
    Object.fromEntries(TEMEL_ORDER.map((d) => [d, subjectQueues[d]])),
    TEMEL_ORDER
  );
  const klinik = interleaveSubjectQueues(
    Object.fromEntries(KLINIK_ORDER.map((d) => [d, subjectQueues[d]])),
    KLINIK_ORDER
  );

  return [...temel, ...klinik];
}

export function maxStreak(items, keyFn) {
  let max = 0;
  let cur = 0;
  let prev = null;
  for (const item of items) {
    const k = keyFn(item);
    if (k === prev) cur += 1;
    else {
      cur = 1;
      prev = k;
    }
    max = Math.max(max, cur);
  }
  return max;
}

export function validateFixedExamQuestions(ordered, blueprint = FULL_EXAM_BLUEPRINT) {
  const ids = ordered.map((q) => Number(q.id));
  if (ids.length !== 200) {
    return { ok: false, reason: `length_${ids.length}` };
  }
  if (new Set(ids).size !== 200) {
    return { ok: false, reason: "duplicate_ids" };
  }

  const topicStreak = maxStreak(ordered, (q) => `${q.ders}::${q.konu || "—"}`);
  const dersStreak = maxStreak(ordered, (q) => q.ders);
  if (topicStreak >= 5) return { ok: false, reason: `topic_streak_${topicStreak}` };
  if (dersStreak >= 5) return { ok: false, reason: `ders_streak_${dersStreak}` };

  const dersCounts = {};
  for (const q of ordered) {
    dersCounts[q.ders] = (dersCounts[q.ders] || 0) + 1;
  }
  for (const ders of [...TEMEL_ORDER, ...KLINIK_ORDER]) {
    if (dersCounts[ders] !== blueprint[ders]) {
      return { ok: false, reason: `quota_${ders}` };
    }
  }

  const temelOk = ordered.slice(0, 100).every((q) => TEMEL_ORDER.includes(q.ders));
  const klinikOk = ordered.slice(100, 200).every((q) => KLINIK_ORDER.includes(q.ders));
  if (!temelOk || !klinikOk) return { ok: false, reason: "temel_klinik_split" };

  return { ok: true, topicStreak, dersStreak, dersCounts };
}
