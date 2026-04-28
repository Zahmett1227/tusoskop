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

    const tusNet = Number((correct - wrong / 4).toFixed(2));
    const totalNet = tusNet;

    const completedAt = new Date().toISOString();

    // Firestore'a gönderilecek paket
    const resultData = {
      userId: user.uid,
      examTitle: "TUS Genel Deneme",
      completedAt,
      date: serverTimestamp(),
      tusNet,
      stats: {
        correct: correct,
        wrong: wrong,
        net: totalNet,
        totalNet,
      },
      estimatedTusScore:
        totalNet >= 140
          ? 72
          : totalNet >= 120
            ? 68
            : totalNet >= 95
              ? 62
              : totalNet >= 75
                ? 56
                : 50,
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