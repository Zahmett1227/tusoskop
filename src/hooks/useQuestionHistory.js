import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  buildQuestionHistoryMap,
  loadLocalQuestionHistoryList,
  normalizeQuestionHistoryEntry,
} from "../utils/questionHistoryUtils";

/**
 * Firestore questionHistory aboneliği — TopicTracker için real-time map.
 *
 * Dönüş:
 *  - `null` → ilk yükleme bekleniyor
 *  - `{}`  → veri yok / offline ve cache de boş
 *  - `{[questionId]: trackerView}` → tracker özetleri için hazır
 *
 * `auth.currentUser?.uid === user.uid` koşulu ile permission-denied önlenir;
 * offline persistentLocalCache açıkken ilk açılış cache'den anında döner.
 *
 * @param {import('firebase/auth').User | { uid: string } | null | undefined} user
 */
export function useQuestionHistory(user) {
  const uid = user?.uid || null;
  const [historyMap, setHistoryMap] = useState(null);

  useEffect(() => {
    if (!uid) {
      setHistoryMap(buildQuestionHistoryMap(loadLocalQuestionHistoryList()));
      return undefined;
    }

    if (auth.currentUser?.uid !== uid) {
      setHistoryMap(buildQuestionHistoryMap(loadLocalQuestionHistoryList()));
      return undefined;
    }

    const ref = collection(db, "users", uid, "questionHistory");
    const unsub = onSnapshot(
      ref,
      { includeMetadataChanges: false },
      (snap) => {
        const entries = [];
        snap.forEach((d) => {
          const normalized = normalizeQuestionHistoryEntry({
            ...d.data(),
            questionId: Number(d.id),
          });
          if (normalized) entries.push(normalized);
        });
        setHistoryMap(buildQuestionHistoryMap(entries));
      },
      (error) => {
        if (error?.code !== "permission-denied" && error?.code !== "unauthenticated") {
          console.error("useQuestionHistory error:", error);
        }
        setHistoryMap(buildQuestionHistoryMap(loadLocalQuestionHistoryList()));
      }
    );

    return () => unsub();
  }, [uid]);

  return historyMap;
}
