// Apple App Store subscription product ID'leri
// App Store Connect'te bu ID'lerle oluşturulmalı
export const IAP_PRODUCT_IDS = [
  'com.tusoskop.app.plus.1m',
  'com.tusoskop.app.plus.3m',
  'com.tusoskop.app.plus.6m',
];

export const IAP_PLAN_MAP = {
  'com.tusoskop.app.plus.1m': {
    id: 'plus_1m',
    durationLabel: '1 Aylık',
    badge: null,
    highlight: false,
  },
  'com.tusoskop.app.plus.3m': {
    id: 'plus_3m',
    durationLabel: '3 Aylık',
    badge: 'Önerilen',
    highlight: true,
  },
  'com.tusoskop.app.plus.6m': {
    id: 'plus_6m',
    durationLabel: '6 Aylık',
    badge: 'En avantajlı',
    highlight: false,
  },
};
