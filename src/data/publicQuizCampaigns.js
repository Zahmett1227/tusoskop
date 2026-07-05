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
 * @property {boolean} [isMiniTus]     true ise sonuç ekranı istatistiksel tahmin
 *   (kalibrasyon puanı + yüzdelik) gösterir — bkz. utils/miniTusScoring.js
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

  // ── K1: Mini TUS — 20 soruluk karışık deneme, istatistiksel tahminli sonuç ──
  // Reklam açısı: haftalık "Türkiye Geneli Mini TUS" etkinliği (C2). Temel/klinik
  // dağılımı gerçek TUS oranına yakın (10 temel + 10 klinik). Sonuç ekranında
  // tahmini kalibrasyon puanı + "Türkiye'de tahmini ilk %X" gösterilir —
  // istatistiksel tahmindir, resmi ÖSYM puanı DEĞİLDİR (bkz. miniTusScoring.js).
  {
    slug: "mini-tus",
    campaignCode: "mq_mini_01",
    title: "20 Soruluk Mini TUS",
    subject: "TUS",
    active: true,
    appleCampaignToken: "mq_mini_01",
    isMiniTus: true,
    questions: [
      {
        id: "public_mini_anatomi_1123",
        subject: "Anatomi",
        topic: "Anatomiye Giriş ve Terminoloji",
        difficulty: 4,
        questionText:
          "Hasta anatomik pozisyondan avuç içi yere bakacak şekilde ön kolunu çeviriyor. Bu bulgular birlikte değerlendirildiğinde: Bu hareketin adı nedir?",
        options: [
          "Pronasyon",
          "Retraksiyon",
          "İnversiyon",
          "Eversiyon",
          "Supinasyon",
        ],
        correctIndex: 0,
        explanation:
          "Avuç içinin aşağı/posteriora dönmesi pronasyondur. Supinasyonda avuç içi yukarı/anteriora döner.",
      },
      {
        id: "public_mini_anatomi_1192",
        subject: "Anatomi",
        topic: "Solunum",
        difficulty: 4,
        questionText:
          "Sağ akciğer lob ve fissür sayısı değerlendiriliyor. Doğru seçenek hangisidir?",
        options: [
          "3 lob, 2 fissür",
          "4 lob, 3 fissür",
          "2 lob, 2 fissür",
          "3 lob, 1 fissür",
          "2 lob, 1 fissür",
        ],
        correctIndex: 0,
        explanation:
          "Sağ akciğer 3 loblu, horizontal ve oblik fissürlüdür.",
      },
      {
        id: "public_mini_biyokimya_1241",
        subject: "Biyokimya",
        topic: "Karbonhidratlar",
        difficulty: 4,
        questionText:
          "Bakla sonrası hemoliz, Heinz cisimcikleri ve koyu idrar gelişiyor. Tanısal tuzaklar dışlandığında: Eksik enzim-yol hangisidir?",
        options: [
          "Aldolaz B-fruktoz",
          "Piruvat kinaz-glikoliz",
          "Glukoz-6-fosfataz-glikojen",
          "GALT-galaktoz",
          "Glukoz-6-fosfat dehidrogenaz - pentoz fosfat yolu",
        ],
        correctIndex: 4,
        explanation:
          "G6PD eksikliği NADPH azalmasıyla oksidatif hemoliz yapar.",
      },
      {
        id: "public_mini_biyokimya_1305",
        subject: "Biyokimya",
        topic: "Aminoasitler",
        difficulty: 4,
        questionText:
          "Nitrik oksit sentezinde substrat aminoasit değerlendiriliyor. Doğru seçenek hangisidir?",
        options: [
          "Histidin",
          "Sitrülin",
          "Ornitin",
          "Glutamin",
          "Arjinin",
        ],
        correctIndex: 4,
        explanation:
          "NO sentaz arjininden NO üretir.",
      },
      {
        id: "public_mini_dahiliye_1839",
        subject: "Dahiliye",
        topic: "Gastroenteroloji",
        difficulty: 4,
        questionText:
          "Son 4 ayda katı gıdalara karşı giderek artan disfaji, kilo kaybı ve sigara öyküsü olan 68 yaş erkek hastanın fizik muayenesinde supraklaviküler lenf nodu palpe ediliyor. Bu tabloda ilk tercih edilmesi gereken tanısal yaklaşım hangisidir?",
        options: [
          "Ampirik proton pompa inhibitörü başlamak",
          "Üst GİS endoskopisi ve biyopsi",
          "Baryumlu grafi ile takip etmek",
          "Özofagus manometrisi istemek",
          "H2 reseptör blokeri ile 8 hafta izlemek",
        ],
        correctIndex: 1,
        explanation:
          "İlerleyici katı disfaji ve kilo kaybı özofagus malignitesi açısından alarm bulgusudur. Tanı histoloji gerektirdiği için endoskopi ve biyopsi önceliklidir.",
      },
      {
        id: "public_mini_dahiliye_1889",
        subject: "Dahiliye",
        topic: "Hepatoloji",
        difficulty: 4,
        questionText:
          "Polisitemi vera öyküsü olan hastada karın ağrısı, hepatomegali ve hızla gelişen asit ortaya çıkıyor. En olası tanı hangisidir?",
        options: [
          "Gilbert sendromu",
          "Akut hepatit A",
          "Budd-Chiari sendromu",
          "Çölyak hastalığı",
          "Primer biliyer kolanjit",
        ],
        correctIndex: 2,
        explanation:
          "Budd-Chiari hepatik ven trombozudur. Miyeloproliferatif hastalıklar önemli risk faktörüdür; karın ağrısı, hepatomegali ve asit tipiktir.",
      },
      {
        id: "public_mini_farmakoloji_786",
        subject: "Farmakoloji",
        topic: "Genel Farmakoloji",
        difficulty: 4,
        questionText:
          "Sürekli ve sabit dozda (IV infüzyon veya düzenli oral alım) uygulanan bir ilacın, kanda 'Kararlı Durum Konsantrasyonuna (Steady-State Concentration)' ulaşması için geçmesi gereken süre, sadece ilacın HANGİ farmakokinetik parametresine bağlıdır?",
        options: [
          "Biyoyararlanım (Bioavailability)",
          "Dağılım Hacmi (Vd)",
          "Eliminasyon Yarı Ömrü (t1/2)",
          "Veriliş yolu (IV veya oral)",
          "Uygulanan ilacın dozu",
        ],
        correctIndex: 2,
        explanation:
          "Kararlı durum (Steady-State), kana giren ilaç miktarı ile kandan atılan ilaç miktarının eşitlendiği, kan seviyesinin sabitlendiği hedeftir. Bir ilacın kararlı duruma ulaşması İÇİN GEÇEN SÜRE SADECE ve SADECE 'Eliminasyon Yarı Ömrüne (t1/2)' bağlıdır. İlacın dozunu artırmak veya veriliş yolunu değiştirmek bu SÜREYİ değiştirmez (sadece ulaşılacak o kararlı durumun seviyesini/yüksekliğini değiştirir). Kural olarak, bir ilacın kararlı duruma (yaklaşık %94-95'ine) ulaşması için bağımsız olarak '4 ile 5 yarı ömür (t1/2)' geçmesi GEREKİR. (Örn: Yarı ömrü 10 saat olan bir ilaç, dozu ne olursa olsun 40-50 saat sonra kararlı duruma ulaşır).",
      },
      {
        id: "public_mini_fizyoloji_1",
        subject: "Fizyoloji",
        topic: "Hücre Histolojisi ve Fizyolojisi",
        difficulty: 5,
        questionText:
          "I-cell (İnklüzyon cisimciği) hastalığında, Golgi aygıtında lizozomal enzimlerin hedeflenmesinden sorumlu olan ve eksikliği hücresel düzeyde enzimlerin lizozom yerine ekstraselüler alana salgılanmasına yol açan enzim aşağıdakilerden hangisidir?",
        options: [
          "N-asetilglukozaminil-1-fosfotransferaz",
          "Sfingomiyelinaz",
          "Glukoserebrozidaz",
          "Asit alfa-glukozidaz",
          "Hekzozaminidaz A",
        ],
        correctIndex: 0,
        explanation:
          "I-cell hastalığında cis-Golgi'de lizozomal enzimlere mannoz-6-fosfat eklentisini yapan N-asetilglukozaminil-1-fosfotransferaz enzimi eksiktir. Bu spesifik sinyal (M6P) olmaksızın hidrolitik enzimler lizozoma yönlendirilemez ve hücre dışına atılır.",
      },
      {
        id: "public_mini_fizyoloji_2413",
        subject: "Fizyoloji",
        topic: "Kardiyovasküler Sistem HistoFizyolojisi",
        difficulty: 5,
        questionText:
          "Pulmoner kapiller kama basıncı yüksek olan hastada akciğer ödemi gelişiyor. Bu ölçüm klinikte hangi basınca yaklaşık bilgi verir?",
        options: [
          "Sol atriyum basıncı",
          "Sağ atriyum basıncı",
          "Aort sistolik basıncı",
          "İntrakraniyal basınç",
          "Portal ven basıncı",
        ],
        correctIndex: 0,
        explanation:
          "Pulmoner kapiller wedge basıncı, mitral kapak darlığı gibi engel yoksa sol atriyum basıncını ve sol ventrikül dolum basıncını yaklaşık yansıtır.",
      },
      {
        id: "public_mini_genelcerrahi_2488",
        subject: "Genel Cerrahi",
        topic: "Asit Baz Bozuklukları",
        difficulty: 4,
        questionText:
          "Üç gündür inatçı kusması olan pilor stenozlu hastada ameliyat öncesi kan gazında pH 7,52, HCO3 yüksek, klor düşük ve potasyum düşük saptanıyor. Bu hastada operasyon öncesi öncelikli düzeltme hangi bozukluğa yönelik olmalıdır?",
        options: [
          "Hipokloremik metabolik alkaloz ve hipokalemi",
          "Yüksek anyon açıklı metabolik asidoz",
          "Respiratuvar alkaloz",
          "Hiperkloremik metabolik asidoz",
          "Laktat yüksekliğine bağlı mikst asidoz",
        ],
        correctIndex: 0,
        explanation:
          "Uzamış gastrik sıvı kaybı hidrojen ve klor kaybına bağlı hipokloremik metabolik alkaloz yapar. Volüm ve klor replasmanı böbreğin bikarbonat atılımını düzeltir; hipokalemi de mutlaka düzeltilmelidir.",
      },
      {
        id: "public_mini_genelcerrahi_2530",
        subject: "Genel Cerrahi",
        topic: "İnce Barsak Hastalıkları",
        difficulty: 4,
        questionText:
          "Çocukluk çağından beri aralıklı ağrısız alt gastrointestinal kanaması olan genç hastada sintigrafide sağ alt kadranda ektopik mide mukozası tutulumu görülüyor. En olası tanı hangisidir?",
        options: [
          "Meckel divertikülü",
          "Zenker divertikülü",
          "Sigmoid volvulus",
          "İntussusepsiyon sonrası polip",
          "Anal fissür",
        ],
        correctIndex: 0,
        explanation:
          "Meckel divertikülü omfalomezenterik kanal artığıdır ve ektopik gastrik mukoza içerebilir. Asit sekresyonu ülser ve kanamaya yol açabilir.",
      },
      {
        id: "public_mini_kadnhastalklarvedogum_2639",
        subject: "Kadın Hastalıkları ve Doğum",
        topic: "Perinatoloji",
        difficulty: 4,
        questionText:
          "İlk gebeliği olan 29 yaşındaki hastada 35. haftada ani başlayan şiddetli karın ağrısı, vajinal kanama, uterusta tahta sertliği ve fetal distres izleniyor. Plasenta previa öyküsü yok. Bu tablo için en olası tanı hangisidir?",
        options: [
          "Uterin rüptür",
          "Abruptio plasenta",
          "Servikal polip kanaması",
          "Vasa previa",
          "Nişan gelmesi",
        ],
        correctIndex: 1,
        explanation:
          "Ağrılı vajinal kanama, hipertonik uterus ve fetal distres abruptio plasentayı düşündürür. Plasenta previa tipik olarak ağrısız kanama ile seyreder; uterus genellikle yumuşaktır.",
      },
      {
        id: "public_mini_kadnhastalklarvedogum_2682",
        subject: "Kadın Hastalıkları ve Doğum",
        topic: "Perinatoloji",
        difficulty: 4,
        questionText:
          "Gebede epilepsi nedeniyle valproat kullanımı öyküsü var. Fetus açısından özellikle hangi anomali riski artar?",
        options: [
          "Konjenital glokom",
          "Omfalit",
          "Trakeoözofageal fistül zorunlu birlikteliği",
          "Nöral tüp defekti",
          "Bilateral renal agenezi",
        ],
        correctIndex: 3,
        explanation:
          "Valproat nöral tüp defekti ve nörogelişimsel sorun riskini artırır. Gebelik planlayan epilepsi hastalarında ilaç seçimi ve folat desteği önemlidir.",
      },
      {
        id: "public_mini_kucukstajlar_1365",
        subject: "Küçük Stajlar",
        topic: "Beyin Cerrahisi",
        difficulty: 4,
        questionText:
          "Ateş, sırt ağrısı ve nörolojik defisitli IV ilaç kullanıcısında epidural apse şüphesi var. Tanısal tuzaklar dışlandığında: En uygun görüntüleme hangisidir?",
        options: [
          "Kemik sintigrafisi",
          "LP",
          "Kontrastlı spinal MR",
          "EMG",
          "Direkt grafi",
        ],
        correctIndex: 2,
        explanation:
          "Spinal epidural apse için kontrastlı MR seçilir.",
      },
      {
        id: "public_mini_kucukstajlar_1420",
        subject: "Küçük Stajlar",
        topic: "Kulak Burun Boğaz",
        difficulty: 4,
        questionText:
          "Ani sensörinöral işitme kaybında erken yaklaşım değerlendiriliyor. Doğru seçenek hangisidir?",
        options: [
          "Kulak lavajı",
          "Tüp",
          "Sistemik/intratimpanik steroid",
          "Adenoidektomi",
          "Antikoagülan zorunlu",
        ],
        correctIndex: 2,
        explanation:
          "Ani SNİK'te erken steroid tedavisi kullanılır.",
      },
      {
        id: "public_mini_mikrobiyoloji_2769",
        subject: "Mikrobiyoloji",
        topic: "Genel Mikrobiyoloji",
        difficulty: 4,
        questionText:
          "Kronik öksürük, gece terlemesi ve kilo kaybı olan hastanın balgam örneğinde rutin Gram boyamada belirgin bakteri görülmüyor. Ancak aside dirençli boyamada kırmızı basiller saptanıyor. Bu boyama özelliği en çok hangi hücre duvarı bileşeniyle ilişkilidir?",
        options: [
          "Kapsül polisakkaridi",
          "Teikoik asit",
          "Mikolik asit",
          "Lipid A",
          "Ergosterol",
        ],
        correctIndex: 2,
        explanation:
          "Mycobacterium türlerinde hücre duvarındaki mikolik asit lipid açısından zengin bir yapı oluşturur. Bu nedenle Ziehl-Neelsen veya benzeri aside dirençli boyalarla gösterilir; sıradan Gram boyama ile kolay seçilemeyebilir.",
      },
      {
        id: "public_mini_mikrobiyoloji_2810",
        subject: "Mikrobiyoloji",
        topic: "Bakteriyoloji",
        difficulty: 4,
        questionText:
          "Peptik ülser nedeniyle endoskopi yapılan hastada antrum biyopsisinde spiral Gram negatif basil ve üreaz testi pozitifliği saptanıyor. Bu etkenin mide asidinde yaşayabilmesini sağlayan ana özellik hangisidir?",
        options: [
          "Kapsül polisakkaridi",
          "Üreaz ile amonyak üretimi",
          "Spor oluşturması",
          "Endotoksin lipid A kaybı",
          "Mikolik asit tabakası",
        ],
        correctIndex: 1,
        explanation:
          "Helicobacter pylori güçlü üreaz aktivitesiyle üreyi amonyağa çevirir ve lokal asit ortamını tamponlar. Gastrit, peptik ülser ve mide maligniteleriyle ilişkilidir.",
      },
      {
        id: "public_mini_patoloji_14",
        subject: "Patoloji",
        topic: "Hücre Zedelenmesi",
        difficulty: 5,
        questionText:
          "Apoptozisin intrensek (mitokondriyal) yolağında, sitozole salınan sitokrom c'nin bağlanarak apoptozom kompleksini oluşturduğu ve kaspaz-9'u aktive eden adaptör molekül aşağıdakilerden hangisidir?",
        options: [
          "Fas-associated death domain (FADD)",
          "Apoptotic protease activating factor-1 (Apaf-1)",
          "Bcl-2",
          "Smac/DIABLO",
          "Bax",
        ],
        correctIndex: 1,
        explanation:
          "Mitokondriden sitozole sızan sitokrom c, Apaf-1 (Apoptotic protease activating factor-1) adı verilen adaptör proteine bağlanır. Bu birleşme, hekzamerik yapıda bir 'apoptozom' kompleksi oluşturur ve pro-kaspaz 9'u klevajla aktif kaspaz-9'a dönüştürerek intrensek yolağı başlatır.",
      },
      {
        id: "public_mini_pediatri_1618",
        subject: "Pediatri",
        topic: "Neonatoloji",
        difficulty: 4,
        questionText:
          "Doğumdan hemen sonra term bir bebek zayıf soluyor, tonusu az ve kalp hızı 80/dk ölçülüyor. Kurulama, ısıtma ve havayolu pozisyonu sonrası spontan solunumu hâlâ yetersizdir. Bu aşamada en uygun ilk aktif girişim hangisidir?",
        options: [
          "Endotrakeal adrenalin uygulamak",
          "Pozitif basınçlı ventilasyona başlamak",
          "Göbek veninden sodyum bikarbonat vermek",
          "Derhal göğüs kompresyonu başlamak",
          "Nalokson uygulamak",
        ],
        correctIndex: 1,
        explanation:
          "Yenidoğan resüsitasyonunda apne/gasping veya kalp hızı <100/dk ise temel girişim pozitif basınçlı ventilasyondur. Kalp hızı <60/dk ancak etkin ventilasyona rağmen devam ederse kompresyon ve ileri tedaviler düşünülür.",
      },
      {
        id: "public_mini_pediatri_1686",
        subject: "Pediatri",
        topic: "Pediatrik Endokrinoloji ve Metabolizma",
        difficulty: 4,
        questionText:
          "Kız yenidoğanda ambigus genitalya, kusma, hiponatremi, hiperkalemi ve hipoglisemi saptanıyor. 17-hidroksiprogesteron yüksek bulunuyor. En olası enzim eksikliği hangisidir?",
        options: [
          "21-hidroksilaz eksikliği",
          "11-beta hidroksilaz eksikliği",
          "Aromataz eksikliği",
          "Fenilalanin hidroksilaz eksikliği",
          "Galaktoz-1-fosfat üridiltransferaz eksikliği",
        ],
        correctIndex: 0,
        explanation:
          "Konjenital adrenal hiperplazinin en sık nedeni 21-hidroksilaz eksikliğidir. Kortizol ve aldosteron sentezi azalır, ACTH artışı adrenal androjenleri artırır; tuz kaybettiren formda hiponatremi ve hiperkalemi görülür.",
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
