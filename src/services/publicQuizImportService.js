import { addWrongQuestion } from "./studyCollectionService";
import { upsertSmartReview } from "./smartReviewService";
import { readAndClearQuizResult } from "../utils/publicQuizSession";

/**
 * Login-öncesi `/coz` mini deneme funnel'ında çözülen soruları girişten sonra
 * hesaba işler (Phase-2 içe aktarımı). Yalnızca yanlış cevaplanan sorular
 * wrongQuestions + FSRS'e eklenir — normal çalışma akışındaki (`useStudyState`)
 * doğru cevap davranışıyla tutarlı, doğrular herhangi bir kayıt tetiklemiyor.
 */
export async function importPublicQuizResultIfPresent(user, userData, questions) {
  if (!user?.uid) return;
  const result = readAndClearQuizResult();
  if (!result || !Array.isArray(result.answers) || !result.answers.length) return;

  const byId = new Map((questions || []).map((q) => [Number(q.id), q]));

  for (const answer of result.answers) {
    if (!answer || answer.isCorrect) continue;
    const question = byId.get(Number(answer.questionId));
    if (!question) continue;
    try {
      await addWrongQuestion(user, question, answer.selectedIndex, userData);
      await upsertSmartReview(user, question, "wrong");
    } catch {
      /* tek bir sorunun işlenememesi diğerlerini engellemesin */
    }
  }
}
