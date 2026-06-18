export const SCORING = {
  BASE_QUESTION: 2,
  CORRECT_BONUS: 8,
  HARD_BONUS: 4,
  FSRS_DAILY_BONUS: 20,
  STREAK_DAY_BONUS: 10,
  MOCK_EXAM_BONUS: 50,
  HARD_DIFF_THRESHOLD: 4,
  DAILY_QUESTION_SOFT_CAP: 150,
};

export const EVENT_TYPES = {
  QUESTION_SOLVED: "question_solved",
  FSRS_DAILY_COMPLETED: "fsrs_daily_completed",
  STREAK_DAY: "streak_day",
  MOCK_EXAM_COMPLETED: "mock_exam_completed",
};

export function calcQuestionPoints({ isCorrect, difficulty }) {
  let pts = SCORING.BASE_QUESTION;
  if (isCorrect) {
    pts += SCORING.CORRECT_BONUS;
    if (Number(difficulty) >= SCORING.HARD_DIFF_THRESHOLD) {
      pts += SCORING.HARD_BONUS;
    }
  }
  return pts;
}

export function buildQuestionDedupeKey(weekId, uid, questionId) {
  return `${weekId}_${uid}_q${questionId}`;
}

export function buildDailyEventDedupeKey(weekId, uid, eventType, dateStr) {
  return `${weekId}_${uid}_${eventType}_${dateStr}`;
}

export function getTodayDateStr() {
  return new Date().toISOString().split("T")[0];
}

export const LEAGUES = {
  TEMEL: "temel",
  KLINIK: "klinik",
};

const TEMEL_SUBJECT_SET = new Set([
  "Fizyoloji", "Patoloji", "Farmakoloji", "Mikrobiyoloji", "Anatomi", "Biyokimya",
]);

export function getLeagueForSubject(subjectName) {
  if (!subjectName) return LEAGUES.KLINIK;
  return TEMEL_SUBJECT_SET.has(subjectName) ? LEAGUES.TEMEL : LEAGUES.KLINIK;
}

export function getMotivationMessage({ rank, score, topScore }) {
  if (rank === 1) return "Bu hafta zirvede! Devam et!";
  if (rank <= 3) return `İlk 3'tesin! Haftayı güçlü bitir.`;
  if (rank <= 10) return `İlk 10'dasin. ${topScore - score > 0 ? `Birinciye ${topScore - score} puan kaldı.` : ""}`;
  if (rank <= 50) return `İlk 10'a girmek için ${Math.max(0, score + 1)} puana daha ihtiyacın var.`;
  return `Bu hafta aktif çalışıyorsun. İlk 50'ye girmek için yavaşlama!`;
}
