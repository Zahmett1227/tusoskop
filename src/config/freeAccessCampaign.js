/**
 * Web'e özel ücretsiz erişim kampanyası.
 *
 * Bu tarih aralığında web (tusoskop.com) kullanıcıları tüm Plus özelliklerine
 * ücretsiz erişir. iOS/Android native uygulamada (Capacitor) HİÇBİR ZAMAN aktif
 * olmaz — `isWebFreeAccessActive()` native platformu ayrıca kontrol eder.
 *
 * Kampanyayı erken kapatmak için `enabled: false` yap; uzatmak için `endsAt`'i değiştir.
 * Tarihler Türkiye saatiyle (+03:00) yazılır.
 */
export const WEB_FREE_ACCESS_CAMPAIGN = {
  enabled: true,
  startsAt: "2026-09-15T00:00:00+03:00",
  endsAt: "2026-10-31T23:59:59+03:00",
};
