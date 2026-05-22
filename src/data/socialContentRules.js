/**
 * Paylaşım öncesi metin güvenlik kuralları.
 * Private API, bot etkileşimi vb. kodda asla kullanılmaz.
 */
export const FORBIDDEN_CLAIM_PATTERNS = [
  /kesin\s+(kazan|geç|başar)/i,
  /garanti\s+(net|başarı|sıralama)/i,
  /%100\s+(başarı|garanti)/i,
  /tus\s*['']?u\s*kesin/i,
  /net\s*artış\s*garanti/i,
  /tedavi\s+(başla|yap|ver)/i,
  /ilaç\s+(kullan|ver|başla)/i,
  /doktora\s+gitme/i,
];

export const FORBIDDEN_SPAM_HASHTAGS = [
  "#followme",
  "#like4like",
  "#follow4follow",
  "#instagood",
  "#viral",
];

export const MAX_EMOJI_COUNT = 6;

export const MINI_TIP_TOPICS = [
  {
    id: "clinical_trap",
    title: "Klinikte karıştırılan nokta",
    templates: [
      "{topic} sorularında en sık tuzak: {point}. TUS’ta ayırıcı ipucu genelde {hint}.",
      "1 dakikalık TUS notu — {topic}: {point}. Bunu ezberlemek yerine mekanizmayı hatırla: {hint}.",
    ],
  },
  {
    id: "exam_favorite",
    title: "TUS’ta sık sorulan ayrım",
    templates: [
      "{topic} ile {contrast} ayırımında kritik bulgu: {point}.",
      "Sınavda sık gelen ayrım — {topic} / {contrast}: {point}.",
    ],
  },
  {
    id: "pharm_pearl",
    title: "Farmakolojide akılda kalması gereken",
    templates: [
      "{drug}: {mechanism}. Yan etki/kontrendikasyon olarak {point} unutulmasın.",
      "Mini farmakoloji notu — {drug}: {mechanism}. TUS ipucu: {point}.",
    ],
  },
];

export const FEATURE_PROMO_ITEMS = [
  {
    id: "topic_tracking",
    title: "Konu takibi",
    hook: "Hangi konuda zayıfsın, tek ekranda gör.",
    body: "Tusoskop’ta ders ve konu bazlı performansını takip edebilir, çalışma planını buna göre şekillendirebilirsin.",
    cta: "Konu yeterlilik ekranına göz at → tusoskop.com",
  },
  {
    id: "wrong_questions",
    title: "Yanlış sorular",
    hook: "Yanlış yaptığın sorular kaybolmasın.",
    body: "Yanlışları otomatik topla, tekrar çöz, zayıf noktalarını kapat.",
    cta: "Yanlışlar sekmesini dene → tusoskop.com",
  },
  {
    id: "favorites",
    title: "Favoriler",
    hook: "Tekrar bakmak istediğin sorular elinin altında.",
    body: "Favorilere eklediğin sorularla hızlı tekrar yap.",
    cta: "Favorilerle çalış → tusoskop.com",
  },
  {
    id: "exams",
    title: "Deneme sınavları",
    hook: "TUS temposunda deneme çöz.",
    body: "Deneme modunda süre ve performansını ölç; analiz ekranında eksiklerini gör.",
    cta: "Deneme başlat → tusoskop.com",
  },
  {
    id: "analytics",
    title: "Performans analizi",
    hook: "Çalışmanın nereye gittiğini gör.",
    body: "Doğru-yanlış trendlerin ve ders dağılımın tek panelde.",
    cta: "Analiz ekranına bak → tusoskop.com",
  },
  {
    id: "countdown",
    title: "TUS geri sayımı",
    hook: "Sınava kalan süreyi net takip et.",
    body: "Dashboard’da geri sayım ve günlük hedeflerle ritmini koru.",
    cta: "Tusoskop’a gir → tusoskop.com",
  },
  {
    id: "mobile",
    title: "Mobil uyum",
    hook: "Molanda, serviste, nöbet arasında soru çöz.",
    body: "Tusoskop mobil uyumlu arayüzle her ekranda kullanılabilir.",
    cta: "Telefondan dene → tusoskop.com",
  },
  {
    id: "plus",
    title: "Tusoskop Plus",
    hook: "Daha yüksek limitler ve premium deneyim.",
    body: "Plus ile günlük soru ve deneme limitlerin genişler; yoğun TUS dönemine uygun.",
    cta: "Plus planlarına bak → tusoskop.com",
  },
];

export const MOTIVATION_LINES = [
  "Bugün az da olsa net bir konu kapattıysan, gün boşa gitmedi.",
  "TUS maratonu: her gün küçük tekrar, büyük fark yaratır.",
  "Yanlış yapmak öğrenmenin parçası — önemli olan kaydetmek ve dönmek.",
  "Konu dağılımına bak, en zayıf 2 konuya odaklan; geri kalanı bekler.",
  "Soru sayısı değil, anladığın soru sayısı önemli.",
];
