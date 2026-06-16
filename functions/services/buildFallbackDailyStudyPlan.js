/**
 * Deterministic fallback plan generator.
 * Used when AI call fails or returns unparseable/invalid JSON.
 *
 * @param {object} studySummary - Output of buildUserStudySummary()
 * @returns {object} A valid dailyPlan recommendation object
 */
function buildFallbackDailyStudyPlan(studySummary) {
  const overdue = studySummary?.fsrsStats?.overdue ?? 0;
  const dueToday = studySummary?.fsrsStats?.dueToday ?? 0;
  const weakTopics = studySummary?.weakTopics ?? [];

  // Case A: Heavy overdue backlog
  if (overdue > 20) {
    return {
      dailyPlan: [
        {
          type: "fsrs_review",
          title: "Gecikmiş FSRS tekrarlarını bitir",
          lesson: null,
          topic: null,
          questionCount: Math.min(overdue, 40),
          estimatedMinutes: 35,
          reason:
            "Gecikmiş tekrarların birikmiş. Öncelik bunları kapatmak olmalı.",
        },
      ],
      summary: "Bugün öncelik gecikmiş tekrarlarını azaltmak.",
      motivationMessage:
        "Tekrar yükünü temizlemek sonraki çalışmalarını daha verimli hale getirir.",
      risk: "overdue_fsrs_accumulation",
    };
  }

  // Case B: Due today + weak topics exist
  if (dueToday > 0 && weakTopics.length > 0) {
    const topWeak = weakTopics[0];
    return {
      dailyPlan: [
        {
          type: "fsrs_review",
          title: "Bugünkü FSRS tekrarlarını çöz",
          lesson: null,
          topic: null,
          questionCount: Math.min(dueToday, 30),
          estimatedMinutes: Math.round(Math.min(dueToday, 30) * 0.8),
          reason: "Bugün tekrar zamanı gelen sorular FSRS planına göre hazır.",
        },
        {
          type: "weak_topic_test",
          title: `${topWeak.lesson} - ${topWeak.topic} testi çöz`,
          lesson: topWeak.lesson,
          topic: topWeak.topic,
          questionCount: 20,
          estimatedMinutes: 20,
          reason: topWeak.reason || "Bu konuda yeterlilik düzeyin düşük.",
        },
      ],
      summary: "Önce FSRS tekrarlarını tamamla, sonra zayıf konuya geç.",
      motivationMessage:
        "Tekrarları bitirdikten sonra zayıf konuya odaklanmak daha verimli olur.",
      risk: overdue > 5 ? "overdue_fsrs_accumulation" : "weak_topic_neglect",
    };
  }

  // Case C: Weak topics, low FSRS load
  if (weakTopics.length > 0) {
    const top = weakTopics.slice(0, 2);
    const plan = top.map((wt) => ({
      type: "weak_topic_test",
      title: `${wt.lesson} - ${wt.topic} testi çöz`,
      lesson: wt.lesson,
      topic: wt.topic,
      questionCount: 20,
      estimatedMinutes: 20,
      reason: wt.reason || "Bu konuda yeterlilik düzeyin düşük.",
    }));
    return {
      dailyPlan: plan,
      summary: "Bugün zayıf konulara odaklanmak en verimli seçenek.",
      motivationMessage: "Zayıf konuları çalışmak sınavda büyük fark yaratır.",
      risk: "weak_topic_neglect",
    };
  }

  // Case D: Insufficient data — balanced mix
  return {
    dailyPlan: [
      {
        type: "mixed_test",
        title: "Karma TUS soruları çöz",
        lesson: null,
        topic: null,
        questionCount: 20,
        estimatedMinutes: 20,
        reason:
          "Yeterli çalışma verisi henüz oluşmadı. Karma test sistemi besleyecek.",
      },
      ...(dueToday > 0
        ? [
            {
              type: "fsrs_review",
              title: "Hafif FSRS tekrarı",
              lesson: null,
              topic: null,
              questionCount: Math.min(dueToday, 10),
              estimatedMinutes: 10,
              reason: "Bugün tekrar zamanı gelen az sayıda kart var.",
            },
          ]
        : []),
    ],
    summary: "Veri henüz birikmiyor; dengeli karma çalışma öneriliyor.",
    motivationMessage:
      "Düzenli çalıştıkça plan sana daha özel öneriler sunmaya başlar.",
    risk: "low_activity",
  };
}

module.exports = { buildFallbackDailyStudyPlan };
