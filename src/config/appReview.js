/**
 * Uygulama içi değerlendirme (App Store yorumu) yapılandırması.
 *
 * APP_STORE_ID: Uygulamanın numerik App Store kimliği (ör. "1234567890").
 * Uygulama yayına alındığında buraya yazılır. Boşken derin bağlantı açılmaz
 * (ön-soru yine gösterilir; "Evet" sessizce kapanır).
 */
export const APP_STORE_ID = "";

export const APP_REVIEW_CONFIG = {
  /** Toplam çözülen soru bu eşiği geçince (bir kez) değerlendirme istenebilir. */
  minAnsweredForPrompt: 20,
  /** İki istem arasında en az bu kadar gün olmalı. */
  minDaysBetweenPrompts: 30,
  /** Ömür boyu en fazla bu kadar istem gösterilir. */
  maxLifetimePrompts: 3,
};
