import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { classifyDateKey, getLocalDateKey } from "../utils/localDate";

export const updateStreak = async (userId) => {
  if (!userId) return;

  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};

  const today = getLocalDateKey();
  const lastActive = data.lastActiveDate || null;

  if (lastActive === today) return; // Bugün zaten sayıldı

  let currentStreak = data.currentStreak || 0;
  let longestStreak = data.longestStreak || 0;

  // Yerel gün ekseninde: dün aktifse zincir sürer, aksi halde kopar.
  if (classifyDateKey(lastActive) === "yesterday") {
    currentStreak += 1;
  } else {
    currentStreak = 1; // Zincir koptu, sıfırla
  }

  if (currentStreak > longestStreak) longestStreak = currentStreak;

  await setDoc(
    ref,
    { currentStreak, longestStreak, lastActiveDate: today },
    { merge: true }
  );
};

export const getStreak = async (userId) => {
  if (!userId) return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };

  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };

  const data = snap.data();
  const lastActiveDate = data.lastActiveDate || null;
  const longestStreak = data.longestStreak || 0;

  // Tazelik: son aktiflik bugün veya dün değilse zincir fiilen kopmuştur.
  // Kopmuş seriyi "canlı" gösterip sonra aniden 1'e düşürmek yerine 0 döndür.
  const freshness = classifyDateKey(lastActiveDate);
  const currentStreak =
    freshness === "today" || freshness === "yesterday" ? data.currentStreak || 0 : 0;

  return { currentStreak, longestStreak, lastActiveDate };
};
