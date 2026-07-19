// Tusoskop SEO — branş (ders) verileri ve pazarlama sabitleri.
//
// Buradaki soru sayıları src/data/questionChunks/_manifest.json içindeki
// subjectCounts ile aynı olmalıdır. Örnek sorular doğrudan Tusoskop soru
// bankasından alınmış uzun klinik vaka sorularıdır (id alanı orijinal soru
// kimliğidir; soru/şık/açıklama metni bankayla birebir aynıdır).
//
// "topics": her dersin soru bankasındaki konu başlıkları (frekansa göre
// sıralı, soru sayısı gösterilmez). Soru bankasından türetilir; konu sayfası
// "konu konu çöz" bölümünde listelenir. (Dahiliye'deki "Geriartri" yazım
// hatası "Geriatri" altında birleştirilmiştir.)
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
    topics: [
      "Nöroanatomi",
      "Dolaşım",
      "Eklemler",
      "Kemikler",
      "Kaslar",
      "Ürogenital",
      "Anatomiye Giriş ve Terminoloji",
      "Sindirim",
      "Solunum",
      "Duyu",
    ],
    sample: {
      id: 6926,
      konu: "Dolaşım",
      q: "55 yaşında erkek hasta, eforla gelen göğüs ağrısı ve sol kola yayılan ağrı şikayetiyle acile başvuruyor. Koroner anjiyografide sol ön inen arterin (LAD) proksimal segmentinde ciddi darlık saptanıyor. Cerrahi ekip sol internal torasik arterin (LITA) kullanılacağı bypass operasyonu planlıyor. Ameliyat sırasında LITA hazırlanırken cerrahi asistan, sol subclavian arterin stenoz açısından değerlendirilmesi gerektiğini söylüyor. Sol subclavian arterin proksimalinde ciddi darlık olması halinde LITA grefti kullanılamaz, çünkü bu durumda bypass yapılan segmente kan akımının yönü ve yeterliliği tehlikeye girer. LITA'nın doğrudan ya da dolaylı beslendiği ana trunkus hangisidir?",
      options: [
        "Truncus brachiocephalicus",
        "Sol subclavian arter",
        "Sol common carotid arter",
        "Arcus aorta direkt dalı olarak LITA",
        "Thyrocervical truncus",
      ],
      correct: 1,
      exp: "LITA (sol internal torasik arter), sol subclavian arterin birinci bölümünden köken alır. Sol subclavian arterin proksimalinde ciddi stenoz varsa, LITA aracılığıyla LAD'a yapılan bypass greftine giden akım yetersiz kalır ya da subclavian steal fenomenine benzer bir fizyoloji ortaya çıkar; bu nedenle sol subclavian arter açıklığı LITA bypass'ı öncesinde kritik önem taşır. Sağ internal torasik arter ise truncus brachiocephalicus'tan ayrılan sağ subclavian arterden köken alır. Arcus aorta'dan LITA direkt çıkmaz; LITA her zaman sol subclavian arterin dalıdır.",
    },
  },
  {
    name: "Biyokimya",
    slug: "tus-biyokimya-sorulari",
    count: 468,
    topics: [
      "Karbonhidratlar",
      "Lipid Metabolizması",
      "Enzimler ve Klinik Biyokimya",
      "Proteinler",
      "Aminoasitler",
      "Hormon Metabolizması",
      "Nükleik Asitler ve Genom",
      "Vitaminler",
      "Hücre ve Organeller",
      "Metabolizma Organizasyonu",
    ],
    sample: {
      id: 6984,
      konu: "Lipid Metabolizması",
      q: "52 yaşında erkek hasta, son 6 aydır egzersiz toleransında belirgin azalma ve tekrarlayan karın ağrısı şikayetiyle başvuruyor. Özgeçmişinde tip 2 diyabet mevcut, metformin kullanıyor. Fizik muayenede hepatosplenomegali ve her iki dirsek çevresinde sarımsı renkli papüler lezyonlar saptanıyor. Açlık lipid paneli incelendiğinde trigliserid düzeyinin 4800 mg/dL olduğu görülüyor, HDL ise 18 mg/dL. Serum buzdolabında bir gece bekletildiğinde üstte kremsi tabaka oluştuğu, alttaki serumun ise bulanık kaldığı gözlemleniyor. Bu hastada görülen kutanöz lezyonların biyokimyasal altyapısını en doğru biçimde açıklayan lipid fraksiyonu hangisidir?",
      options: [
        "Şilomikron artıkları",
        "Şilomikronlar ve VLDL birlikteliği",
        "VLDL",
        "IDL",
        "LDL",
      ],
      correct: 1,
      exp: "Bu hastada tip 1 ve tip 5 hiperlipidemiyi düşündüren klasik bir tablo mevcut. Serum buzdolabı testi kritik ipucu veriyor: üstte kremsi tabaka oluşması şilomikron varlığını, altta kalan bulanıklık ise artmış VLDL'yi gösterir; bu patern tip 5 hiperlipoproteinemiyle uyumludur. Eruptif ksantomlar, trigliseridden zengin lipoproteinlerin, özellikle şilomikron ve VLDL'nin deride histiyositler tarafından fagosite edilmesiyle oluşur. Tip 2 diyabet, lipoprotein lipaz aktivitesini dolaylı yoldan baskılayarak hem endojen VLDL klirensini hem de eksojen şilomikron klirensini bozar; bu nedenle her iki fraksiyon da birikir. Şilomikron artıkları eruptif ksantom oluşturmaz, IDL ise tendinöz ksantomlarla daha sık ilişkilidir. LDL bu tabloda yüksek değildir. Hepatosplenomegali de trigliseridden zengin lipoproteinlerin retikülendotelyal sistem tarafından tutulumu sonucu gelişir.",
    },
  },
  {
    name: "Dahiliye",
    slug: "tus-dahiliye-sorulari",
    count: 1154,
    topics: [
      "Gastroenteroloji",
      "Kardiyoloji",
      "Nefroloji",
      "Hepatoloji",
      "Endokrinoloji",
      "Hematoloji",
      "Göğüs Hastalıkları",
      "Onkoloji",
      "Romatoloji",
      "Geriatri",
    ],
    sample: {
      id: 472,
      konu: "Romatoloji",
      q: "Yetmiş iki yaşında kadın hasta; sağ şakağında şiddetli ve zonklayıcı baş ağrısı, yemek yerken (çiğnerken) çenesinde yorulma/ağrı (çene klodikasyonu) ve bu sabah sağ gözünde aniden ortaya çıkıp 10 dakika sonra geçen geçici görme kaybı (Amaurosis fugax) şikayetiyle acile getiriliyor. Fizik muayenede sağ temporal arter kalınlaşmış, sert ve dokunmakla hassas saptanıyor. Laboratuvarda Sedimantasyon Hızı (ESR) 110 mm/saat ölçülüyor. Dev Hücreli Arterit (Temporal Arterit) düşünülen bu hastada, körlüğü önlemek için acil yüksek doz steroid başlanıyor. Steroide dirençli vakalarda veya steroidi azaltmak amacıyla kullanılan, hastalığın patogenezindeki ana sitokini hedefleyen 'Tosilizumab (Tocilizumab)' adlı monoklonal antikor aşağıdaki sitokinlerden hangisini bloke eder?",
      options: [
        "Tümör Nekrozis Faktör-alfa (TNF-alfa)",
        "İnterlökin-1 (IL-1)",
        "İnterlökin-6 (IL-6)",
        "İnterlökin-17 (IL-17)",
        "İnterferon-gama (IFN-gama)",
      ],
      correct: 2,
      exp: "Dev Hücreli Arterit, büyük damarları (Aort ve dalları, özellikle karotis ekstra-kraniyal dalları) tutan ve körlük (iskemik optik nöropati) riski taşıyan acil bir vaskülittir. Polimiyaljiya Romatika ile sık birliktedir. Tanı için temporal arter biyopsisi (dev hücreli granülomatöz inflamasyon) yapılır ama biyopsi sonucu beklenmeden steroid başlanmalıdır. Hastalığın inflamasyon motorunu, T hücrelerinden ve makrofajlardan salınan 'İnterlökin-6 (IL-6)' oluşturur. Yüksek sedimantasyon ve CRP de doğrudan IL-6'nın karaciğeri uyarmasıyla oluşur. Bu nedenle güncel kılavuzlarda steroid dozunu azaltmak (steroid-sparing) ve dirençli vakaları tedavi etmek için IL-6 reseptör blokörü olan 'Tosilizumab' kullanılır.",
    },
  },
  {
    name: "Farmakoloji",
    slug: "tus-farmakoloji-sorulari",
    count: 617,
    topics: [
      "Kardiyovasküler Sistem Farmakolojisi",
      "Santral Sinir Sistemi Farmakolojisi",
      "Endokrin Sistem Farmakolojisi",
      "Otonom Sinir Sistemi Farmakolojisi",
      "Kemoterapötikler ve İmmünomodülatörler",
      "Genel Farmakoloji",
      "Otokoidler ve NSAİİ",
      "Diğer Sistem İlaçları",
    ],
    sample: {
      id: 800,
      konu: "Kardiyovasküler Sistem Farmakolojisi",
      q: "Hipertansiyon ve Kalp Yetmezliği tedavisi alan 60 yaşındaki erkek hasta, son 1 aydır geceleri uykudan uyandıran, boğazında gıcık hissi veren şiddetli, inatçı ve 'kuru' (balgamsız) bir öksürük şikayetiyle başvuruyor. Göğüs hastalıkları muayenesinde akciğerler tamamen temiz bulunuyor. Hastanın kullandığı ilaçlar incelendiğinde, bu yan etkinin bir Anjiyotensin Dönüştürücü Enzim (ACE) İnhibitörü olan 'Kaptopril'den kaynaklandığı düşünülüyor. ACE inhibitörlerinin bu karakteristik kuru öksürüğe (ve nadiren ölümcül anjiyoödeme) yol açmasının farmakolojik nedeni aşağıdakilerden hangisinin akciğerde YIKILAMAYIP birikmesidir?",
      options: [
        "Angiotensin I",
        "Angiotensin II",
        "Bradikinin",
        "Aldosteron",
        "Renin",
      ],
      correct: 2,
      exp: "ACE İnhibitörleri (-pril ile bitenler), Anjiyotensin I'i, vazokonstriktör olan Anjiyotensin II'ye çeviren (ve tansiyonu fırlatan) Anjiyotensin Dönüştürücü Enzimi (ACE) bloke ederler. Ancak bu ACE enzimi, vücutta 'Kininaz II' adıyla da bilinir. Bu enzimin ikinci ve çok önemli görevi, akciğerlerde üretilen inflamatuar ve damar genişletici bir peptid olan 'Bradikinin'i yıkmaktır. Siz ACE'yi bloke ettiğinizde, Bradikinin yıkılamaz ve akciğerlerde (ve ciltte) birikir. Akciğerde biriken bradikinin bronşları irrite ederek meşhur ve inatçı 'Kuru Öksürüğü' (%10-20 hasta) yapar. Damarları genişletip ödem yarattığı için nadiren boğazı tıkayan ölümcül 'Anjiyoödem'e yol açar. Çözüm: İlacı kesip ARB (-sartan) grubuna geçmektir.",
    },
  },
  {
    name: "Fizyoloji",
    slug: "tus-fizyoloji-sorulari",
    count: 1234,
    topics: [
      "Sinir Sistemi HistoFizyolojisi",
      "Kas Dokusu HistoFizyolojisi",
      "Solunum Sistemi HistoFizyolojisi",
      "Kardiyovasküler Sistem HistoFizyolojisi",
      "Endokrin ve Genital Sistem HistoFizyolojisi",
      "Üriner Sistem HistoFizyolojisi",
      "Gastrointestinal Sistem HistoFizyolojisi",
      "Hematopoetik Sistem HistoFizyolojisi",
      "Hücre Histolojisi ve Fizyolojisi",
      "Genital Sistem HistoFizyolojisi",
      "Genel Embriyoloji",
      "Doku Histolojisi ve Fizyolojisi",
      "Baş Boyun Embriyolojisi",
    ],
    sample: {
      id: 6043,
      konu: "Endokrin ve Genital Sistem HistoFizyolojisi",
      q: "Yirmi sekiz yaşında bir erkek hasta, son iki yıldır devam eden infertilite şikayetiyle üroloji polikliniğine başvuruyor. Hastanın semen analizinde sperm sayısı ve motilitesi belirgin şekilde düşük bulunuyor. Fizik muayenede bilateral testis hacmi normal, ikincil cinsiyet karakterleri gelişmiş. Serum FSH yüksek, LH normal, testosteron normal sınırlarda. Testis biyopsisinde Sertoli hücrelerinin sayıca yeterli olduğu ancak lümene doğru uzanan sitoplazmik çıkıntıların kaybolduğu ve komşu spermatojenik hücrelerle bağlantı komplekslerinin bozulduğu saptanıyor. Bu hastada infertilitenin temel mekanizması aşağıdakilerden hangisidir?",
      options: [
        "Sertoli hücrelerinden inhibin sekresyonunun artışına bağlı FSH baskılanması",
        "Kan-testis bariyerinin yapısal bütünlüğünün bozulmasıyla spermatositlerin immün saldırıya uğraması",
        "Leydig hücresi disfonksiyonu sonucu intratestikülär testosteron eksikliği",
        "Spermatogonyumların bazal membrana tutunma kaybı nedeniyle erken apoptozise gitmesi",
        "GnRH pulsatil sekresyonunun bozulmasına bağlı hipogonadotropik yetmezlik",
      ],
      correct: 1,
      exp: "Bu vakada FSH yüksek, LH ve testosteron normal olması Leydig hücre fonksiyonunun korunduğunu gösterir; bu durum hipogonadotropik yetmezliği ve Leydig disfonksiyonunu dışlar. Sertoli hücrelerinin sitoplazmik çıkıntılarının ve komşu hücrelerle bağlantı komplekslerinin kaybı, kan-testis bariyerinin bozulduğuna işaret eder. Bu bariyer; Sertoli hücreleri arasındaki sıkı bağlantılar, gap bağlantılar ve desmozomlardan oluşur ve mezotubüler kompartmanı lüminal kompartmandan ayırarak primer spermatositleri ve daha ileri evredeki germ hücrelerini immünolojik açıdan ayrıcalıklı bir ortamda korur. Bariyerin bozulması, normalde immün sisteme yabancı olan meyoza girmiş spermatositlerin otoimmün saldırıya maruz kalmasına yol açar ve spermatogenez bu aşamada bloke olur. FSH'ın yükselmesi ise işlevsel Sertoli hücresi azlığına ya da inhibin sekresyon kaybına ikincil gelişen kompansatuar bir yanıttır, primer neden değildir.",
    },
  },
  {
    name: "Genel Cerrahi",
    slug: "tus-genel-cerrahi-sorulari",
    count: 530,
    topics: [
      "Kolon Rektum Hastalıkları",
      "Meme Hastalıkları",
      "Tiroid ve Paratiroid Hastalıkları",
      "Safra yolları Hastalıkları",
      "Pankreas Hastalıkları",
      "Karaciğer Hastalıkları ve Portal HT",
      "Mide Hastalıkları ve Morbid Obezite",
      "Akut Batın",
      "İnce Barsak Hastalıkları",
      "Özefagus Hastalıkları",
      "Şok",
      "GIS Kanamaları",
      "Hemostaz ve Kan Transfüzyonu",
      "Travma ve Travma Hastasına Yaklaşım",
      "Perianal Hastalıklar",
      "Cerrahi Enfeksiyonlar ve Komplikasyonlar",
      "Mezenterik Hastalıklar",
      "Yanık",
      "Apendiks Hastalıkları",
      "Beslenme",
      "Adrenal Bez Hastalıkları",
      "Asit Baz Bozuklukları",
      "Karın Duvarı ve Herniler",
      "Transplantasyon",
      "Deri Hastalıkları",
      "İntestinal Tıkanıklıklar ve GİS Fistülleri",
      "Dalak Hastalıkları",
      "Yara İyileşmesi",
      "Travmaya Sistemik Cevap",
    ],
    sample: {
      id: 303,
      konu: "Tiroid ve Paratiroid Hastalıkları",
      q: "Kırk beş yaşında kadın hasta, böbrek taşı, yaygın kemik ağrıları, konstipasyon (kabızlık) ve depresyon şikayetleriyle başvuruyor ('Stones, bones, abdominal groans, psychiatric overtones'). Kan tetkiklerinde Serum Kalsiyum: 11.5 mg/dL (Yüksek), Fosfor: 2.2 mg/dL (Düşük) ve İntakt Parathormon (iPTH): 150 pg/mL (Yüksek) saptanıyor. Sestamibi sintigrafisinde sağ alt paratiroid bezinde adenom tespit ediliyor. Cerrahi eksplorasyonda sadece sağ alt paratiroid bezi çıkarılıyor. Cerrahiden 2 gün sonra hastanın sesinin kalıcı olarak kısık ve çatallı olduğu (hoarseness) fark ediliyor. Bu cerrahi komplikasyonda hasar gören sinir ve vokal kordun aldığı pozisyon aşağıdakilerden hangisidir?",
      options: [
        "Eksternal Laringeal Sinir (Superior Laringeal Sinirin dalı) / Kordlar tamamen açık (abduksiyon) kalır",
        "Sağ Rekürren Laringeal Sinir / Sağ vokal kord orta hattın hemen yanında (paramedian) felçli kalır",
        "Sol Rekürren Laringeal Sinir / Her iki vokal kord orta hatta (median) felçli kalır",
        "İnternal Laringeal Sinir / Kordlar spastik şekilde birleşir",
        "Vagus siniri ana gövdesi / Glottik bölge tamamen çöker",
      ],
      correct: 1,
      exp: "Primer Hiperparatiroidi tedavisinde adenom çıkarılırken (paratiroidektomi) veya tiroidektomide en çok korkulan komplikasyon sinir kesileridir. Tiroide komşu seyreden 'Rekürren Laringeal Sinir (RLN)' vokal kordların hareketini sağlayan ana motordur. Tek taraflı RLN kesisi (vakamızda ameliyat olan sağ taraf) durumunda o taraftaki vokal kord orta hattın hafif yanında (Paramedian pozisyon) hareketsiz kalır. Karşı taraf (sağlam) kord gelip ona çarparak sesi çıkarır ancak hava kaçtığı için ses 'kısık, havalı ve çatallı (hoarseness)' çıkar. Eğer sinir ÇİFT TARAFLI (bilateral) kesilirse iki kord da paramedian kapanır, hasta nefes alamaz ve acil trakeostomi gerekir.",
    },
  },
  {
    name: "Kadın Hastalıkları ve Doğum",
    slug: "tus-kadin-dogum-sorulari",
    count: 506,
    topics: [
      "Perinatoloji",
      "Jinekoloji",
      "Onkoloji",
      "İnfertilite",
    ],
    sample: {
      id: 1089,
      konu: "Onkoloji",
      q: "Otuz yaşında kadın hasta, bir haftadır giderek artan psikiyatrik semptomlar (hezeyanlar, halüsinasyonlar), hafıza kaybı, yüzde istemsiz hareketler (diskinezi) ve ardından gelişen nöbet/koma tablosuyla acile getiriliyor. BOS incelemesinde lenfositik pleositoz ve Spesifik Antikorlar (Anti-NMDA reseptör antikorları) saptanıyor. Anti-NMDA Reseptör Ensefaliti (otoimmün ensefalit) tanısı alan hastanın tüm vücut taramasında overde (yumurtalıkta) bir kitle tespit ediliyor. Tümörün ameliyatla çıkarılması hastanın nörolojik tablosunu hızla iyileştiriyor. Bağışıklık sisteminin beyni 'yanlışlıkla' düşman sanıp saldırmasına (Paraneoplastik Sendrom) neden olan şey, bu over tümörünün İÇİNDE saç ve yağ ile birlikte HANGİ olgun (matür) embriyolojik dokuyu barındırmasıdır?",
      options: [
        "Tiroglobulin sentezleyen tiroid folikülleri",
        "NMDA reseptörleri barındıran olgun sinir (nöral/glial) dokusu",
        "Trofoblastik koryon villusları",
        "Adrenal korteks hücreleri",
        "Yassı (skuamöz) epitel adacıkları",
      ],
      correct: 1,
      exp: "Anti-NMDA Reseptör Ensefaliti, özellikle genç kadınlarda görülen, psikiyatriyi ve nörolojiyi şaşkına çeviren (şizofreni sanılarak akıl hastanesine yatırılan) ölümcül bir otoimmün fırtınadır. Vakaların yaklaşık %50'sinde altta yatan (karnın içinde saklı) bir over tümörü, yani 'Matür Kistik Teratom (Dermoid Kist)' bulunur. Teratom, 3 germ yaprağını (ektoderm, mezoderm, endoderm) da içeren, içinde saç, diş, yağ ve SİNİR DOKUSU (beyin hücreleri) barındıran bir canavardır. Yumurtalıktaki bu teratomun içinde oluşan 'olgun nöral doku' üzerinde doğal olarak 'NMDA Reseptörleri' bulunur. Bağışıklık sistemi overdeki bu yabancı beyin hücrelerini fark eder ve onlara karşı (Anti-NMDA) antikor üretir. Bu antikorlar kana karışır, Kan-Beyin Bariyerini geçer ve hastanın GERÇEK BEYNİNDEKİ NMDA reseptörlerine saldırarak onu komaya sokar. Tümör (teratom) kesilip alındığında hedef/antijen kaynağı yok olur ve hasta mucizevi bir şekilde uyanır.",
    },
  },
  {
    name: "Küçük Stajlar",
    slug: "tus-kucuk-stajlar-sorulari",
    count: 900,
    topics: [
      "Psikiyatri",
      "Anestezi",
      "Nöroloji",
      "Kulak Burun Boğaz",
      "Ortopedi",
      "Halk Sağlığı",
      "Dermatoloji",
      "Radyoloji",
      "Çocuk Cerrahisi",
      "Fizik Tedavi ve Rehabilitasyon",
      "Göz Hastalıkları",
      "Beyin Cerrahisi",
      "Üroloji",
    ],
    sample: {
      id: 242,
      konu: "Dermatoloji",
      q: "Kırk beş yaşında kadın hasta, aylar önce ağız içinde başlayan ve geçmeyen ağrılı yaralardan (oral ülser) sonra, şimdi de gövdesinde ortaya çıkan içi su dolu gevşek kabarcıklar (büller) ile başvuruyor. Muayenede büllerin kolayca patlayıp kanamalı, çıplak (eroze) alanlar bıraktığı; ayrıca sağlam gibi görünen cilde parmakla hafifçe sürtüldüğünde üst derinin kolayca soyulup kalktığı (Nikolsky bulgusu pozitif) saptanıyor. Deri biyopsisinin immünfloresan incelemesinde hücreler arasında 'balık ağı' (intercellular) şeklinde IgG ve C3 birikimi izleniyor. Bu ölümcül seyredebilen otoimmün büllöz hastalıkta (Pemfigus Vulgaris), otoantikorların parçaladığı epidermal bağlantı kompleksi aşağıdakilerden hangisidir?",
      options: [
        "Hemidesmozom (Bülloz Pemfigoid Antijeni 1 ve 2)",
        "Desmozom (Desmoglein 1 ve 3)",
        "Adherens kavşaklar (E-kaderin)",
        "Sıkı kavşaklar (Tight junctions - Claudin)",
        "Fokal adezyon kompleksleri (İntegrin)",
      ],
      correct: 1,
      exp: "Vaka klasik Pemfigus Vulgaris'tir. Ağız lezyonlarıyla başlar, gevşek (flaksid) büller yapar ve Nikolsky pozitiftir (deri kolayca sıyrılır). Patogenezde; epidermiste keratinositleri 'birbirine' yan yana bağlayan yapılar olan 'Desmozom'lara (spesifik olarak Desmoglein 1 ve 3 proteinlerine) karşı IgG antikorları gelişir. Hücreler birbirinden ayrılır (Akantoliz) ve intraepidermal büller oluşur. İmmünfloresanda hücreleri çevreleyen 'balık ağı/tavuk teli' görünümü tipiktir. (Not: Bülloz Pemfigoid'de antikorlar epidermisi dermise, yani alt tabakaya bağlayan 'Hemidesmozom'lara saldırır, Nikolsky negatiftir ve büller gergindir).",
    },
  },
  {
    name: "Mikrobiyoloji",
    slug: "tus-mikrobiyoloji-sorulari",
    count: 1035,
    topics: [
      "Bakteriyoloji",
      "Viroloji",
      "İmmünoloji",
      "Genel Mikrobiyoloji",
      "Klinik Mikrobiyoloji",
      "Parazitoloji",
      "Mikoloji",
    ],
    sample: {
      id: 1051,
      konu: "Klinik Mikrobiyoloji",
      q: "Kontrolsüz diyabeti ve alkolizm öyküsü olan 55 yaşındaki erkek hasta, yüksek ateş, sağ üst kadran ağrısı ve sarılık şikayetiyle başvuruyor. Batın tomografisinde karaciğer sağ lobunda devasa bir apse saptanıyor. Apse drenajından yapılan kültürde, Gram-negatif, hareketsiz ve laktoz fermente eden basiller ürüyor. Koloniye öze dokundurulup çekildiğinde 5 cm'den uzun yapışkan bir iplik (Pozitif String Testi) oluşuyor. Hipermukovisköz Klebsiella pneumoniae (K1 serotipi) izole edilen bu vakada, bakterinin fagositozdan kaçıp karaciğer gibi uzak organlara apse yapabilmesi (İnvaziv Sendrom), sahip olduğu o devasa mukoid yapının konak bağışıklık sistemindeki HANGİ molekülün bakteri yüzeyine tutunmasını (birikmesini) fiziksel olarak engellemesine dayanır?",
      options: [
        "İmmünglobulin M (IgM) pentamerleri",
        "Kompleman C3b parçası (Opsonin)",
        "Mannoz Bağlayıcı Lektin (MBL)",
        "CD8+ T hücre reseptörü (TCR)",
        "Membran Atak Kompleksi (MAC)",
      ],
      correct: 1,
      exp: "Klebsiella pneumoniae normalde lober pnömoni ve İYE etkenidir. Ancak Asya kökenli 'Hipermukovisköz K1/K2' serotipleri, inanılmaz kalın ve yapışkan bir polisakkarit kapsüle sahiptir (String/İplik testi pozitifliği bunu gösterir). Bu kalın kapsül, bakteriyi bağışıklık sisteminden adeta görünmez kılar. Makrofajların bakteriyi yutabilmesi için bakterinin üzerine 'C3b' (opsonin) dökülmesi şarttır. Ancak bu devasa kapsül, C3b'nin bakteri duvarına çökmesini (birikmesini) FİZİKSEL OLARAK ENGELLER. Opsonize edilemeyen bakteri kanda serbestçe dolaşarak karaciğer apsesi, endoftalmit ve menenjit gibi yıkıcı metastatik enfeksiyonlar yapar.",
    },
  },
  {
    name: "Patoloji",
    slug: "tus-patoloji-sorulari",
    count: 1003,
    topics: [
      "İmmünoloji",
      "Gastrointestinal Sistem Hastalıkları",
      "Hemodinamik Bozukluklar",
      "Hücre Zedelenmesi",
      "Hematopoetik Sistem Hastalıkları",
      "Karaciğer Hastalıkları",
      "Pankreas Hastalıkları",
      "Üriner Sistem Hastalıkları",
      "Onarım ve Yara İyileşmesi",
      "İnflamasyon",
      "Solunum Sistem Hastalıkları",
      "Endokrin Sistem Hastalıkları",
      "Çevresel ve Enfeksiyoz Hastalıklar",
      "Erkek Genital Sistem Hastalıkları",
      "Kadın Genital Sistem Hastalıkları",
      "Neoplazi",
      "Pediatrik Hastalıklar",
      "Kalp Hastalıkları",
      "Vasküler Hastalıklar",
      "Meme Hastalıkları",
      "Sinir Sistem Hastalıkları",
      "Kalp ve İskelet Sistemi Hastalıkları",
      "Genel Tekrar ve Entegre Vakalar",
      "Deri Hastalıkları",
    ],
    sample: {
      id: 6605,
      konu: "Hücre Zedelenmesi",
      q: "62 yaşında erkek hasta, 3 yıldır tip 2 diyabeti nedeniyle metformin kullanmaktadır. Yakın zamanda başlayan kronik böbrek yetmezliği tanısıyla nefroloji kliniğine yatırılan hastanın GFR değeri 18 mL/dk/1.73m² olarak saptanmış ve metformin kesilmiştir. Hastaya yeni antidiyabetik tedavi planlanırken kardiyoloji konsültasyonu istenmiş; EKG'de ST çökmesi ve T negatifleşmesi saptanarak koroner anjiyografi yapılmış, sol ön inen arterde %90 darlık tespit edilmiştir. Hasta acil perkütan koroner girişim ile revaskülarize edilmiştir. İşlem sonrası çekilen ekokardiyografide, iskemik bölgede sistolik fonksiyon kaybı olmakla birlikte hücre ölümüne ait bulgu saptanmamıştır. Kardiyak biyomarkerlar minimal düzeyde yükselmiş, 48 saat içinde normale dönmüştür. Takip ekokardiyografilerinde ise revaskülarizasyondan yaklaşık 2 hafta sonra bölgesel duvar hareketlerinin kademeli olarak düzeldiği görülmüştür. Bu hastada revaskülarizasyon öncesi iskemik miyokard için en doğru olan hangisidir?",
      options: [
        "Hücreler geri dönüşümsüz zedelenme eşiğini geçmiş olup reperfüzyon hasarı gelişmiştir",
        "Hücreler geri dönüşümlü zedelenme evresinde kalmış olup kontraktil fonksiyon zamanla düzelecektir",
        "İskemik bölgede koagülatif nekroz gelişmiş ancak fibrozisle onarım başlamıştır",
        "Miyositlerde apoptoz aktivasyonu olmuş, fakat inflamatuvar yanıt baskılandığı için biyomarkerlar yükselmemiştir",
        "Reperfüzyon sonrası kalsiyum birikimi ile mitokondriyal permeabilite geçiş porları kalıcı olarak açılmıştır",
      ],
      correct: 1,
      exp: "Bu klinik tablo 'hibernating myocardium' yani uyuyan miyokard olgusunu tanımlamaktadır. Uzun süreli düşük düzeyli iskemiye maruz kalan miyositler, enerji tüketimini kısıtlamak amacıyla kontraktil aktivitelerini geri dönüşümlü biçimde azaltır; bu durum hücre ölümü olmaksızın fonksiyon kaybı şeklinde kendini gösterir. Biyomarkerların minimal yükselmesi ve kısa sürede normalize olması geri dönüşümlü zedelenmeyle uyumludur; geri dönüşümsüz zedelenmede troponin yüksekliği daha belirgin ve kalıcıdır. Revaskülarizasyon sonrası haftalarca süren kademeli fonksiyon düzelmesi de bu tanıyı doğrular. Seçenek A yanlıştır çünkü geri dönüşümsüz hasar sonrası reperfüzyon fonksiyon düzelmesini değil ek zedelenmeyi beraberinde getirir. Seçenek C yanlıştır; fibrozisle sonuçlanan koagülatif nekroz varlığında kontraktil iyileşme gözlenmez. Seçenek D yanlıştır; apoptoz da bir hücre ölümü biçimidir ve biyomarker yükselmesiyle seyreder. Seçenek E yanlıştır; mitokondriyal permeabilite geçiş porlarının kalıcı açılması geri dönüşümsüz hücre hasarının göstergesidir ve klinik tabloya uymaz.",
    },
  },
  {
    name: "Pediatri",
    slug: "tus-pediatri-sorulari",
    count: 2028,
    topics: [
      "Pediatrik Nöroloji",
      "Neonatoloji",
      "Pediatrik Hematoloji ve Onkoloji",
      "Pediatrik Enfeksiyon Hastalıkları",
      "Pediatrik Gastroenteroloji",
      "Pediatrik Kardiyoloji",
      "Pediatrik Aciller, Zehirlenmeler ve Yoğun Bakım",
      "Pediatrik Göğüs Hastalıkları",
      "Pediatrik Nefroloji",
      "Pediatrik Endokrinoloji ve Metabolizma",
      "Büyüme ve Gelişme",
      "Pediatrik İmmünoloji/Alerji",
      "Beslenme",
      "Pediatrik Romatoloji",
      "Genetik",
    ],
    sample: {
      id: 545,
      konu: "Pediatrik Hematoloji ve Onkoloji",
      q: "Üç yaşında kız çocuk, ateş ve bacak ağrıları (kemik ağrısı) şikayetiyle başvuruyor. Fizik muayenesinde solukluk, yaygın lenfadenopati ve splenomegali saptanıyor. Hemogramda Lökosit: 45.000 /mm3, Hemoglobin: 7.0 g/dL ve Trombosit: 25.000 /mm3 bulunuyor. Periferik yaymada nükleolleri belirgin olmayan, dar sitoplazmalı, agranüler blast hücreleri görülüyor. Kemik iliği aspirasyonunda %85 oranında lenfoblast (TdT ve CD10 pozitif) saptanarak Akut Lenfoblastik Lösemi (ALL) tanısı konuyor. Çocukluk çağının en sık kanseri olan ALL'nin standart kemoterapi protokolünde, kan-beyin bariyerini geçemeyen ilaçlara bağlı santral sinir sistemi nükslerini (relaps) önlemek için TÜM hastalara rutin olarak uygulanan profilaksi aşağıdakilerden hangisidir?",
      options: [
        "Profilaktik tüm beyin ışınlaması (Kranial Radyoterapi)",
        "İntravenöz yüksek doz İmmünglobulin (IVIG)",
        "İntratekal Metotreksat (BOS içine kemoterapi)",
        "Oral İmatinib (Tirozin kinaz inhibitörü)",
        "İntravenöz Rituksimab",
      ],
      correct: 2,
      exp: "Akut Lenfoblastik Lösemi (ALL), çocuklarda en sık görülen lösemi ve kanser türüdür. Blastların TdT (Terminal deoksinükleotidil transferaz) ve CALLA (CD10) pozitif olması tipiktir. ALL blastları, kemoterapi ilaçlarının ulaşamadığı 'Korunaklı Bölgelere (Sanctuary sites)' saklanmayı çok sever. Bu iki ana bölge Santral Sinir Sistemi (BOS) ve Testislerdir. Eğer önlem alınmazsa, ilik tamamen temizlense bile aylar sonra beyinden veya testisten nüks (relaps) olur. Bu nedenle, tanı anında BOS'ta blast görülsün veya görülmesin, ALL tedavisi alan HER ÇOCUĞA 'İntratekal (belden su alma iğnesiyle) Metotreksat' verilerek MSS profilaksisi yapılması altın kuraldır.",
    },
  },
];

// Soru bankasındaki toplam soru sayısı (branş sayımlarının toplamı).
export const TOTAL_QUESTIONS = SUBJECTS.reduce((sum, s) => sum + s.count, 0);

// Ders (branş) sayısı.
export const LESSON_COUNT = SUBJECTS.length;

// Pazarlama "X+" kuralı: gerçek soru sayısını bir alt yüzlüğe yuvarlar.
// Hiçbir zaman gerçek sayının üzerine çıkmaz → iddia her zaman doğrulanabilir.
//   10061 → 10000  |   10200 → 10100  |   10100 → 10000
export function flooredHundred(n = TOTAL_QUESTIONS) {
  const floored = Math.floor(n / 100) * 100;
  return n % 100 === 0 ? floored - 100 : floored;
}

// "10.000+" biçiminde pazarlama etiketi.
export function questionCountLabel(n = TOTAL_QUESTIONS) {
  return `${flooredHundred(n).toLocaleString("tr-TR")}+`;
}
