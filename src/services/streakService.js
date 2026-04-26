import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const todayStr = () => new Date().toISOString().split("T")[0];

const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

export const updateStreak = async (userId) => {
  if (!userId) return;

  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};

  const today = todayStr();
  const lastActive = data.lastActiveDate || null;

  if (lastActive === today) return; // Bugün zaten sayıldı

  let currentStreak = data.currentStreak || 0;
  let longestStreak = data.longestStreak || 0;

  if (lastActive === yesterdayStr()) {
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
  return {
    currentStreak: data.currentStreak || 0,
    longestStreak: data.longestStreak || 0,
    lastActiveDate: data.lastActiveDate || null,
  };
};
