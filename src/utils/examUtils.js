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

  examQuestions.forEach((q, index) => {
    const answer = examAnswers[index];
    const lesson = q.ders;
    const topic = q.konu || "Diğer";

    if (!byLesson[lesson]) {
      byLesson[lesson] = {
        total: 0,
        correct: 0,
        wrong: 0,
        blank: 0,
        successRate: 0,
      };
    }

    if (!wrongTopicsByLesson[lesson]) {
      wrongTopicsByLesson[lesson] = {};
    }

    byLesson[lesson].total += 1;

    if (answer === null) {
      summary.blank += 1;
      byLesson[lesson].blank += 1;
    } else if (answer === q.correct) {
      summary.correct += 1;
      byLesson[lesson].correct += 1;
    } else {
      summary.wrong += 1;
      byLesson[lesson].wrong += 1;

      wrongTopicsByLesson[lesson][topic] =
        (wrongTopicsByLesson[lesson][topic] || 0) + 1;
    }
  });

  summary.net = summary.correct - summary.wrong * 0.25;
  summary.successRate =
    summary.total > 0
      ? Math.round((summary.correct / summary.total) * 100)
      : 0;

  Object.keys(byLesson).forEach((lesson) => {
    const l = byLesson[lesson];
    l.successRate =
      l.total > 0 ? Math.round((l.correct / l.total) * 100) : 0;
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

  return {
    summary,
    byLesson,
    weakestLessons,
  };
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