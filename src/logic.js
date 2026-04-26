import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const saveTusResult = async (user, questions, answers) => {
  try {
    let correct = 0;
    let wrong = 0;
    const branchStats = {}; // Ders bazlı analiz için

    questions.forEach((q, index) => {
      const userAnswer = answers[index];
      const branch = q.ders || "Genel"; // Patoloji, Anatomi vb.

      if (!branchStats[branch]) {
        branchStats[branch] = { correct: 0, wrong: 0 };
      }

      if (userAnswer === q.correct) {
        correct++;
        branchStats[branch].correct++;
      } else if (userAnswer !== null) {
        wrong++;
        branchStats[branch].wrong++;
      }
    });

    const totalNet = correct - (wrong * 0.25);

    // Firestore'a gönderilecek paket
    const resultData = {
      userId: user.uid,
      examTitle: "TUS Genel Deneme",
      date: serverTimestamp(),
      stats: {
        correct: correct,
        wrong: wrong,
        net: totalNet
      },
      breakdown: branchStats // Ders ders başarı oranları
    };

    const docRef = await addDoc(collection(db, "results"), resultData);
    console.log("Başarıyla kaydedildi, ID:", docRef.id);
    return true;
  } catch (error) {
    console.error("Veri kaydedilirken hata oluştu:", error);
    return false;
  }
};