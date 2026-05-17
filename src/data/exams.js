// src/data/exams.js
import { TEKRAR_DENEMESI_1_QUESTION_IDS } from "./tekrarDenemesi1QuestionIds.js";
import { KAMP_DENEMESI_1_QUESTION_IDS } from "./fixedExams/kampDenemesi1QuestionIds.js";
import { KAMP_DENEMESI_2_QUESTION_IDS } from "./fixedExams/kampDenemesi2QuestionIds.js";
import { KAMP_DENEMESI_3_QUESTION_IDS } from "./fixedExams/kampDenemesi3QuestionIds.js";
import { BAHAR_DENEMESI_1_QUESTION_IDS } from "./fixedExams/baharDenemesi1QuestionIds.js";
import { BAHAR_DENEMESI_2_QUESTION_IDS } from "./fixedExams/baharDenemesi2QuestionIds.js";
import { BAHAR_DENEMESI_3_QUESTION_IDS } from "./fixedExams/baharDenemesi3QuestionIds.js";
import { TEKRAR_DENEMESI_2_QUESTION_IDS } from "./fixedExams/tekrarDenemesi2QuestionIds.js";
import { TEKRAR_DENEMESI_3_QUESTION_IDS } from "./fixedExams/tekrarDenemesi3QuestionIds.js";
import { TEKRAR_DENEMESI_4_QUESTION_IDS } from "./fixedExams/tekrarDenemesi4QuestionIds.js";

export const TEKRAR_DENEMESI_1_EXAM_ID = 7;
/** Sabit set içeriği değişince artırın (sonuç kayıtlarıyla eşleşir). */
export const TEKRAR_DENEMESI_1_SET_VERSION = "2026-05-v2";
/** Yeni sabit denemeler (Kamp/Bahar/Tekrar 2–4) için ortak sürüm. */
export const FIXED_EXAM_SET_VERSION = "2026-05-v1";

/** Deneme kartı alt satırı (seçim ekranı, dashboard). */
export const FIXED_EXAM_CARD_SUBTITLE = "Sabit 200 soru · 100 Temel + 100 Klinik";

const FIXED_EXAM_DESCRIPTION =
  "Her kullanıcıda aynı soru seti ve aynı sıra kullanılır. Ders dağılımı TUS formatına göre düzenlenmiştir.";

function fixedExamFields(questionIds, setVersion = FIXED_EXAM_SET_VERSION) {
  return {
    questionIds,
    fixedSet: true,
    setVersion,
    description: FIXED_EXAM_DESCRIPTION,
  };
}

export const EXAM_SETS = [
  {
    id: 1,
    title: "Kamp Denemesi 1",
    category: "Kamp",
    questionCount: 200,
    difficulty: "Orta",
    ...fixedExamFields(KAMP_DENEMESI_1_QUESTION_IDS),
  },
  {
    id: 2,
    title: "Kamp Denemesi 2",
    category: "Kamp",
    questionCount: 200,
    difficulty: "Zor",
    ...fixedExamFields(KAMP_DENEMESI_2_QUESTION_IDS),
  },
  {
    id: 3,
    title: "Kamp Denemesi 3",
    category: "Kamp",
    questionCount: 200,
    difficulty: "Zor",
    ...fixedExamFields(KAMP_DENEMESI_3_QUESTION_IDS),
  },
  {
    id: 4,
    title: "Bahar Denemesi 1",
    category: "Bahar",
    questionCount: 200,
    difficulty: "Kolay",
    ...fixedExamFields(BAHAR_DENEMESI_1_QUESTION_IDS),
  },
  {
    id: 5,
    title: "Bahar Denemesi 2",
    category: "Bahar",
    questionCount: 200,
    difficulty: "Orta",
    ...fixedExamFields(BAHAR_DENEMESI_2_QUESTION_IDS),
  },
  {
    id: 6,
    title: "Bahar Denemesi 3",
    category: "Bahar",
    questionCount: 200,
    difficulty: "Zor",
    ...fixedExamFields(BAHAR_DENEMESI_3_QUESTION_IDS),
  },
  {
    id: TEKRAR_DENEMESI_1_EXAM_ID,
    title: "Tekrar Denemesi 1",
    category: "Tekrar",
    questionCount: 200,
    difficulty: "Orta",
    questionIds: TEKRAR_DENEMESI_1_QUESTION_IDS,
    fixedSet: true,
    setVersion: TEKRAR_DENEMESI_1_SET_VERSION,
    description: FIXED_EXAM_DESCRIPTION,
  },
  {
    id: 8,
    title: "Tekrar Denemesi 2",
    category: "Tekrar",
    questionCount: 200,
    difficulty: "Orta",
    ...fixedExamFields(TEKRAR_DENEMESI_2_QUESTION_IDS),
  },
  {
    id: 9,
    title: "Tekrar Denemesi 3",
    category: "Tekrar",
    questionCount: 200,
    difficulty: "Zor",
    ...fixedExamFields(TEKRAR_DENEMESI_3_QUESTION_IDS),
  },
  {
    id: 10,
    title: "Tekrar Denemesi 4",
    category: "Tekrar",
    questionCount: 200,
    difficulty: "Efsane",
    ...fixedExamFields(TEKRAR_DENEMESI_4_QUESTION_IDS),
  },
];
