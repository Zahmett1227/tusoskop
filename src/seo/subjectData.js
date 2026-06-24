// Tusoskop SEO — branş (ders) verileri ve pazarlama sabitleri.
//
// Buradaki soru sayıları src/data/questionChunks/_manifest.json içindeki
// subjectCounts ile aynı olmalıdır. Örnek sorular doğrudan Tusoskop soru
// bankasından alınmıştır (id alanı orijinal soru kimliğidir).
//
// Hem React tarafı (PublicSeoPages.jsx) hem de statik prerender
// (scripts/generate-seo-pages.mjs) bu dosyadan beslenir; tek doğruluk kaynağı.

// Free planda günlük ücretsiz soru hakkı (src/config/limits.js → FREE_LIMITS).
export const FREE_DAILY_QUESTIONS = 30;
export const FREE_DAILY_TOPIC_TESTS = 2;

export const SUBJECTS = [
  {
    name: "Anatomi",
    slug: "tus-anatomi-sorulari",
    count: 586,
    sample: {
      id: 5110,
      konu: "Ürogenital Sistem",
      q: "Sol varikoseli olan genç erkek hastada semptomların solda daha sık görülmesi hangi venöz drenaj ilişkisiyle en iyi açıklanır?",
      options: [
        "Sol testiküler venin doğrudan inferior vena cavaya dar açıyla açılması",
        "Sağ testiküler venin sol renal vene dik açıyla açılması",
        "Sol testiküler venin sol renal vene dik açıya yakın şekilde drene olması",
        "Pampiniform pleksusun sağda bulunmaması",
        "Sol testiküler arterin venöz dönüşü kapakçıklarla engellemesi",
      ],
      correct: 2,
      exp: "Sol testiküler ven sol renal vene dik açıya yakın drene olur ve sol renal ven basıncından etkilenebilir. Bu anatomik drenaj sol varikoselin daha sık görülmesine katkı sağlar.",
    },
  },
  {
    name: "Biyokimya",
    slug: "tus-biyokimya-sorulari",
    count: 468,
    sample: {
      id: 5499,
      konu: "Enzimler ve Klinik Biyokimya",
      q: "Göğüs ağrısı, ST elevasyonu ve CK-MB 85 ng/mL (referans <5) olan hastada en spesifik kardiyak hasar belirteci hangisidir?",
      options: ["CK-MB", "LDH", "ALT", "Amilaz", "ALP"],
      correct: 0,
      exp: "CK-MB miyokard hasarında erken yükselir; troponin ile birlikte tanıda kullanılır.",
    },
  },
  {
    name: "Dahiliye",
    slug: "tus-dahiliye-sorulari",
    count: 842,
    sample: {
      id: 2078,
      konu: "Romatoloji",
      q: "Sedef hastalığı olan hastada asimetrik oligoartrit, tırnak çukurcuklanması ve daktilit vardır. En olası tanı hangisidir?",
      options: ["Romatoid artrit", "Psöriatik artrit", "Gut", "SLE", "Polimiyalji romatika"],
      correct: 1,
      exp: "Psöriatik artritte daktilit, entezit ve tırnak bulguları görülebilir. Romatoid faktör çoğu hastada negatiftir.",
    },
  },
  {
    name: "Farmakoloji",
    slug: "tus-farmakoloji-sorulari",
    count: 575,
    sample: {
      id: 4991,
      konu: "Endokrin Sistem Farmakolojisi",
      q: "Hipertiroidi tedavisinde metimazol verilen hastada tiroid hormon sentezi azalıyor. Metimazol hangi basamağı inhibe eder?",
      options: [
        "Tiroid peroksidaz aracılı organifikasyon ve eşleşme",
        "T4'ün T3'e periferik dönüşümünü seçici artırma",
        "TSH reseptörünü agonize etme",
        "Tiroglobulini parçalama",
        "İyotun böbrekten atılımını durdurma",
      ],
      correct: 0,
      exp: "Metimazol tiroid peroksidazı inhibe ederek iyot organifikasyonu ve tirozin eşleşmesini azaltır.",
    },
  },
  {
    name: "Fizyoloji",
    slug: "tus-fizyoloji-sorulari",
    count: 725,
    sample: {
      id: 5290,
      konu: "Hematopoetik Sistem Histofizyolojisi",
      q: "Akut kan kaybından birkaç gün sonra retikülositoz gelişen hastada periferik kana çıkan hücrelerde hangi özellik beklenir?",
      options: [
        "Çok loblu çekirdek ve azurofil granül",
        "Yüzey immünoglobulini ve germinal merkez yanıtı",
        "Hemoglobin içermeyen çekirdekli eritroblast görünümü",
        "Trombositlere parçalanan poliploid sitoplazma",
        "Ribozomal RNA kalıntıları nedeniyle supravital boyayla ağsı görünüm",
      ],
      correct: 4,
      exp: "Retikülositler çekirdeksizdir ancak ribozomal RNA kalıntısı taşır; supravital boyalarla ağsı görünüm verir ve artışı kemik iliği eritropoetik yanıtını gösterir.",
    },
  },
  {
    name: "Genel Cerrahi",
    slug: "tus-genel-cerrahi-sorulari",
    count: 530,
    sample: {
      id: 2541,
      konu: "Kolon ve Rektum Hastalıkları",
      q: "Uzun süreli ülseratif koliti olan hastada kolonoskopide yüksek dereceli displazi saptanıyor. En uygun yaklaşım hangisidir?",
      options: [
        "Sadece antispazmodik başlamak",
        "Proktokolektomi değerlendirmek",
        "Appendektomi yapmak",
        "Sadece 10 yıl sonra kontrol",
        "Safra kesesi alınması",
      ],
      correct: 1,
      exp: "Uzun süreli ülseratif kolitte displazi kolorektal kanser riskini gösterir. Yüksek dereceli displazide proktokolektomi genellikle önerilir.",
    },
  },
  {
    name: "Kadın Hastalıkları ve Doğum",
    slug: "tus-kadin-dogum-sorulari",
    count: 506,
    sample: {
      id: 4593,
      konu: "Perinatoloji",
      q: "31 yaşında kadın, 39. haftada sezaryen ile doğum yapıyor. Bebek doğduktan sonra kord klemplenmesi ne zaman yapılmalıdır?",
      options: [
        "Derhal — ilk 15 saniyede",
        "Geciktirilmiş kord klemlenmesi (≥60 saniye veya kord atımı duruncaya kadar); terme olgularda ≥60 sn, preterm olgularda 30-60 sn",
        "Sadece prematüre bebeklerde geciktir",
        "Plasenta çıkınca klemple",
        "Sezaryende erken klemple, kanama riski var",
      ],
      correct: 1,
      exp: "WHO ve ACOG geciktirilmiş kord klemlenmesini (DCC) terme ve preterm doğumlarda önermektedir. DCC ile yenidoğana plasental kan transferi sağlanır; hemoglobin artışı ve neonatal demir depolarının korunması beklenir. Terme bebekte ≥60 saniye, preterm bebekte 30-60 saniye uygundur.",
    },
  },
  {
    name: "Küçük Stajlar",
    slug: "tus-kucuk-stajlar-sorulari",
    count: 512,
    sample: {
      id: 1727,
      konu: "Nöroloji",
      q: "19 yaşında erkek hasta kısa süreli dalma, dudak şapırdatma ve olaydan hemen önce deja vu hissi ile başvuruyor. Nöbet sonrası birkaç dakika konfüzyon oluyor. Bu nöbet tipi en sık hangi bölgeden kaynaklanır?",
      options: [
        "Mezial temporal lob",
        "Primer motor korteks bacak alanı",
        "Serebellar vermis",
        "Oksipital pol",
        "Medulla oblongata",
      ],
      correct: 0,
      exp: "Deja vu, epigastrik yükselme hissi, otomatizmalar ve postiktal konfüzyon temporal lob nöbetlerini düşündürür. En sık mezial temporal yapılar ve hipokampus sklerozu ile ilişkilidir.",
    },
  },
  {
    name: "Mikrobiyoloji",
    slug: "tus-mikrobiyoloji-sorulari",
    count: 659,
    sample: {
      id: 4893,
      konu: "Viroloji",
      q: "Aşısız çocukta ateşli hastalık sonrası asimetrik gevşek paralizi gelişiyor. Virüsün hasarladığı başlıca yapı hangisidir?",
      options: [
        "Dorsal kolon",
        "Serebellar Purkinje hücresi",
        "Ön boynuz motor nöronları",
        "Temporal lob korteksi",
        "Bazal ganglion globus pallidus",
      ],
      correct: 2,
      exp: "Poliovirüs omurilik ön boynuz motor nöronlarını tutarak asimetrik gevşek paralizi yapabilir.",
    },
  },
  {
    name: "Patoloji",
    slug: "tus-patoloji-sorulari",
    count: 797,
    sample: {
      id: 6819,
      konu: "Erkek Genital Sistem Hastalıkları",
      q: "Kriptorşidizm nedeniyle opere edilmemiş 34 yaşında bir erkek hastada, inmemiş testiste hangi tümör tipi gelişme riski en fazla artmaktadır?",
      options: ["Leydig hücreli tümör", "Sertoli hücreli tümör", "Seminoma", "Teratom", "Lenfoma"],
      correct: 2,
      exp: "Kriptorşidizm, testisin yüksek sıcaklığa maruz kalmasına yol açar ve özellikle seminoma riskini belirgin biçimde artırır. Kriptorşid testis normal testise kıyasla yaklaşık 3-5 kat daha fazla malignite riski taşır; germ hücreli tümörler arasında en sık görüleni seminomadır.",
    },
  },
  {
    name: "Pediatri",
    slug: "tus-pediatri-sorulari",
    count: 877,
    sample: {
      id: 2314,
      konu: "Pediatrik Hematoloji ve Onkoloji",
      q: "Orak hücre hastalığı olan çocukta el-ayak şişliği ve ağrısı gelişiyor. Bu durumun küçük çocuklarda tipik adı hangisidir?",
      options: [
        "Daktilit",
        "Kawasaki hastalığı",
        "Reye sendromu",
        "Henoch-Schönlein purpurası",
        "Guillain-Barré sendromu",
      ],
      correct: 0,
      exp: "Orak hücre hastalığında küçük çocuklarda kemik iliği damar tıkanmasına bağlı el-ayak sendromu (daktilit) görülebilir.",
    },
  },
];

// Soru bankasındaki toplam soru sayısı (branş sayımlarının toplamı).
export const TOTAL_QUESTIONS = SUBJECTS.reduce((sum, s) => sum + s.count, 0);

// Ders (branş) sayısı.
export const LESSON_COUNT = SUBJECTS.length;

// Pazarlama "X+" kuralı: gerçek soru sayısını bir alt yüzlüğe yuvarlar.
// Hiçbir zaman gerçek sayının üzerine çıkmaz → iddia her zaman doğrulanabilir.
//   7077 → 7000   |   7200 → 7100   |   7100 → 7000
export function flooredHundred(n = TOTAL_QUESTIONS) {
  const floored = Math.floor(n / 100) * 100;
  return n % 100 === 0 ? floored - 100 : floored;
}

// "7000+" biçiminde pazarlama etiketi.
export function questionCountLabel(n = TOTAL_QUESTIONS) {
  return `${flooredHundred(n).toLocaleString("tr-TR")}+`;
}
