/** @typedef {'daily_question' | 'mini_tip' | 'feature_promo' | 'motivation' | 'story' | 'answer_reveal'} SocialContentType */

/** @typedef {'draft' | 'pending_review' | 'approved' | 'scheduled' | 'published' | 'rejected' | 'failed' | 'exported'} SocialContentStatus */

export const SOCIAL_CONTENT_TYPES = {
  DAILY_QUESTION: "daily_question",
  MINI_TIP: "mini_tip",
  FEATURE_PROMO: "feature_promo",
  MOTIVATION: "motivation",
  STORY: "story",
  ANSWER_REVEAL: "answer_reveal",
};

export const SOCIAL_CONTENT_STATUS = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  REJECTED: "rejected",
  FAILED: "failed",
  EXPORTED: "exported",
};

export const SOCIAL_PLATFORM = {
  INSTAGRAM: "instagram",
};

export const VISUAL_FORMAT = {
  POST_SQUARE: "1080x1080",
  POST_PORTRAIT: "1080x1350",
  STORY: "1080x1920",
};

export const SOCIAL_CONTENT_TYPE_LABELS = {
  daily_question: "Günün TUS Sorusu",
  mini_tip: "Mini TUS Bilgisi",
  feature_promo: "Özellik Tanıtımı",
  motivation: "Motivasyon",
  story: "Story",
  answer_reveal: "Cevap Paylaşımı",
};

export const SOCIAL_STATUS_LABELS = {
  draft: "Taslak",
  pending_review: "Onay Bekliyor",
  approved: "Onaylandı",
  scheduled: "Zamanlandı",
  published: "Paylaşıldı",
  rejected: "Reddedildi",
  failed: "Hata",
  exported: "Export Edildi",
};
