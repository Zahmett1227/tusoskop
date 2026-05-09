/**
 * Pazarlama hunisi için önerilen Firebase Analytics (GA4) olay adları ve aşamalar.
 * Ölçüm arayüzünde (GA4 / Firebase Console) bu isimlerle özel olaylar ve huni oluşturun.
 */

/** @typedef {'awareness'|'intent'|'convert'|'retain'} FunnelStage */

export const FUNNEL_STAGES = {
  awareness: "awareness",
  intent: "intent",
  convert: "convert",
  retain: "retain",
};

/**
 * Önerilen özel olaylar (logEvent ikinci argümanda params ile birlikte).
 * Firebase Analytics otomatik toplar: first_open, session_start (bazı koşullarda).
 */
export const MarketingEvents = {
  /** SPA içi ekran — kaynak/kampanya ile birlikte huni analizi */
  screenView: "screen_view",
  /** Plus / ödeme bilgi ekranı */
  viewPremiumInfo: "view_premium_info",
  /** Limit modalı gösterildi */
  limitModalShown: "limit_modal_shown",
  /** Tam deneme başlatıldı */
  fullExamStart: "full_exam_start",
  /** Konu / branş çalışması başladı */
  topicStudyStart: "topic_study_start",
};

/** GA4 özel tanım / BigQuery export için kısa tablo */
export const FUNNEL_DEFINITION = [
  { stage: FUNNEL_STAGES.awareness, metric: "Oturum / kullanıcı", source: "organik, ads, referral" },
  { stage: FUNNEL_STAGES.intent, metric: "screen_view (dashboard, questionSetup)", source: "Firebase Analytics" },
  { stage: FUNNEL_STAGES.convert, metric: "login (Firebase Auth) + aktif screen_view", source: "Auth + Analytics" },
  { stage: FUNNEL_STAGES.retain, metric: "full_exam_start, topic_study_start, tekrar oturum", source: "Analytics özel olaylar" },
];

/** Microsoft Clarity ile birlikte: src/lib/clarity.js — oturum kaydı ve ısı haritası */
export const CLARITY_NOTES =
  "Clarity otomatik oturum kaydeder; VITE_CLARITY_PROJECT_ID tanımlı olmalı. Reklam kaynağı ayrımı için GA4 kanal raporu birincil kaynak olmalıdır.";
