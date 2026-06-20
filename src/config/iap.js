// Apple App Store subscription product ID'leri
// App Store Connect'te bu ID'lerle oluşturulmalı
export const IAP_PRODUCT_IDS = [
  'com.tusoskop.app.plus.1m',
  'com.tusoskop.app.plus.3m',
  'com.tusoskop.app.plus.1y.monthly',
  'com.tusoskop.app.plus.1y.annual',
];

// Yıllık planları gruplamak için
export const YEARLY_PRODUCT_IDS = [
  'com.tusoskop.app.plus.1y.monthly',
  'com.tusoskop.app.plus.1y.annual',
];

export const IAP_PLAN_MAP = {
  'com.tusoskop.app.plus.1m': {
    id: 'plus_1m',
    durationLabel: '1 Aylık',
    badge: null,
    highlight: false,
    fallbackPrice: '79,99 TL',
    fallbackNote: '/ay',
    description: 'Plus\'ı denemek isteyenler için başlangıç seçeneği.',
  },
  'com.tusoskop.app.plus.3m': {
    id: 'plus_3m',
    durationLabel: '3 Aylık',
    badge: 'Önerilen',
    highlight: true,
    fallbackPrice: '59,99 TL',
    fallbackNote: '/ay · Toplam 179,97 TL',
    description: 'Düzenli çalışma dönemi için daha avantajlı seçenek.',
  },
  'com.tusoskop.app.plus.1y.monthly': {
    id: 'plus_1y_monthly',
    durationLabel: '1 Yıllık · Aylık Ödemeli',
    badge: null,
    highlight: false,
    fallbackPrice: '49,99 TL',
    fallbackNote: '/ay · Yılda 599,88 TL',
    description: '12 aylık erişim, her ay otomatik yenilenir.',
    isYearly: true,
  },
  'com.tusoskop.app.plus.1y.annual': {
    id: 'plus_1y_annual',
    durationLabel: '1 Yıllık · Tek Ödeme',
    badge: 'En avantajlı',
    highlight: false,
    fallbackPrice: '449,99 TL',
    fallbackNote: '/yıl · Aylık 37,49 TL',
    description: 'Tek ödemede 12 ay erişim, en düşük aylık fiyat.',
    isYearly: true,
  },
};
