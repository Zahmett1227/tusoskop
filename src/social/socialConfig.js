/**
 * Tusoskop sosyal medya yapılandırması.
 * Meta/Instagram secret'ları YALNIZCA Cloud Functions ortamında tutulur.
 */
export const SOCIAL_CONFIG = {
  brandName: "Tusoskop",
  siteUrl: "https://tusoskop.com",
  language: "tr",
  platform: "instagram",

  /** MVP: günlük üretim hedefleri */
  dailyTargets: {
    daily_question: 1,
    mini_tip: 1,
  },
  weeklyTargets: {
    feature_promo: 2,
  },

  /** Tekrar engelleme penceresi (gün) */
  dedupeWindowDays: 30,

  /** Caption üst sınırı */
  maxCaptionLength: 2200,
  maxHashtags: 8,

  /** Görsel tema */
  colors: {
    bg: "#020617",
    card: "#0f172a",
    border: "#1e293b",
    text: "#f8fafc",
    muted: "#94a3b8",
    accent: "#10b981",
    accentSoft: "#34d399",
  },

  /** Cloud Functions callable adları */
  functions: {
    publishContent: "publishSocialContent",
    tryPublish: "tryPublishSocialContent",
  },
};
