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
  // App Review hesabı her zaman premium erişime sahip
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
  if (!userData) return "Free plan";
  if (userData.lifetimePremium) return "Ömür boyu erişim";
  if (isUserPremium(userData)) return `${formatPremiumUntil(userData.premiumUntil)} tarihine kadar aktif`;
  if (userData.plan === "plus" && userData.premiumStatus === "active") return "Premium süresi geçersiz";
  if (isNativeIOS()) return "Plus aboneliğiniz yok.";
  return "Plus ile sınırsız tekrar, deneme ve gelişmiş analiz açılır.";
}

export function getPremiumLabel(userData) {
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
