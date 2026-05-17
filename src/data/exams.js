// src/data/exams.js
import { TEKRAR_DENEMESI_1_QUESTION_IDS } from "./tekrarDenemesi1QuestionIds";

export const TEKRAR_DENEMESI_1_EXAM_ID = 7;

export const EXAM_SETS = [
  // KAMP DENEMELERİ
  { id: 1, title: "Kamp Denemesi 1", category: "Kamp", questionCount: 200, difficulty: "Orta" },
  { id: 2, title: "Kamp Denemesi 2", category: "Kamp", questionCount: 200, difficulty: "Zor" },
  { id: 3, title: "Kamp Denemesi 3", category: "Kamp", questionCount: 200, difficulty: "Zor" },

  // BAHAR DENEMELERİ
  { id: 4, title: "Bahar Denemesi 1", category: "Bahar", questionCount: 200, difficulty: "Kolay" },
  { id: 5, title: "Bahar Denemesi 2", category: "Bahar", questionCount: 200, difficulty: "Orta" },
  { id: 6, title: "Bahar Denemesi 3", category: "Bahar", questionCount: 200, difficulty: "Zor" },

  // TEKRAR DENEMELERİ
  {
    id: TEKRAR_DENEMESI_1_EXAM_ID,
    title: "Tekrar Denemesi 1",
    category: "Tekrar",
    questionCount: 200,
    difficulty: "Orta",
    questionIds: TEKRAR_DENEMESI_1_QUESTION_IDS,
    description:
      "Sabit 200 soruluk settir. İlk 100 soru Temel Bilimler, son 100 soru Klinik Bilimler sırasıyla gelir.",
  },
  { id: 8, title: "Tekrar Denemesi 2", category: "Tekrar", questionCount: 200, difficulty: "Orta" },
  { id: 9, title: "Tekrar Denemesi 3", category: "Tekrar", questionCount: 200, difficulty: "Zor" },
  { id: 10, title: "Tekrar Denemesi 4", category: "Tekrar", questionCount: 200, difficulty: "Efsane" },
];