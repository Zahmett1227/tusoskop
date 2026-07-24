import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { classifyDateKey, getLocalDateKey, getLocalDateKeyOffset } from "../utils/localDate";

// Eski sürüm streak gününü UTC (toISOString) ile yazıyordu; artık yerel gün
// kullanılıyor. UTC+3 gibi pozitif offset'lerde eski UTC anahtarı, aynı yerel
// güne göre en fazla 1 gün geride olabilir. Bu yüzden şema henüz "local"a
// geçmemiş bir kullanıcıda, tam 2 gün geride görünen bir kayıt aslında "dün"e
// denk gelebilir → tek seferlik geçiş toleransı ile seriyi haksız yere kopartma.
const SCHEME_LOCAL = "local";

function isMigrationGraceContinuation(data, now = new Date()) {
  const migrated = data?.streakDateScheme === SCHEME_LOCAL;
  if (migrated) return false;
  const lastActive = data?.lastActiveDate || null;
  // Eski UTC anahtarı en fazla 1 gün geride kayar → "dün"lük çözüm -2 görünür.
  return lastActive === getLocalDateKeyOffset(-2, now);
}

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

  // Yerel gün ekseninde: dün aktifse zincir sürer. UTC→yerel geçişinde ilk
  // çözümde 2 gün geride görünen eski kayıt için tek seferlik tolerans uygula.
  if (classifyDateKey(lastActive) === "yesterday" || isMigrationGraceContinuation(data)) {
    currentStreak += 1;
  } else {
    currentStreak = 1; // Zincir koptu, sıfırla
  }

  if (currentStreak > longestStreak) longestStreak = currentStreak;

  await setDoc(
    ref,
    { currentStreak, longestStreak, lastActiveDate: today, streakDateScheme: SCHEME_LOCAL },
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
  // İstisna: UTC→yerel geçişinde henüz güncellenmemiş kayıt (2 gün geride) hâlâ
  // canlı sayılır — bir sonraki çözümde updateStreak zaten migrate edecek.
  const freshness = classifyDateKey(lastActiveDate);
  const isAlive =
    freshness === "today" ||
    freshness === "yesterday" ||
    isMigrationGraceContinuation(data);
  const currentStreak = isAlive ? data.currentStreak || 0 : 0;

  return { currentStreak, longestStreak, lastActiveDate };
};
