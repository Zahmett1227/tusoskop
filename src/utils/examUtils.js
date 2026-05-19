export const shuffleArray = (arr) => {
  return [...arr].sort(() => Math.random() - 0.5);
};

export const groupByTopic = (questions) => {
  return questions.reduce((acc, q) => {
    const topic = q.konu || "Diğer";
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(q);
    return acc;
  }, {});
};

export const pickBalancedQuestions = (questions, quota) => {
  const grouped = groupByTopic(questions);
  const topics = Object.keys(grouped);

  const result = [];
  const usedIds = new Set();

  let topicIndex = 0;

  while (result.length < quota) {
    const availableTopics = topics.filter((topic) =>
      grouped[topic].some((q) => !usedIds.has(q.id))
    );

    if (availableTopics.length === 0) break;

    const topic = availableTopics[topicIndex % availableTopics.length];
    const pool = shuffleArray(
      grouped[topic].filter((q) => !usedIds.has(q.id))
    );

    if (pool.length > 0) {
      const picked = pool[0];
      result.push(picked);
      usedIds.add(picked.id);
    }

    topicIndex++;
  }

  if (result.length < quota) {
    const remaining = shuffleArray(
      questions.filter((q) => !usedIds.has(q.id))
    ).slice(0, quota - result.length);

    result.push(...remaining);
  }

  return shuffleArray(result);
};

/**
 * Sabit questionIds listesinden soruları sırayla döndürür (shuffle yok).
 * @param {number[]} questionIds
 * @param {Array<{ id: number }>} allQuestions
 */
export function getFixedExamQuestions(questionIds, allQuestions) {
  if (!Array.isArray(questionIds) || questionIds.length === 0) return [];

  const byId = new Map();
  for (const question of allQuestions || []) {
    if (question?.id == null) continue;
    byId.set(Number(question.id), question);
  }

  const result = [];
  const missing = [];

  for (const rawId of questionIds) {
    const id = Number(rawId);
    const question = byId.get(id);
    if (!question) {
      missing.push(id);
      continue;
    }
    result.push(question);
  }

  if (missing.length > 0) {
    console.error(
      `getFixedExamQuestions: ${missing.length} missing id(s)`,
      missing.slice(0, 20)
    );
  }

  return result;
}

export const buildFullExam = (QUESTIONS, blueprint) => {
  const exam = [];
  const usedIds = new Set();

  Object.entries(blueprint).forEach(([ders, quota]) => {
    const subjectQuestions = QUESTIONS.filter(
      (q) => q.ders === ders && !usedIds.has(q.id)
    );

    const picked = pickBalancedQuestions(subjectQuestions, quota);

    picked.forEach((q) => usedIds.add(q.id));
    exam.push(...picked);
  });

  return shuffleArray(exam);
};

export const scaleBlueprintToTotal = (blueprint, totalQuestions) => {
  const entries = Object.entries(blueprint);
  const baseTotal = entries.reduce((sum, [, quota]) => sum + quota, 0);
  if (!baseTotal || totalQuestions <= 0) return {};

  const scaled = entries.map(([lesson, quota]) => {
    const raw = (quota / baseTotal) * totalQuestions;
    return { lesson, base: Math.floor(raw), fraction: raw - Math.floor(raw) };
  });

  let assigned = scaled.reduce((sum, item) => sum + item.base, 0);
  let remaining = totalQuestions - assigned;

  // Distribute remaining questions by largest fractional parts first.
  scaled
    .sort((a, b) => b.fraction - a.fraction)
    .forEach((item) => {
      if (remaining > 0) {
        item.base += 1;
        remaining -= 1;
      }
    });

  return scaled.reduce((acc, item) => {
    acc[item.lesson] = item.base;
    return acc;
  }, {});
};

/** Deneme cevabı — yalnızca deneme içi sıra (0 tabanlı index). question.id ile okuma yapılmaz. */
export const getExamAnswerAtIndex = (answers, index) => {
  if (!answers || index === undefined || index === null) return undefined;
  if (Object.prototype.hasOwnProperty.call(answers, index)) return answers[index];
  const indexKey = String(index);
  if (Object.prototype.hasOwnProperty.call(answers, indexKey)) return answers[indexKey];
  return undefined;
};

export const getSelectedAnswerIndex = (answers, _question, index) =>
  getExamAnswerAtIndex(answers, index);

export const analyzeExamResults = (examQuestions, examAnswers) => {
  const summary = {
    total: examQuestions.length,
    correct: 0,
    wrong: 0,
    blank: 0,
    net: 0,
    successRate: 0,
  };

  const byLesson = {};
  const wrongTopicsByLesson = {};
  const wrongQuestions = [];

  examQuestions.forEach((q, index) => {
    const answer = getSelectedAnswerIndex(examAnswers, q, index);
    const lesson = q.ders;
    const topic = q.konu || "Diğer";

    if (!byLesson[lesson]) {
      byLesson[lesson] = { total: 0, correct: 0, wrong: 0, blank: 0, successRate: 0 };
    }
    if (!wrongTopicsByLesson[lesson]) {
      wrongTopicsByLesson[lesson] = {};
    }

    byLesson[lesson].total += 1;

    if (answer === null || answer === undefined) {
      summary.blank += 1;
      byLesson[lesson].blank += 1;
    } else if (answer === q.correct) {
      summary.correct += 1;
      byLesson[lesson].correct += 1;
    } else {
      summary.wrong += 1;
      byLesson[lesson].wrong += 1;
      wrongTopicsByLesson[lesson][topic] = (wrongTopicsByLesson[lesson][topic] || 0) + 1;

      wrongQuestions.push({
        ders: lesson,
        konu: topic,
        q: q.q,
        options: q.options,
        userAnswer: answer,
        correct: q.correct,
        exp: q.exp || null,
      });
    }
  });

  summary.net = summary.correct - summary.wrong * 0.25;
  summary.successRate =
    summary.total > 0 ? Math.round((summary.correct / summary.total) * 100) : 0;

  Object.keys(byLesson).forEach((lesson) => {
    const l = byLesson[lesson];
    l.successRate = l.total > 0 ? Math.round((l.correct / l.total) * 100) : 0;
  });

  const weakestLessons = Object.entries(byLesson)
    .sort((a, b) => a[1].successRate - b[1].successRate)
    .slice(0, 2)
    .map(([lesson, stats]) => ({
      lesson,
      ...stats,
      weakTopics: Object.entries(wrongTopicsByLesson[lesson] || {})
        .sort((a, b) => b[1] - a[1])
        .map(([topic]) => topic),
    }));

  // Yanlış soruları ders → konu hiyerarşisinde grupla
  const wrongByLessonTopic = wrongQuestions.reduce((acc, wq) => {
    if (!acc[wq.ders]) acc[wq.ders] = {};
    if (!acc[wq.ders][wq.konu]) acc[wq.ders][wq.konu] = [];
    acc[wq.ders][wq.konu].push(wq);
    return acc;
  }, {});

  return {
    summary,
    byLesson,
    weakestLessons,
    wrongQuestions,
    wrongByLessonTopic,
  };
};

export const isReactEventOrDomNode = (value) =>
  Boolean(
    value &&
      typeof value === "object" &&
      (value.nativeEvent ||
        value.currentTarget ||
        value.target ||
        value.nodeType ||
        value.__reactFiber)
  );

export const normalizeAnswerValue = (value) => {
  if (value === null || value === undefined) return null;
  if (isReactEventOrDomNode(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getEstimatedTusResult = (net) => {
  if (net >= 140)
    return { score: "72+", label: "Çok yüksek", advice: "Rekabetçi branşlar mümkün." };
  if (net >= 120)
    return { score: "66-71", label: "Yüksek", advice: "Güçlü klinik seçenekler." };
  if (net >= 95)
    return { score: "60-65", label: "Orta", advice: "Çoğu branş erişilebilir." };
  if (net >= 75)
    return { score: "54-59", label: "Geliştirilmeli", advice: "Net artırılmalı." };

  return { score: "<54", label: "Düşük", advice: "Temel açıklar kapatılmalı." };
};