/**
 * Meta reklam trafiği için "3 Soruluk TUS Mikro Denemesi" kampanya kataloğu.
 *
 * Mimari not (MVP):
 *  - Kampanya ve sorular STATİK olarak bundle edilir. Reklam trafiğinde ilk render
 *    hiçbir Firestore okumasına bağlanmaz (en hızlı ilk paint).
 *  - Ana soru bankası veya korumalı sorular public Firestore'a AÇILMAZ. Buradaki
 *    sorular yalnızca reklam kampanyalarında kullanılan, elle seçilmiş küçük bir settir.
 *  - Şema, ileride publicQuizCampaigns/{campaignCode} + publicQuizQuestions/{id}
 *    Firestore koleksiyonlarına taşımayı kolaylaştıracak biçimde tutulmuştur.
 *
 * `correctIndex` 0-tabanlıdır (ana bankadaki `correct` alanıyla aynı konvansiyon).
 */

/**
 * @typedef {Object} PublicQuizQuestion
 * @property {string} id
 * @property {string} questionText
 * @property {string[]} options
 * @property {number} correctIndex   0-tabanlı doğru şık indeksi
 * @property {string} explanation
 * @property {string} subject
 * @property {string} topic
 * @property {number} difficulty
 */

/**
 * @typedef {Object} PublicQuizCampaign
 * @property {string} slug            URL segmenti: /coz/:slug
 * @property {string} campaignCode    Analitik/attribution anahtarı (ör. mq_pat_01)
 * @property {string} title
 * @property {string} subject
 * @property {boolean} active
 * @property {string} appleCampaignToken  App Store Connect ct değeri
 * @property {PublicQuizQuestion[]} questions
 */

/** @type {PublicQuizCampaign[]} */
export const PUBLIC_QUIZ_CAMPAIGNS = [
  {
    slug: "patoloji-01",
    campaignCode: "mq_pat_01",
    title: "3 Soruluk Patoloji Mini Denemesi",
    subject: "Patoloji",
    active: true,
    appleCampaignToken: "mq_pat_01",
    questions: [
      {
        id: "public_pat_001",
        subject: "Patoloji",
        topic: "İnflamasyon",
        difficulty: 4,
        questionText:
          "Akut inflamasyonda lökositlerin endotelden transmigrasyonu (diapedez) aşamasında, lökositler ve endotel hücreleri üzerindeki homofilik etkileşimlerle bu geçişi sağlayan temel adezyon molekülü (CD31) aşağıdakilerden hangisidir?",
        options: ["PECAM-1", "ICAM-1", "VCAM-1", "L-Selektin", "P-Selektin"],
        correctIndex: 0,
        explanation:
          "Diapedez (transmigrasyon) sürecini yöneten temel molekül, hem lökositlerde hem de endotel hücrelerinde eksprese edilen ve homofilik bağlanma yapan PECAM-1'dir (Platelet Endothelial Cell Adhesion Molecule-1, CD31). ICAM ve VCAM sıkı tutunmada (adezyonda) rol oynar.",
      },
      {
        id: "public_pat_002",
        subject: "Patoloji",
        topic: "Hemodinamik Bozukluklar",
        difficulty: 4,
        questionText:
          "Kalıtsal trombofililerin en sık nedeni olan ve Aktif Protein C'nin inaktivasyon etkisine karşı direnç göstererek venöz tromboz riskini belirgin şekilde artıran mutasyon aşağıdakilerden hangisidir?",
        options: [
          "Protrombin G20210A mutasyonu",
          "Faktör V Leiden mutasyonu",
          "Antitrombin III eksikliği",
          "Protein S eksikliği",
          "MTHFR gen mutasyonu",
        ],
        correctIndex: 1,
        explanation:
          "Faktör V Leiden mutasyonu, Faktör V molekülünde spesifik bir aminoasit değişikliğine yol açarak onun Aktif Protein C (APC) tarafından yıkılmasını engeller. Bu 'APC direnci', pıhtılaşma kaskadının frenlenememesine ve hiperkoagülabiliteye neden olur.",
      },
      {
        id: "public_pat_003",
        subject: "Patoloji",
        topic: "Neoplazi",
        difficulty: 5,
        questionText:
          "Hücre siklusunun G1'den S fazına geçişini kontrol eden ve hipofosforile (aktif) durumdayken E2F transkripsiyon faktörüne sıkıca bağlanarak onu inhibe eden 'Hücre siklusunun valisi' olarak adlandırılan tümör süpresör gen aşağıdakilerden hangisidir?",
        options: ["p53", "Rb", "BRCA1", "APC", "PTEN"],
        correctIndex: 1,
        explanation:
          "Retinoblastom (Rb) geni, hücre döngüsünde kritik bir kontrol noktasıdır. Aktif (hipofosforile) Rb, E2F'ye bağlanarak DNA sentezi için gereken genlerin transkripsiyonunu durdurur. CDK'lar tarafından hiperfosforile edildiğinde ise E2F serbest kalır ve hücre S fazına geçer.",
      },
    ],
  },

  // ── K4: "Çoğunluğun yanıldığı soru" serisi — Farmakoloji tuzakları ──────────
  // Reklam açısı: "Bu soruyu çözenlerin çoğu yanlış şıkka gitti." Yanlış oranı
  // reklam kreatifinde iddia edilir; buradaki sorular ana bankadan birebir alındı.
  {
    slug: "tuzak-farmakoloji-01",
    campaignCode: "mq_far_02",
    title: "Çoğunluğun Yanıldığı 3 Farmakoloji Sorusu",
    subject: "Farmakoloji",
    active: true,
    appleCampaignToken: "mq_far_02",
    questions: [
      {
        id: "public_far_2873",
        subject: "Farmakoloji",
        topic: "İlaç Etkileşimleri",
        difficulty: 4,
        questionText:
          "Pnömoni nedeniyle klaritromisin başlanan, aynı zamanda simvastatin kullanan 62 yaşındaki hastada birkaç gün sonra yaygın kas ağrısı ve CK yüksekliği gelişiyor. Bu etkileşimi en iyi açıklayan durum hangisidir?",
        options: [
          "Klaritromisinin CYP3A4 inhibisyonu ile statin düzeyini artırması",
          "Klaritromisinin statinin renal atılımını hızlandırması",
          "Simvastatinin klaritromisinin absorbsiyonunu tamamen engellemesi",
          "İki ilacın aynı reseptöre kompetitif bağlanması",
          "Klaritromisinin statini farmakolojik antagonize etmesi",
        ],
        correctIndex: 0,
        explanation:
          "Makrolidler, özellikle eritromisin ve klaritromisin, CYP3A4 inhibisyonu yapabilir. Simvastatin gibi CYP3A4 ile metabolize olan statinlerin düzeyi artar; miyopati ve rabdomiyoliz riski yükselir.",
      },
      {
        id: "public_far_787",
        subject: "Farmakoloji",
        topic: "Genel Farmakoloji",
        difficulty: 4,
        questionText:
          "Bir tam agonistin, bir kompetitif (yarışmalı) antagonist varlığında çizilen Doz-Yanıt (Dose-Response) eğrisinde meydana gelen farmakodinamik değişiklik aşağıdakilerden hangisinde doğru ifade edilmiştir?",
        options: [
          "Agonistin Maksimum Etkinliği (Emax) düşer, EC50 değeri değişmez.",
          "Agonistin Maksimum Etkinliği (Emax) DEĞİŞMEZ, eğri SAĞA kayar ve EC50 değeri artar.",
          "Agonistin Maksimum Etkinliği (Emax) düşer, eğri SOLA kayar ve EC50 değeri azalır.",
          "Hem Emax düşer hem de EC50 artar.",
          "Agonist reseptöre hiç bağlanamaz, eğri oluşmaz.",
        ],
        correctIndex: 1,
        explanation:
          "Kompetitif antagonizmada agonist ve antagonist aynı reseptör için yarışır. Antagonist varlığında aynı etkiyi elde etmek için daha fazla agonist gerekir; eğri SAĞA kayar ve EC50 artar (potens düşer). Ancak yeterince yüksek dozda agonist antagonisti yerinden edebildiği için Emax DEĞİŞMEZ. Non-kompetitif blokörlerde ise reseptör kalıcı bozulduğu için Emax düşer.",
      },
      {
        id: "public_far_2882",
        subject: "Farmakoloji",
        topic: "Otonom Sinir Sistemi",
        difficulty: 4,
        questionText:
          "İnferior miyokard infarktüsü sonrası semptomatik bradikardi gelişen hastaya atropin uygulanıyor. Nabız yükselirken ağız kuruluğu ve bulanık görme de belirginleşiyor. Bu yan etkiler hangi reseptör blokajıyla ilişkilidir?",
        options: [
          "Nikotinik ganglion reseptörü",
          "Muskarinik reseptör",
          "Alfa-1 reseptör",
          "Beta-2 reseptör",
          "Dopamin D2 reseptörü",
        ],
        correctIndex: 1,
        explanation:
          "Atropin muskarinik reseptör antagonistidir. Vagal tonusu azaltarak kalp hızını artırır; aynı zamanda sekresyon azalması, midriyazis, siklopleji ve üriner retansiyon gibi antimuskarinik yan etkiler oluşturabilir.",
      },
    ],
  },

  // ── K3: Karışık mini deneme — 4 temel/klinik daldan tek soru ────────────────
  // Reklam açısı: "3 soruda TUS'un neresindesin?" Tam 10 soruluk "tahmini puan"
  // versiyonu (skor gösterimi) Mini TUS paketiyle gelecek; bu 3 soruluk teaser
  // mevcut funnel'la birebir çalışır.
  {
    slug: "karisik-tus-01",
    campaignCode: "mq_kar_01",
    title: "3 Soruluk Karışık TUS Denemesi",
    subject: "TUS",
    active: true,
    appleCampaignToken: "mq_kar_01",
    questions: [
      {
        id: "public_dah_1838",
        subject: "Dahiliye",
        topic: "Gastroenteroloji",
        difficulty: 4,
        questionText:
          "Katı ve sıvı gıdaları yutmakta aynı dönemde zorlanan, gece regürjitasyon ve aspirasyon öyküsü olan 42 yaş erkek hastada baryumlu grafide kuş gagası görünümü saptanıyor. Bu hastada tanıyı kesinleştirmek için en uygun inceleme hangisidir?",
        options: [
          "Üst GİS endoskopisinde yalnızca biyopsi almak",
          "24 saatlik pH monitorizasyonu",
          "Serum gastrin düzeyi",
          "Kolonoskopi",
          "Özofagus manometrisi",
        ],
        correctIndex: 4,
        explanation:
          "Akalazyada alt özofagus sfinkterinin gevşememesi ve aperistaltizm beklenir. Tanıyı en iyi gösteren test özofagus manometrisidir; endoskopi daha çok maligniteyi dışlamak için kullanılır.",
      },
      {
        id: "public_ped_1619",
        subject: "Pediatri",
        topic: "Neonatoloji",
        difficulty: 4,
        questionText:
          "28 haftalık prematüre bebekte doğumdan kısa süre sonra takipne, inleme ve retraksiyon gelişiyor. Akciğer grafisinde retikülogranüler görünüm ve hava bronkogramları izleniyor. Bu tablonun temel nedeni aşağıdakilerden hangisidir?",
        options: [
          "Alveollerde sürfaktan eksikliği",
          "Pulmoner venöz dönüş anomalisi",
          "Bronş kıkırdaklarının doğumsal yokluğu",
          "Aşırı fetal akciğer sıvısı retansiyonu",
          "Doğum kanalında mekonyum aspirasyonu",
        ],
        correctIndex: 0,
        explanation:
          "Prematürelerde respiratuvar distres sendromu, tip II pnömosit maturasyonunun yetersizliği ve sürfaktan eksikliği ile gelişir. Alveol kollapsı, düşük kompliyans ve tipik retikülogranüler grafi bulguları beklenir.",
      },
      {
        id: "public_fiz_2338",
        subject: "Fizyoloji",
        topic: "Hücre Fizyolojisi",
        difficulty: 4,
        questionText:
          "Yoğun bakımda hiperkalemi gelişen bir hastanın EKG'sinde QRS genişlemesi ve iletim yavaşlaması izleniyor. Bu tablonun hücre düzeyinde en iyi açıklaması aşağıdakilerden hangisidir?",
        options: [
          "Hücre dışı potasyum artışı istirahat membran potansiyelini daha negatif hale getirir",
          "Hücre dışı potasyum artışı membranı kısmen depolarize ederek voltaj kapılı sodyum kanallarının bir kısmını inaktive eder",
          "Potasyum artışı sodyum-potasyum pompasını tamamen durdurur ve tüm hücreler hiperpolarize olur",
          "Potasyum artışı kalsiyum kanallarını kapatarak aksiyon potansiyeli süresini uzatır",
          "Potasyum artışı klor girişini artırarak membranı stabilize eder",
        ],
        correctIndex: 1,
        explanation:
          "Ekstrasellüler K+ artışı istirahat membran potansiyelini daha az negatif yapar. Sürekli kısmi depolarizasyon hızlı Na+ kanallarını inaktive eder; özellikle kalpte iletim yavaşlar ve QRS genişleyebilir.",
      },
    ],
  },
];

const BY_SLUG = new Map(
  PUBLIC_QUIZ_CAMPAIGNS.map((campaign) => [campaign.slug, campaign])
);

/**
 * URL path'inden mikro deneme slug'ını çıkarır: "/coz/patoloji-01" -> "patoloji-01".
 * @param {string} pathname
 * @returns {string|null}
 */
export function getPublicQuizSlugFromPath(pathname) {
  if (!pathname) return null;
  const match = /^\/coz\/([^/?#]+)/i.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]).trim().toLowerCase();
  } catch {
    return String(match[1]).trim().toLowerCase();
  }
}

/**
 * @param {string} slug
 * @returns {PublicQuizCampaign|null}
 */
export function getPublicQuizCampaignBySlug(slug) {
  if (!slug) return null;
  return BY_SLUG.get(String(slug).trim().toLowerCase()) || null;
}
