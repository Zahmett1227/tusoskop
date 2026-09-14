import { WEB_FREE_ACCESS_CAMPAIGN } from "../config/freeAccessCampaign";

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

export function isUserPremium(userData) {
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

/** Capacitor native (iOS/Android) içinde mi çalışıyoruz? Web'de her zaman false. */
export function isNativeApp() {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.Capacitor?.isNativePlatform === "function" &&
      window.Capacitor.isNativePlatform() === true
    );
  } catch {
    return false;
  }
}

/** Web ücretsiz erişim kampanyası şu an aktif mi? Native uygulamada her zaman false. */
export function isWebFreeAccessActive(now = new Date(), campaign = WEB_FREE_ACCESS_CAMPAIGN) {
  if (!campaign?.enabled) return false;
  if (isNativeApp()) return false;
  const start = toSafeDate(campaign.startsAt);
  const end = toSafeDate(campaign.endsAt);
  if (!start || !end) return false;
  const time = now.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function getWebFreeAccessEndLabel(campaign = WEB_FREE_ACCESS_CAMPAIGN) {
  return formatPremiumUntil(campaign?.endsAt);
}

/**
 * Özellik kilitleri için: gerçek Plus üyeliği VEYA web ücretsiz kampanyası.
 * Ödeme tespiti ve admin sayımları gibi "gerçekten ödemiş mi?" soruları için
 * `isUserPremium` kullanılmaya devam edilmeli.
 */
export function hasPlusAccess(userData, now = new Date()) {
  return isUserPremium(userData) || isWebFreeAccessActive(now);
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
