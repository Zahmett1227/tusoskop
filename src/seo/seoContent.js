import {
  SUBJECTS,
  TOTAL_QUESTIONS,
  LESSON_COUNT,
  FREE_DAILY_QUESTIONS,
  FREE_DAILY_TOPIC_TESTS,
  questionCountLabel,
} from "./subjectData.js";
import {
  KONTENJAN_DATA,
  KONTENJAN_DAL_COUNT,
  KONTENJAN_TOPLAM,
  KONTENJAN_DONEM_LABEL,
} from "./kontenjanData.js";

export const SITE_URL = "https://www.tusoskop.com";
export const BRAND_NAME = "Tusoskop";
export const APP_STORE_URL = "https://apps.apple.com/tr/app/tusoskop/id6776331691?l=tr";
export const OG_IMAGE = `${SITE_URL}/tusoskop-mark.png`;
export const LASTMOD = "2026-06-24";

// Pazarlama etiketleri — soru bankasından otomatik türetilir, asla abartmaz.
export const QUESTION_COUNT_LABEL = questionCountLabel(); // örn. "7.000+"
export const LESSON_COUNT_LABEL = `${LESSON_COUNT} ders`;

// Ana sayfa ve branş sayfalarında gösterilen rakamsal güven kartları.
export const HERO_STATS = [
  { value: QUESTION_COUNT_LABEL, label: "TUS tarzı soru" },
  { value: `${LESSON_COUNT}`, label: "Ders / branş" },
  { value: `${FREE_DAILY_QUESTIONS}`, label: "Günlük ücretsiz soru" },
  { value: "AI", label: "Çalışma planı" },
];

export { SUBJECTS, TOTAL_QUESTIONS, LESSON_COUNT, FREE_DAILY_QUESTIONS, FREE_DAILY_TOPIC_TESTS };

// Google'ın site adı aramalarında "sitelinks" olarak göstermeyi değerlendirdiği
// ana navigasyon — üstteki header ile birebir aynı olmalı (PublicHeader'daki nav'a bak).
export const MAIN_NAV_LINKS = [
  { name: "Tusoskop Nedir?", path: "/tusoskop-nedir" },
  { name: "Özellikler", path: "/tusoskop-ozellikleri" },
  { name: "TUS Puan Hesaplama", path: "/tus-puan-hesaplama" },
  { name: "TUS Kontenjan Tablosu", path: "/tus-kontenjan-tablosu" },
  { name: "Fiyatlandırma", path: "/fiyatlandirma" },
  { name: "Hakkımızda", path: "/hakkimizda" },
  { name: "Sık Sorulan Sorular", path: "/tusoskop-sss" },
];

export function buildSiteNavigationNodes() {
  return MAIN_NAV_LINKS.map((link, index) => ({
    "@type": "SiteNavigationElement",
    position: index + 1,
    name: link.name,
    url: pageUrl(link.path),
  }));
}

export const homeSeo = {
  path: "/",
  title: `TUS Soru Bankası — ${QUESTION_COUNT_LABEL} Soru, Deneme ve Analiz | Tusoskop`,
  description:
    `Tusoskop'ta ${QUESTION_COUNT_LABEL} yüksek kaliteli TUS tarzı soruyu ${LESSON_COUNT} dersten ve istediğin konudan seçerek çöz. Deneme, yanlış takibi, akıllı tekrar (FSRS), AI çalışma planı, haftalık lig ve performans analizi tek platformda.`,
  h1: "TUS Hazırlığı İçin Soru Çözme, Deneme ve Analiz Platformu",
  answer:
    `Tusoskop; TUS'a hazırlanan tıp öğrencileri ve hekimler için ${QUESTION_COUNT_LABEL} yüksek kaliteli TUS tarzı soruyu ${LESSON_COUNT} dersten ve istediğin konudan seçerek çözmeni sağlar. Konu bazlı test, deneme çözümü, yanlış/favori takibi, bilimsel aralıklı tekrar (FSRS), AI destekli çalışma planı, haftalık lig ve performans analizini tek bir web ve mobil platformda sunar.`,
};

export const commonFaq = [
  {
    question: "Tusoskop nedir?",
    answer:
      "Tusoskop, TUS'a hazırlanan tıp öğrencileri ve hekimler için geliştirilmiş dijital soru çözme ve analiz platformudur.",
  },
  {
    question: "Tusoskop'ta kaç soru var?",
    answer:
      `Tusoskop'ta ${QUESTION_COUNT_LABEL} yüksek kaliteli TUS tarzı soru bulunur. Soruları ${LESSON_COUNT} dersten ve istediğin konudan seçerek çözebilirsin.`,
  },
  {
    question: "Tusoskop'ta konu bazlı soru çözülür mü?",
    answer:
      "Evet. Tusoskop'ta ders ve konu seçerek TUS hazırlığına yönelik testler çözülebilir.",
  },
  {
    question: "Tusoskop ücretsiz soru çözdürüyor mu?",
    answer:
      `Evet. Free planda her gün ${FREE_DAILY_QUESTIONS} soru ve ${FREE_DAILY_TOPIC_TESTS} konu testi ücretsiz çözülebilir. Plus erişimde günlük soru ve konu testi limiti kalkar.`,
  },
  {
    question: "Tusoskop yanlışları nasıl tekrar ettiriyor?",
    answer:
      "Tusoskop, bilimsel aralıklı tekrar (FSRS tabanlı akıllı tekrar) yaklaşımıyla yanlış yaptığın soruları tam unutmaya başladığın aralıklarda yeniden karşına çıkarır.",
  },
  {
    question: "Tusoskop'ta deneme çözülür mü?",
    answer:
      "Evet. Tusoskop, TUS hazırlık sürecinde deneme çözme ve sonuçları takip etme özellikleri sunar.",
  },
  {
    question: "Tusoskop analiz sunuyor mu?",
    answer:
      "Evet. Tusoskop soru çözüm ve deneme performansını takip etmeye yardımcı olan analiz özellikleri sunar.",
  },
  {
    question: "Tusoskop video ders platformu mu?",
    answer:
      "Tusoskop'un ana odağı video ders değildir. Platform soru çözme, tekrar, deneme ve performans analizi sürecini desteklemek için geliştirilmiştir.",
  },
];

const contentSeoPages = [
  {
    slug: "tusoskop-nedir",
    title: "Tusoskop Nedir? TUS İçin Dijital Soru Platformu",
    description:
      "Tusoskop, TUS'a hazırlananlar için konu bazlı test, deneme, yanlış/favori takibi, AI plan ve analiz sunan dijital platformdur.",
    h1: "Tusoskop Nedir?",
    intro:
      "Tusoskop, TUS'a hazırlanan tıp öğrencileri ve hekimler için geliştirilen dijital soru çözme, deneme ve analiz platformudur. Kullanıcılar konu çalıştıktan sonra ders ve konu bazlı test çözebilir, deneme performansını inceleyebilir, yanlış ve favori sorularını takip edebilir.",
    sections: [
      {
        heading: "Tusoskop kimler için uygundur?",
        paragraphs: [
          "Tusoskop; TUS'a hazırlanan, konu çalıştıktan sonra soru pratiği yapmak isteyen, deneme sonuçlarını düzenli görmek isteyen ve yanlışlarını tekrar ederek ilerlemek isteyen tıp öğrencileri ve hekimler için uygundur.",
        ],
      },
      {
        heading: "Tusoskop ile neler yapılabilir?",
        paragraphs: [
          "Platformda konu bazlı test çözme, dijital deneme çözme, yanlış ve favori soru takibi, performans analizi, AI destekli çalışma planı ve haftalık lig sistemi bulunur.",
        ],
      },
      {
        heading: "Tusoskop video ders platformu mu?",
        paragraphs: [
          "Tusoskop'un ana odağı video ders değildir. Ürün, TUS hazırlığında soru çözme, tekrar, deneme ve analiz sürecini daha düzenli hale getirmeye odaklanır.",
        ],
      },
      {
        heading: "TUS çalışırken Tusoskop nasıl kullanılır?",
        paragraphs: [
          "Bir konuyu çalıştıktan sonra ilgili ders ve konu üzerinden test çözebilir, deneme setleriyle genel performansını ölçebilir ve yanlışlarını tekrar listesine alarak çalışma planını netleştirebilirsin.",
        ],
      },
    ],
    links: [
      ["Tusoskop özellikleri", "/tusoskop-ozellikleri"],
      ["Tusoskop fiyatlandırma", "/fiyatlandirma"],
      ["Ana sayfa", "/"],
    ],
  },
  {
    slug: "tus-hazirlik-platformu",
    title: "TUS Hazırlık Platformu | Soru, Deneme ve Analiz",
    description:
      "TUS hazırlığında konu çalıştıktan sonra soru çözmek, deneme yapmak ve performansını analiz etmek için Tusoskop'u incele.",
    h1: "TUS Hazırlık Platformu",
    intro:
      "TUS hazırlığında konu çalıştıktan sonra soru çözmek, deneme yapmak ve analizlerini takip etmek isteyenler için Tusoskop; web ve mobil odaklı bir dijital çalışma platformudur.",
    sections: [
      {
        heading: "TUS hazırlık platformu seçerken nelere bakılmalı?",
        paragraphs: [
          "Bir TUS hazırlık platformu, soru çözme akışını kolaylaştırmalı, deneme sonuçlarını takip etmeli ve kullanıcının eksiklerini daha görünür hale getirmelidir.",
        ],
      },
      {
        heading: "Konu çalıştıktan sonra soru çözmenin önemi",
        paragraphs: [
          "Konu anlatımından sonra yapılan soru pratiği, bilgiyi sınav formatında kullanmayı kolaylaştırır. Tusoskop bu pratiği ders ve konu bazında düzenlemeye yardımcı olur.",
        ],
      },
      {
        heading: "Deneme çözme ve analiz takibi",
        paragraphs: [
          "Denemeler, genel durumun ve zaman içindeki gelişimin görülmesini sağlar. Tusoskop deneme sonrası analiz ekranlarıyla güçlü ve zayıf alanları takip etmeye destek olur.",
        ],
      },
      {
        heading: "Tusoskop bu süreçte ne sunar?",
        paragraphs: [
          "Tusoskop; konu bazlı soru çözme, deneme, yanlış takibi, favori sorular, AI çalışma planı, haftalık lig sistemi ve performans analizi sunar.",
        ],
      },
    ],
    links: [
      ["TUS soru çözme uygulaması", "/tus-soru-cozme-uygulamasi"],
      ["TUS deneme analizi", "/tus-deneme-analizi"],
    ],
  },
  {
    slug: "tus-soru-cozme-uygulamasi",
    title: "TUS Soru Çözme Uygulaması | Yanlış Takibi",
    description:
      "Tusoskop ile TUS'a yönelik konu bazlı sorular çözebilir, yanlışlarını ve favorilerini takip edip performansını analiz edebilirsin.",
    h1: "TUS Soru Çözme Uygulaması",
    intro:
      "Tusoskop, TUS hazırlığında ders ve konu bazlı test çözmek isteyen kullanıcılar için sade ve mobil odaklı bir soru çözme uygulamasıdır.",
    sections: [
      {
        heading: "TUS soru çözme uygulaması nedir?",
        paragraphs: [
          "TUS soru çözme uygulaması, kullanıcıların sınav hazırlığında konu bazlı testleri dijital ortamda çözmesini, sonuçlarını takip etmesini ve tekrar yapmasını kolaylaştırır.",
        ],
      },
      {
        heading: "Konu bazlı test çözme",
        paragraphs: [
          "Tusoskop'ta ders ve konu seçerek çalıştığın alandan soru pratiği yapabilir, konuyu öğrendikten sonra ölçme adımını hızlandırabilirsin.",
        ],
      },
      {
        heading: "Yanlış ve favori soru takibi",
        paragraphs: [
          "Yanlış yaptığın veya daha sonra dönmek istediğin soruları takip etmek, tekrar sürecini daha düzenli hale getirir.",
        ],
      },
      {
        heading: "Mobilde soru çözme deneyimi",
        paragraphs: [
          "Tusoskop hem web üzerinden hem de iOS cihazlarda App Store üzerinden kullanılabilir. Kısa boşluklarda soru çözmek isteyen kullanıcılar için mobil odaklı bir deneyim sunar.",
        ],
      },
    ],
    links: [
      ["Konu bazlı TUS soru çözme", "/tus-konu-bazli-soru-cozme"],
      ["Yanlış ve favori soru takibi", "/tus-yanlis-takibi"],
    ],
  },
  {
    slug: "tus-deneme-cozme-platformu",
    title: "TUS Deneme Çözme Platformu | Sonuç Takibi",
    description:
      "Tusoskop, TUS hazırlığında dijital deneme çözme, sonuç takip etme ve performans analizi yapma imkanı sunar.",
    h1: "TUS Deneme Çözme Platformu",
    intro:
      "Tusoskop, TUS hazırlığında dijital deneme çözmek ve deneme sonrası sonuçlarını takip etmek isteyen kullanıcılar için geliştirilmiş bir çalışma platformudur.",
    sections: [
      {
        heading: "TUS deneme çözme neden önemlidir?",
        paragraphs: [
          "Deneme çözmek, sınav temposuna alışmayı ve bilgiyi geniş kapsamlı sorularla sınamayı sağlar.",
        ],
      },
      {
        heading: "Dijital deneme çözmenin avantajları",
        paragraphs: [
          "Dijital denemeler sonuçların daha hızlı görülmesini, geçmiş performansın izlenmesini ve eksik alanların daha kolay fark edilmesini sağlar.",
        ],
      },
      {
        heading: "Deneme sonrası analiz neden gerekli?",
        paragraphs: [
          "Sadece neti görmek çoğu zaman yeterli değildir. Ders ve konu bazında eksikleri görmek, sonraki çalışma adımını daha doğru seçmeye yardımcı olur.",
        ],
      },
      {
        heading: "Tusoskop ile deneme çözme",
        paragraphs: [
          "Tusoskop, deneme çözümü ve sonuç takibini aynı akışta sunar. Kullanıcılar deneme sonrasında analiz ekranları üzerinden performansını inceleyebilir.",
        ],
      },
    ],
    links: [["TUS deneme analizi", "/tus-deneme-analizi"]],
  },
  {
    slug: "tus-deneme-analizi",
    title: "TUS Deneme Analizi | Eksiklerini Takip Et",
    description:
      "TUS denemelerinden sonra performansını analiz et, eksik ders ve konularını gör, çalışma sürecini Tusoskop ile takip et.",
    h1: "TUS Deneme Analizi",
    intro:
      "Tusoskop, TUS denemelerinden sonra kullanıcıların performansını daha düzenli takip etmesine ve eksik alanlarını görmesine yardımcı olur.",
    sections: [
      {
        heading: "TUS deneme analizi nedir?",
        paragraphs: [
          "Deneme analizi, çözülen denemenin sonuçlarını yalnızca doğru ve yanlış sayısı olarak değil, gelişim ve eksik alanlar açısından değerlendirmektir.",
        ],
      },
      {
        heading: "Deneme sonrası hangi veriler takip edilmeli?",
        paragraphs: [
          "Ders bazlı başarı, yanlış oranı, boş bırakılan sorular, net değişimi ve tekrar gerektiren konular takip edilebilir.",
        ],
      },
      {
        heading: "Ders ve konu bazlı eksik analizi",
        paragraphs: [
          "Tusoskop, deneme ve soru çözüm verilerini daha anlaşılır hale getirerek kullanıcının zayıf alanlarını görmesine destek olur.",
        ],
      },
      {
        heading: "Yanlış oranı ve gelişim takibi",
        paragraphs: [
          "Yanlışların düzenli takibi, tekrar planını daha somut hale getirir. AI destekli çalışma planı da bu sürecin planlanmasına yardımcı olur.",
        ],
      },
    ],
    links: [
      ["TUS deneme çözme platformu", "/tus-deneme-cozme-platformu"],
      ["TUS çalışma takip sistemi", "/tus-calisma-takip-sistemi"],
      ["TUS puan hesaplama", "/tus-puan-hesaplama"],
    ],
  },
  {
    slug: "tus-puan-hesaplama",
    tool: "score",
    title: "TUS Puan Hesaplama — Net ve Tahmini TUS Puanı | Tusoskop",
    description:
      "TUS puan hesaplama aracı: Temel ve Klinik Tıp net sayını gir, tahmini T Puanı ve K Puanını anında gör. Net nasıl hesaplanır, yanlış doğruyu götürür mü? Ücretsiz.",
    h1: "TUS Puan Hesaplama",
    intro:
      "Temel Tıp ve Klinik Tıp bölümlerindeki doğru ve yanlış sayılarını gir; netlerini ve tahmini T Puanı ile K Puanını anında hesapla. Hesaplama net üzerinden yapılır (doğru − yanlış/4) ve sonuç tahminidir; gerçek TUS puanı ÖSYM'nin ilgili dönemdeki standardizasyonuna göre belirlenir.",
    sections: [
      {
        heading: "TUS puanı nasıl hesaplanır?",
        paragraphs: [
          "TUS'ta Temel Tıp Bilimleri (100 soru) ve Klinik Tıp Bilimleri (100 soru) için ayrı netler hesaplanır. Net = doğru sayısı − (yanlış sayısı / 4) formülüyle bulunur.",
          "ÖSYM bu netleri ayrı ayrı standart puana çevirir; TUS'ta tek bir puan değil, iki farklı ağırlıklı puan üretilir: T Puanı (Temel ağırlıklı) ve K Puanı (Klinik ağırlıklı). Temel bilim dallarına T Puanı, diğer tüm klinik dallara K Puanı ile yerleşilir. Yukarıdaki araç, girdiğin netlere karşılık gelen her iki tahmini puanı da gösterir.",
        ],
      },
      {
        heading: "Net nedir? Yanlış doğruyu götürür mü?",
        paragraphs: [
          "Evet, TUS'ta her 4 yanlış 1 doğruyu götürür. Net, doğru sayısından yanlışların dörtte birinin çıkarılmasıyla bulunur; boş bırakılan sorular neti etkilemez.",
          "Örneğin 100 doğru ve 20 yanlış yapan bir aday için net = 100 − (20 / 4) = 95 olur.",
        ],
      },
      {
        heading: "Temel Tıp ve Klinik Tıp Bilimleri",
        paragraphs: [
          "Temel Tıp Bilimleri anatomi, fizyoloji, biyokimya, mikrobiyoloji, patoloji ve farmakoloji gibi alanları; Klinik Tıp Bilimleri ise dahiliye, pediatri, genel cerrahi, kadın hastalıkları ve doğum ile küçük stajları kapsar.",
          "Sadece 7 temel bilim dalı T Puanı ile, geri kalan tüm klinik dallar K Puanı ile değerlendirilir; bu yüzden hesaplayıcıda her iki bölümü de girmen ve hangi puan türünün seni ilgilendirdiğini bilmen önerilir.",
        ],
      },
      {
        heading: "Tahmini puan ile gerçek TUS puanı farkı",
        paragraphs: [
          "Buradaki sonuç tahminidir. Gerçek TUS puanı; sınava giren adayların o dönemdeki ortalaması ve standart sapmasına göre standardize edildiği için dönemden döneme değişir.",
          "Aracı net hedefi belirlemek, denemelerdeki gelişimini kabaca yorumlamak ve hangi puan aralığında olduğunu görmek için kullan; kesin yerleştirme puanı için ÖSYM sonuç belgeni esas al.",
        ],
      },
    ],
    faq: [
      {
        question: "TUS'ta yanlış doğruyu götürür mü?",
        answer:
          "Evet. Her 4 yanlış 1 doğruyu götürür. Net, doğru − yanlış/4 ile hesaplanır; boşlar neti etkilemez.",
      },
      {
        question: "TUS puanı nasıl hesaplanır?",
        answer:
          "Temel Tıp ve Klinik Tıp için ayrı netler hesaplanır (net = doğru − yanlış/4), ÖSYM bu netleri ayrı ayrı standardize edip iki farklı ağırlıkla birleştirir: T Puanı (%60 Temel + %40 Klinik) ve K Puanı (%40 Temel + %60 Klinik). Tek bir 'TUS puanı' yoktur.",
      },
      {
        question: "T Puanı ile K Puanı arasındaki fark nedir?",
        answer:
          "T Puanı Temel ağırlıklı hesaplanır ve yalnızca 7 temel bilim dalına (Anatomi, Fizyoloji, Biyokimya, Mikrobiyoloji, Patoloji, Farmakoloji, Histoloji-Embriyoloji) yerleşmek için kullanılır. K Puanı Klinik ağırlıklıdır ve diğer tüm klinik dallarda (Dahiliye, Cerrahi, Pediatri, Kadın Doğum vb.) geçerlidir.",
      },
      {
        question: "Bu hesaplama kesin mi?",
        answer:
          "Hayır, tahminidir. Gerçek TUS puanı ÖSYM'nin dönem ortalaması ve standart sapmasına göre standardize edilir; bu araç geçmiş eğilimlere dayalı yaklaşık bir değer verir.",
      },
      {
        question: "TUS'ta %5 puan kesintisi nedir?",
        answer:
          "Daha önce TUS ile bir uzmanlık/yan dal eğitimine yerleşip bu eğitimine devam etmemiş adaylara ÖSYM tarafından %5 puan kesintisi uygulanır. Hesaplayıcıdaki anahtarı açarak bu kesintiyi tahmini puanına yansıtabilirsin.",
      },
      {
        question: "Hedef puana kaç net gerekir?",
        answer:
          "Hesaplayıcıdaki 'Hedef puana kaç net gerekir?' bölümünden puan türünü (T veya K) ve hedef puanı gir; araç bir bölümdeki mevcut netini sabit tutup diğer bölümde yaklaşık kaç net gerektiğini hesaplar.",
      },
    ],
    links: [
      ["TUS deneme analizi", "/tus-deneme-analizi"],
      ["TUS soru çözme uygulaması", "/tus-soru-cozme-uygulamasi"],
      ["TUS kontenjan tablosu", "/tus-kontenjan-tablosu"],
    ],
  },
  {
    slug: "tus-kontenjan-tablosu",
    tool: "kontenjan",
    kontenjanData: KONTENJAN_DATA,
    kontenjanDonem: KONTENJAN_DONEM_LABEL,
    title: `TUS Kontenjan Tablosu ${KONTENJAN_DONEM_LABEL} — Taban Puanlar | Tusoskop`,
    description:
      `${KONTENJAN_DONEM_LABEL} TUS kontenjan tablosu: ${KONTENJAN_DAL_COUNT} uzmanlık dalı için kontenjan, taban puan ve yerleşen sayısı. Dala göre ara, kontenjana veya taban puana göre sırala.`,
    h1: `TUS Kontenjan Tablosu — ${KONTENJAN_DONEM_LABEL}`,
    intro:
      `${KONTENJAN_DONEM_LABEL} yerleştirme sonuçlarına göre ${KONTENJAN_DAL_COUNT} uzmanlık dalının kontenjan, taban puan ve yerleşen aday sayısını aşağıda bulabilirsin. Dal adına göre arayabilir, kontenjan veya taban puana göre sıralayabilirsin.`,
    stats: [
      { value: `${KONTENJAN_DAL_COUNT}`, label: "Uzmanlık dalı" },
      { value: `${KONTENJAN_TOPLAM.toLocaleString("tr-TR")}`, label: "Toplam kontenjan" },
      { value: KONTENJAN_DONEM_LABEL.replace(" (Mart 2026)", ""), label: "Dönem" },
    ],
    sections: [
      {
        heading: "TUS kontenjanı ve taban puan nedir?",
        paragraphs: [
          "Her uzmanlık dalı için ÖSYM tarafından belirlenen kadro sayısına kontenjan denir. Taban puan ise o dönemde ilgili dalda dolan kontenjanlar içindeki en düşük tahmini puanı ifade eder — 7 temel bilim dalında T Puanı, diğer tüm dallarda K Puanı geçerlidir (tabloda 'Puan Türü' sütunuyla belirtilir).",
          "Taban puanlar dönemden döneme değişir; tercih eden aday sayısı, kontenjan sayısı ve genel puan dağılımına göre yükselip alçalabilir.",
        ],
      },
      {
        heading: "Kontenjan tablosu nasıl okunmalı?",
        paragraphs: [
          "Bir dalın taban puanı, o dönemde o dala yerleşebilmek için gereken asgari puanı gösterir. Kontenjanı yüksek fakat taban puanı düşük dallarda yerleşme ihtimali görece daha yüksektir.",
          "'Yerleşen' sütunu, kontenjanın ne kadarının dolduğunu gösterir; kontenjanın tamamı dolmamışsa taban puan oluşmamış olabilir (tabloda '—' ile gösterilir).",
        ],
      },
      {
        heading: "Taban puanlar dönemden döneme neden değişir?",
        paragraphs: [
          "Adayların o dönemki genel başarı düzeyi, tercih eden aday sayısı ve kontenjan artış/azalışları taban puanı doğrudan etkiler. Bu yüzden geçmiş dönem taban puanı, gelecek dönem için kesin bir garanti değil, yalnızca bir gösterge olarak kullanılmalıdır.",
        ],
      },
      {
        heading: "Tahmini T Puanı / K Puanınla kıyaslama",
        paragraphs: [
          "TUS Puan Hesaplama aracından tahmini T Puanı ve K Puanını hesapladıktan sonra bu tablodaki taban puanlarla karşılaştırarak hangi dallarda rekabetçi olabileceğin konusunda kaba bir fikir edinebilirsin — her dalı kendi puan türüyle (T veya K) kıyaslamayı unutma.",
        ],
      },
    ],
    faq: [
      {
        question: "TUS kontenjan tablosu ne sıklıkla güncellenir?",
        answer:
          "Her TUS döneminin (yılda iki kez) yerleştirme sonuçları açıklandıkça tablo güncellenir. Şu an gösterilen veri " + KONTENJAN_DONEM_LABEL + " dönemine aittir.",
      },
      {
        question: "Taban puan neden bazı dallarda gösterilmiyor?",
        answer:
          "Kontenjanın tamamı dolmadıysa o dalda taban puan oluşmaz; tabloda bu durum '—' ile belirtilir.",
      },
      {
        question: "Kontenjan tablosu ile puan hesaplama aracı birlikte nasıl kullanılır?",
        answer:
          "Önce TUS Puan Hesaplama aracıyla tahmini T Puanı ve K Puanını bul, ardından bu tablodaki taban puanlarla (her dalın kendi puan türüyle) karşılaştırarak hangi dallarda daha rekabetçi olabileceğini kabaca değerlendir.",
      },
      {
        question: "Bu veriler resmi mi?",
        answer:
          `${KONTENJAN_DONEM_LABEL} yerleştirme sonuçlarına dayanır. Kesin ve güncel bilgi için ÖSYM'nin resmi yerleştirme sonuçları sayfasını esas al.`,
      },
    ],
    links: [
      ["TUS puan hesaplama", "/tus-puan-hesaplama"],
      ["TUS deneme analizi", "/tus-deneme-analizi"],
    ],
  },
  {
    slug: "tus-yanlis-takibi",
    title: "TUS Yanlış Takibi | Sorularını Tekrar Et",
    description:
      "Tusoskop ile TUS hazırlığında yanlış yaptığın soruları takip edebilir, tekrar edebilir ve eksiklerini daha net görebilirsin.",
    h1: "TUS Yanlış Takibi",
    intro:
      "Tusoskop, TUS hazırlığında yanlış yapılan soruları ve favoriye alınan soruları düzenli takip etmeye yardımcı olan bir tekrar akışı sunar.",
    sections: [
      {
        heading: "TUS'ta yanlış takibi neden önemlidir?",
        paragraphs: [
          "Yanlış yapılan sorular, eksik konuları ve dikkat edilmesi gereken soru tiplerini gösterir. Bu nedenle tekrar sürecinde ayrı takip edilmelidir.",
        ],
      },
      {
        heading: "Yanlış sorular nasıl tekrar edilmeli?",
        paragraphs: [
          "Yanlışlar belirli aralıklarla yeniden çözülmeli, benzer konu ve soru tipleriyle desteklenmelidir.",
        ],
      },
      {
        heading: "Favori sorular nasıl kullanılmalı?",
        paragraphs: [
          "Favori sorular, özellikle tekrar etmek istenen veya önemli görülen soruları hızlıca ayırmak için kullanılabilir.",
        ],
      },
      {
        heading: "Tusoskop ile yanlış ve favori takibi",
        paragraphs: [
          "Tusoskop, kullanıcıların yanlış ve favori sorularına geri dönmesini kolaylaştırarak tekrar sürecini daha düzenli hale getirir.",
        ],
      },
    ],
    links: [
      ["Konu bazlı TUS soru çözme", "/tus-konu-bazli-soru-cozme"],
      ["Tusoskop özellikleri", "/tusoskop-ozellikleri"],
    ],
  },
  {
    slug: "tus-konu-bazli-soru-cozme",
    title: "TUS Konu Bazlı Soru Çözme | Test Çöz",
    description:
      "Tusoskop ile TUS dersleri ve konularına göre test çözebilir, çalıştığın konudan hemen sonra soru pratiği yapabilirsin.",
    h1: "TUS Konu Bazlı Soru Çözme",
    intro:
      "Tusoskop, TUS hazırlığında ders ve konu seçerek test çözmek isteyen kullanıcılar için konu bazlı soru çözme akışı sunar.",
    sections: [
      {
        heading: "Konu bazlı soru çözme nedir?",
        paragraphs: [
          "Konu bazlı soru çözme, çalışılan ders veya konudan sonra doğrudan o alana yönelik test çözerek öğrenmeyi sınama yöntemidir.",
        ],
      },
      {
        heading: "TUS hazırlığında konu sonrası soru çözmenin faydası",
        paragraphs: [
          "Konu çalışmasından hemen sonra soru çözmek, bilginin sınav formatında kullanılmasını ve eksik noktaların erken fark edilmesini sağlar.",
        ],
      },
      {
        heading: "Ders ve konu seçerek test çözme",
        paragraphs: [
          "Tusoskop'ta kullanıcılar ders ve konu seçerek ilgili soru pratiğine geçebilir.",
        ],
      },
      {
        heading: "Eksik konuları belirleme",
        paragraphs: [
          "Yanlışlar, favoriler ve analiz ekranları eksik konuların daha görünür olmasına yardımcı olur.",
        ],
      },
    ],
    links: [
      ["TUS soru çözme uygulaması", "/tus-soru-cozme-uygulamasi"],
      ["TUS yanlış takibi", "/tus-yanlis-takibi"],
    ],
  },
  {
    slug: "tus-mobil-uygulama",
    title: "TUS Mobil Uygulama | Soru, Deneme, Analiz",
    description:
      "Tusoskop mobil odaklı yapısıyla telefondan soru çözme, deneme yapma, AI plan ve performans analizi takip etme imkanı sunar.",
    h1: "TUS Mobil Uygulama",
    intro:
      "Tusoskop hem web üzerinden hem de iOS cihazlarda kullanılabilen, TUS hazırlığında soru çözme ve deneme takibini mobilde kolaylaştıran bir platformdur.",
    sections: [
      {
        heading: "TUS hazırlığında mobil uygulama kullanmanın avantajları",
        paragraphs: [
          "Mobil kullanım, nöbet aralarında, yolculukta veya kısa boşluklarda soru çözmeyi kolaylaştırır.",
        ],
      },
      {
        heading: "Nöbet aralarında ve kısa boşluklarda soru çözme",
        paragraphs: [
          "Tusoskop'un mobil odaklı tasarımı, kısa sürelerde test çözme ve tekrar yapma alışkanlığını destekler.",
        ],
      },
      {
        heading: "Mobilde deneme ve analiz takibi",
        paragraphs: [
          "Kullanıcılar deneme ve analiz ekranlarını mobil cihazdan takip edebilir.",
        ],
      },
      {
        heading: "App Store bağlantısı",
        paragraphs: [
          "Tusoskop'u iOS cihazında App Store üzerinden indirebilir, web üzerinden de kullanabilirsin.",
        ],
      },
    ],
    links: [["App Store'da Tusoskop", APP_STORE_URL]],
  },
  {
    slug: "tus-calisma-takip-sistemi",
    title: "TUS Çalışma Takip Sistemi | Analiz",
    description:
      "Tusoskop, çözdüğün soruları, denemeleri, yanlışlarını, AI planını ve gelişimini takip etmene yardımcı olur.",
    h1: "TUS Çalışma Takip Sistemi",
    intro:
      "Tusoskop, TUS hazırlığında çözülen soruları, deneme performansını, yanlışları, favorileri, AI çalışma planını ve haftalık lig ilerlemesini takip etmeye yardımcı olur.",
    sections: [
      {
        heading: "TUS çalışma takibi neden önemlidir?",
        paragraphs: [
          "Düzenli takip, hangi alanlarda ilerleme olduğunu ve hangi konuların tekrar istediğini daha net gösterir.",
        ],
      },
      {
        heading: "Hangi veriler takip edilmeli?",
        paragraphs: [
          "Soru çözüm sayısı, deneme performansı, yanlış ve favori sorular, konu bazlı eksikler ve çalışma sürekliliği takip edilebilir.",
        ],
      },
      {
        heading: "AI çalışma planı ve haftalık lig",
        paragraphs: [
          "Tusoskop'ta AI entegrasyonu ile çalışma planı oluşturma ve haftalık lig sistemi gibi motivasyonu destekleyen ek özellikler bulunur.",
        ],
      },
      {
        heading: "Tusoskop ile dijital çalışma takibi",
        paragraphs: [
          "Platformun amacı, soru çözme ve deneme verilerini daha okunabilir hale getirerek çalışma sürecini düzenlemeye yardımcı olmaktır.",
        ],
      },
    ],
    links: [
      ["TUS deneme analizi", "/tus-deneme-analizi"],
      ["Yanlış ve favori soru takibi", "/tus-yanlis-takibi"],
      ["Tusoskop özellikleri", "/tusoskop-ozellikleri"],
    ],
  },
  {
    slug: "tusoskop-ozellikleri",
    title: "Tusoskop Özellikleri | Soru, Deneme, Analiz",
    description:
      "Tusoskop'un konu bazlı test, deneme, yanlış/favori takibi, AI çalışma planı, haftalık lig ve analiz özelliklerini incele.",
    h1: "Tusoskop Özellikleri",
    intro:
      "Tusoskop'un temel odağı TUS hazırlığında soru çözme, deneme, tekrar ve analiz sürecini kolaylaştırmaktır. Platformda ayrıca AI destekli çalışma planı ve haftalık lig sistemi bulunur.",
    sections: [
      {
        heading: "Konu bazlı testler",
        paragraphs: [
          "Ders ve konu seçerek TUS hazırlığına yönelik testler çözebilirsin.",
        ],
      },
      {
        heading: "Deneme çözme",
        paragraphs: [
          "Dijital deneme setleriyle genel performansını ölçebilir, sonuçlarını daha düzenli takip edebilirsin.",
        ],
      },
      {
        heading: "Yanlış, favori ve tekrar",
        paragraphs: [
          "Yanlış yaptığın veya favoriye aldığın sorulara dönerek tekrar sürecini destekleyebilirsin.",
        ],
      },
      {
        heading: "Performans analizi, AI plan ve haftalık lig",
        paragraphs: [
          "Analiz ekranları gelişimini görmeye yardımcı olur. AI çalışma planı ve haftalık lig sistemi ise çalışma düzenini ve motivasyonu destekleyen ek özelliklerdir.",
        ],
      },
    ],
    links: [
      ["TUS çalışma takip sistemi", "/tus-calisma-takip-sistemi"],
      ["Tusoskop fiyatlandırma", "/fiyatlandirma"],
    ],
  },
  {
    slug: "fiyatlandirma",
    title: "Tusoskop Fiyatlandırma | TUS Soru Platformu",
    description:
      "Tusoskop fiyatlandırma seçeneklerini, ücretsiz kullanım imkanlarını ve TUS hazırlığı için sunulan dijital özellikleri incele.",
    h1: "Tusoskop Fiyatlandırma",
    intro:
      "Tusoskop ücretsiz kullanılabilir; günlük soru hakkın dolduğunda ise Plus'a geçebilirsin. Plus paketleri 89,90₺'den başlar. Sınav dönemi için Eylül Paketi (3 aylık, sınava kadar sınırsız) 209,70₺'dir — TUS dershanelerinin ~120.000₺'ye ulaşan paketlerinin yanında hazırlık bütçesinde büyük fark yaratır.",
    sections: [
      {
        heading: "Tusoskop ücretli mi?",
        paragraphs: [
          "Tusoskop'ta ücretsiz kullanım limitleri ve Plus özellikler bulunur. Ücretsiz katmanda günde belirli sayıda soru çözebilir, Plus ile bu sınırları kaldırabilirsin.",
        ],
      },
      {
        heading: "Ücretsiz kullanım var mı?",
        paragraphs: [
          "Evet. Uygulamada ücretsiz kullanım hakkı bulunur; günlük soru ve deneme limitleri uygulama içindeki güncel kurallara göre uygulanır. Önce ücretsiz deneyip sonra Plus'a geçebilirsin.",
        ],
      },
      {
        heading: "Premium (Plus) özellikler neler?",
        paragraphs: [
          "Plus erişim; sınırsız soru çözme, sınırsız deneme, sınırsız tekrar kuyruğu, tam favori/yanlış geçmişi ve gelişmiş deneme net grafiği sunar. Akıllı tekrar (FSRS) ve haftalık Türkiye ligi tüm kullanıcılara açıktır.",
        ],
      },
      {
        heading: "Eylül Paketi nedir?",
        paragraphs: [
          "Eylül Paketi, 3 aylık Plus planının sınav dönemi çerçevesidir: 209,70₺ karşılığında sınava kadar (90 gün) sınırsız erişim — günde yaklaşık 2,3₺. Fiyat, standart 3 aylık planla aynıdır. Ödeme PayTR ile güvenli şekilde alınır ve onaylandığı anda hesabına tanımlanır.",
        ],
      },
    ],
    links: [
      ["Tusoskop özellikleri", "/tusoskop-ozellikleri"],
      ["Kullanım koşulları", "/kullanim-kosullari"],
    ],
  },
  {
    slug: "hakkimizda",
    title: "Hakkımızda | Tusoskop TUS Hazırlık Platformu",
    description:
      "Tusoskop; TUS'a hazırlanan tıp öğrencileri ve hekimler için soru çözme, deneme, akıllı tekrar ve analiz sürecini bir araya getiren dijital çalışma platformudur.",
    h1: "Hakkımızda",
    intro:
      "Tusoskop, TUS'a hazırlanan tıp öğrencileri ve hekimlerin soru çözme, deneme, tekrar ve analiz sürecini tek bir yerde toplamak için geliştirilmiş dijital bir çalışma platformudur. Amacımız; dağınık çalışma materyalleri yerine, çalıştığın konuyu hemen sınayabileceğin, yanlışlarını unutmadan tekrar edebileceğin ve gelişimini rakamlarla görebileceğin sade bir deneyim sunmaktır.",
    sections: [
      {
        heading: "Neden Tusoskop?",
        paragraphs: [
          "TUS hazırlığında en çok kaybedilen şey zaman ve odak. Tusoskop, konu çalışmasından sonra doğru soruyu doğru anda karşına çıkararak çalışmanı verimli hale getirmeye odaklanır.",
          "Platformun ana odağı video ders değildir; soru çözme, deneme, bilimsel aralıklı tekrar (FSRS), AI destekli çalışma planı ve performans analizidir.",
        ],
      },
      {
        heading: "Yaklaşımımız",
        paragraphs: [
          "Soru bankamızdaki içerikler TUS formatına uygun şekilde hazırlanır. Pazarlama dilinde abartıdan kaçınır, gerçek soru sayısını ve özellikleri olduğu gibi paylaşırız.",
          "Akıllı tekrar sistemi, yanlış yaptığın soruları tam unutmaya başladığın aralıklarda yeniden karşına çıkararak kalıcı öğrenmeyi destekler.",
        ],
      },
      {
        heading: "İletişim",
        paragraphs: [
          "Soru, geri bildirim ve iş birliği talepleri için tusoskop.destek@gmail.com adresinden bize ulaşabilirsin.",
        ],
      },
    ],
    links: [
      ["Tusoskop nedir?", "/tusoskop-nedir"],
      ["Tusoskop özellikleri", "/tusoskop-ozellikleri"],
      ["Fiyatlandırma", "/fiyatlandirma"],
    ],
  },
  {
    slug: "tusoskop-sss",
    title: "Tusoskop SSS | TUS Soru, Deneme, Analiz",
    description:
      "Tusoskop hakkında sık sorulan sorular: konu bazlı soru, deneme, analiz, yanlış takibi, AI plan, mobil kullanım ve abonelik.",
    h1: "Tusoskop Sık Sorulan Sorular",
    intro:
      "Tusoskop hakkında en çok sorulan konular; konu bazlı soru çözme, deneme, analiz, yanlış takibi, AI çalışma planı, haftalık lig, mobil kullanım ve fiyatlandırmadır.",
    sections: [
      {
        heading: "Tusoskop kimler için uygundur?",
        paragraphs: [
          "TUS'a hazırlanan tıp öğrencileri ve hekimler için uygundur. Özellikle konu çalıştıktan sonra soru pratiği yapmak ve deneme sonuçlarını takip etmek isteyen kullanıcılar için tasarlanmıştır.",
        ],
      },
      {
        heading: "Tusoskop mobilde kullanılabilir mi?",
        paragraphs: [
          "Evet. Tusoskop web üzerinden kullanılabilir ve iOS kullanıcıları için App Store bağlantısı bulunur.",
        ],
      },
      {
        heading: "Tusoskop'ta AI çalışma planı var mı?",
        paragraphs: [
          "Evet. Tusoskop'ta AI entegrasyonu ile çalışma planı oluşturma özelliği bulunur.",
        ],
      },
      {
        heading: "Tusoskop'ta haftalık lig sistemi var mı?",
        paragraphs: [
          "Evet. Tusoskop'ta kullanıcıların çalışma motivasyonunu destekleyen haftalık lig sistemi bulunur.",
        ],
      },
    ],
    faq: [
      ...commonFaq,
      {
        question: "Tusoskop'ta AI çalışma planı var mı?",
        answer:
          "Evet. Tusoskop'ta AI entegrasyonu ile çalışma planı oluşturma özelliği bulunur.",
      },
      {
        question: "Tusoskop'ta haftalık lig sistemi var mı?",
        answer:
          "Evet. Tusoskop'ta çalışma motivasyonunu destekleyen haftalık lig sistemi bulunur.",
      },
      {
        question: "Tusoskop ücretli mi?",
        answer:
          "Tusoskop'ta ücretsiz kullanım ve Plus erişim seçenekleri bulunabilir. Güncel fiyatlar uygulama içinde görüntülenmelidir.",
      },
    ],
    links: [
      ["Tusoskop nedir?", "/tusoskop-nedir"],
      ["Tusoskop özellikleri", "/tusoskop-ozellikleri"],
    ],
  },
];

// --- Branş (ders) bazlı SEO sayfaları -------------------------------------
// Her ders için "TUS {Ders} Soruları" sayfası: gerçek soru sayısı + soru
// bankamızdan örnek bir soru. "tus {ders} soruları" aramalarını hedefler.

function relatedSubjectLinks(currentSlug) {
  const others = SUBJECTS.filter((s) => s.slug !== currentSlug).slice(0, 2);
  return [
    ...others.map((s) => [`TUS ${s.name} Soruları`, `/${s.slug}`]),
    ["TUS Soru Çözme Uygulaması", "/tus-soru-cozme-uygulamasi"],
    ["TUS Puan Hesaplama", "/tus-puan-hesaplama"],
  ];
}

const subjectSeoPages = SUBJECTS.map((subject) => ({
  slug: subject.slug,
  isSubject: true,
  subject: subject.name,
  questionCount: subject.count,
  topics: subject.topics ?? [],
  sample: subject.sample,
  stats: [
    { value: `${subject.count}`, label: `${subject.name} sorusu` },
    { value: QUESTION_COUNT_LABEL, label: "Toplam soru" },
    { value: `${FREE_DAILY_QUESTIONS}`, label: "Günlük ücretsiz" },
  ],
  title: `TUS ${subject.name} Soruları — ${subject.count} Soru Çöz | Tusoskop`,
  description:
    `Tusoskop'ta ${subject.count} TUS tarzı ${subject.name} sorusunu konu konu seçerek çöz. Yanlışlarını akıllı tekrarla pekiştir, performansını analiz et. Örnek soruyu hemen incele.`,
  h1: `TUS ${subject.name} Soruları`,
  intro:
    `Tusoskop'ta ${subject.name} dersine ait ${subject.count} TUS tarzı soruyu konu konu seçerek çözebilirsin. Aşağıda soru bankamızdan gerçek bir ${subject.name} örnek sorusu ve açıklaması yer alıyor.`,
  sections: [
    {
      heading: `TUS ${subject.name} sorularını konu konu çöz`,
      paragraphs: [
        `Tusoskop'ta ${subject.name} dersini alt konularına ayırarak çalışabilir, çalıştığın konudan hemen sonra o konuya ait soruları çözerek bilgini sınayabilirsin. Toplam ${subject.count} ${subject.name} sorusu konu bazlı test akışında sunulur.`,
      ],
    },
    {
      heading: `${subject.name} yanlışlarını akıllı tekrarla pekiştir`,
      paragraphs: [
        `Yanlış yaptığın ${subject.name} sorularını ve favoriye aldıklarını takip edebilir, bilimsel aralıklı tekrar (FSRS) ile bu soruları tam unutmaya başladığın aralıklarda yeniden karşına çıkarabilirsin.`,
      ],
    },
    {
      heading: `${subject.name} performansını analiz et`,
      paragraphs: [
        `Çözdüğün ${subject.name} sorularının doğru/yanlış dağılımını ve konu bazlı eksiklerini analiz ekranlarından takip edebilir, hangi konulara daha çok çalışman gerektiğini görebilirsin.`,
      ],
    },
  ],
  faq: [
    {
      question: `Tusoskop'ta kaç ${subject.name} sorusu var?`,
      answer: `Tusoskop'ta ${subject.count} TUS tarzı ${subject.name} sorusu bulunur ve bunları konu konu seçerek çözebilirsin.`,
    },
    {
      question: `TUS ${subject.name} sorularını konu seçerek çözebilir miyim?`,
      answer: `Evet. ${subject.name} dersini alt konularına ayırarak istediğin konudan soru çözebilirsin.`,
    },
    {
      question: `${subject.name} yanlışlarımı tekrar edebilir miyim?`,
      answer: `Evet. Yanlış ve favori ${subject.name} sorularını takip eder, akıllı tekrar (FSRS) ile düzenli olarak yeniden çözebilirsin.`,
    },
    {
      question: "Tusoskop ücretsiz mi?",
      answer: `Free planda günde ${FREE_DAILY_QUESTIONS} soru ve ${FREE_DAILY_TOPIC_TESTS} konu testi ücretsizdir; Plus erişimde limitler kalkar.`,
    },
  ],
  links: relatedSubjectLinks(subject.slug),
}));

export const subjectIndexLinks = SUBJECTS.map((s) => [`TUS ${s.name} Soruları`, `/${s.slug}`]);

export const seoPages = [...contentSeoPages, ...subjectSeoPages];

export const legalStaticPages = [
  {
    slug: "gizlilik-sozlesmesi",
    title: "Gizlilik Sözleşmesi | Tusoskop",
    description:
      "Tusoskop gizlilik sözleşmesi: hesap, kullanım, ödeme talebi ve analiz verilerinin hangi amaçlarla işlendiğine dair bilgilendirme.",
    h1: "Gizlilik Sözleşmesi",
    intro:
      "Tusoskop, kullanıcıların gizliliğine önem verir. Bu sayfa, platformun kullanımı sırasında işlenen veriler hakkında genel bilgilendirme sağlar.",
    sections: [
      {
        heading: "Toplanan veriler",
        paragraphs: [
          "Tusoskop; hesap e-postası, kullanıcı kimliği, soru çözme verileri, yanlış ve favori sorular, deneme sonuçları, kullanım limitleri, Plus erişim durumu, ödeme talebi bilgileri ve teknik analiz verilerini işleyebilir.",
        ],
      },
      {
        heading: "Verilerin kullanım amaçları",
        paragraphs: [
          "Veriler hesabı yönetmek, çalışma geçmişini göstermek, yanlış ve favori özelliklerini sunmak, Free/Plus erişim kontrollerini yapmak, ödeme taleplerini takip etmek, güvenlik ve deneyim iyileştirmesi sağlamak için kullanılabilir.",
        ],
      },
      {
        heading: "Ödeme bilgileri",
        paragraphs: [
          "Kart bilgileri Tusoskop tarafından saklanmaz. Ödeme işlemleri PayTR ve ilgili ödeme sağlayıcısı üzerinden yürütülür.",
        ],
      },
      {
        heading: "İletişim",
        paragraphs: ["Gizlilikle ilgili sorular için tusoskop.destek@gmail.com adresine yazılabilir."],
      },
    ],
  },
  {
    slug: "kullanim-kosullari",
    title: "Kullanım Koşulları | Tusoskop",
    description:
      "Tusoskop kullanım koşulları: TUS hazırlığı, hesap kullanımı, Free ve Plus erişim, içerik hakları ve hizmet koşulları.",
    h1: "Kullanım Koşulları",
    intro:
      "Tusoskop, TUS hazırlık sürecine destek olmak amacıyla soru çözme, deneme, tekrar ve analiz özellikleri sunan dijital bir çalışma platformudur.",
    sections: [
      {
        heading: "Platformun amacı",
        paragraphs: [
          "Tusoskop'ta yer alan içerikler eğitim ve sınava hazırlık amacı taşır. Gerçek hasta yönetimi, tanı veya tedavi kararı için kullanılmamalıdır.",
        ],
      },
      {
        heading: "Hesap kullanımı",
        paragraphs: [
          "Kullanıcı kendi hesabının güvenliğinden sorumludur. Hesap paylaşımı, kötüye kullanım veya sistem sınırlarını aşmaya yönelik davranışlar halinde erişim kısıtlanabilir.",
        ],
      },
      {
        heading: "Free ve Plus kullanım",
        paragraphs: [
          "Free kullanıcılar belirli günlük veya aylık limitlerle platformu kullanabilir. Plus kullanıcılar satın alınan dönem boyunca premium özelliklere erişebilir.",
        ],
      },
      {
        heading: "İçerik ve fikri haklar",
        paragraphs: [
          "Platformdaki soru, açıklama, analiz ve tasarım içerikleri Tusoskop'a aittir veya Tusoskop tarafından kullanım hakkı kapsamında sunulur. İzinsiz kopyalama ve ticari kullanım yasaktır.",
        ],
      },
    ],
  },
];

export const sitemapEntries = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  ...seoPages.map((page) => ({
    path: `/${page.slug}`,
    changefreq: page.slug === "tusoskop-sss" ? "monthly" : "weekly",
    priority: ["tusoskop-nedir", "tus-soru-cozme-uygulamasi", "tus-hazirlik-platformu"].includes(page.slug)
      ? "0.9"
      : "0.8",
  })),
  ...legalStaticPages.map((page) => ({
    path: `/${page.slug}`,
    changefreq: "yearly",
    priority: "0.3",
  })),
];

export function getSeoPageByPath(pathname) {
  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  if (cleanPath === "/") return null;
  const slug = cleanPath.slice(1);
  return seoPages.find((page) => page.slug === slug) ?? null;
}

export function pageUrl(path) {
  return `${SITE_URL}${path === "/" ? "/" : path}`;
}
