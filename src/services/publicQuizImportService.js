import { addWrongQuestion } from "./studyCollectionService";
import { upsertSmartReview } from "./smartReviewService";
import { readAndClearQuizResult } from "../utils/publicQuizSession";
import { PUBLIC_QUIZ_CAMPAIGNS } from "../data/publicQuizCampaigns";

/**
 * Funnel sorularının sentetik id'si (ör. `public_pat_001`) → ana bankadaki
 * sayısal `bankId` eşlemesi. Funnel cevapları sentetik id ile saklandığı için
 * (ana bankada çözülemez), import bu tabloyla gerçek bank id'sine çevirir.
 */
const FUNNEL_ID_TO_BANK_ID = new Map();
for (const campaign of PUBLIC_QUIZ_CAMPAIGNS) {
  for (const question of campaign.questions || []) {
    if (question?.id != null && question.bankId != null) {
      FUNNEL_ID_TO_BANK_ID.set(String(question.id), Number(question.bankId));
    }
  }
}

/**
 * Login-öncesi `/coz` mini deneme funnel'ında çözülen soruları girişten sonra
 * hesaba işler (Phase-2 içe aktarımı). Yalnızca yanlış cevaplanan sorular
 * wrongQuestions + FSRS'e eklenir — normal çalışma akışındaki (`useStudyState`)
 * doğru cevap davranışıyla tutarlı, doğrular herhangi bir kayıt tetiklemiyor.
 *
 * Not: funnel cevapları sentetik id (public_pat_001) taşır; bunlar `bankId` ile
 * ana bankadaki gerçek soruya çevrilir. wrongQuestions/FSRS sayısal bank id ile
 * anahtarlandığı için bu çeviri şart — aksi halde her yanlış sessizce atlanırdı.
 */
export async function importPublicQuizResultIfPresent(user, userData, questions) {
  if (!user?.uid) return;
  const result = readAndClearQuizResult();
  if (!result || !Array.isArray(result.answers) || !result.answers.length) return;

  const byId = new Map((questions || []).map((q) => [Number(q.id), q]));

  for (const answer of result.answers) {
    if (!answer || answer.isCorrect) continue;
    const bankId = FUNNEL_ID_TO_BANK_ID.get(String(answer.questionId));
    if (bankId == null) continue;
    const question = byId.get(bankId);
    if (!question) continue;
    try {
      await addWrongQuestion(user, question, answer.selectedIndex, userData);
      await upsertSmartReview(user, question, "wrong");
    } catch {
      /* tek bir sorunun işlenememesi diğerlerini engellemesin */
    }
  }
}
