import { isNativeIOS } from "./device";

const toSafeDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === "function") {
    const tsDate = value.toDate();
    return Number.isNaN(tsDate?.getTime?.()) ? null : tsDate;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const APP_REVIEW_EMAIL = "apple-review@tusoskop.com";

export function isAppReviewEmail(value) {
  return String(value || "").trim().toLowerCase() === APP_REVIEW_EMAIL;
}

export function isUserPremium(userData, user = null) {
  // iOS native ilk sürümde IAP yok; kullanıcı free limitlere takılmasın diye
  // platform bazlı tam erişim verilir. Bu salt-okunur bir kontroldür —
  // Firestore'a kalıcı isPlus/premium ALANI YAZMAZ. Web'de daima false döner.
  if (isNativeIOS()) return true;
  if (isAppReviewEmail(user?.email) || isAppReviewEmail(userData?.email)) return true;
  if (!userData) return false;
  if (userData.lifetimePremium === true) return true;
  if (userData.plan !== "plus") return false;
  if (userData.premiumStatus !== "active") return false;
  if (!userData.premiumUntil) return false;

  const until = toSafeDate(userData.premiumUntil);
  if (!until) return false;

  return until > new Date();
}

export function isPremiumActive(userData) {
  return isUserPremium(userData);
}

export function formatPremiumUntil(value) {
  const until = toSafeDate(value);
  if (!until) return "-";
  return until.toLocaleDateString("tr-TR");
}

export function getPremiumStatusLabel(userData) {
  // iOS native'de Plus/satın alma çağrışımı yapmadan nötr bir ifade göster.
  if (isNativeIOS()) return "Tüm özellikler açık.";
  if (!userData) return "Free plan";
  if (userData.lifetimePremium) return "Ömür boyu erişim";
  if (isUserPremium(userData)) return `${formatPremiumUntil(userData.premiumUntil)} tarihine kadar aktif`;
  if (userData.plan === "plus" && userData.premiumStatus === "active") return "Premium süresi geçersiz";
  return "Plus ile sınırsız tekrar, deneme ve gelişmiş analiz açılır.";
}

export function getPremiumLabel(userData) {
  // iOS native'de "Ücretsiz/Plus" ayrımı yerine nötr "Tam erişim" göster.
  if (isNativeIOS()) return "Tam erişim";
  if (!userData) return "Ücretsiz";
  if (userData.lifetimePremium) return "Ömür boyu Plus";
  if (isUserPremium(userData)) return "Plus aktif";
  if (
    userData.plan === "plus" &&
    userData.premiumStatus === "active" &&
    userData.premiumUntil
  ) {
    const until = toSafeDate(userData.premiumUntil);
    if (until && until.getTime() <= Date.now()) return "Süresi dolmuş";
  }
  return "Ücretsiz";
}
