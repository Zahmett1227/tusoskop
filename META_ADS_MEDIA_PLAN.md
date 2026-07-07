# Tusoskop · Meta Medya Planı · Temmuz → Eylül 2026

> **Bu, projenin ASIL NİHAİ Meta Ads planıdır.** Atılan her adım (kampanya kurulumu, bütçe, kreatif, hedefleme, optimizasyon hedefi seçimi) bu plana göre olmalı. Küçük aksilikler (örn. düşük performans nedeniyle bir reklamın durdurulması) planın dışına çıkmak değildir — plan zaten guardrail'lerle bunu öngörüyor. Ama yapısal kararlar (yeni kampanya açmak, optimizasyon hedefi değiştirmek, bütçe dağıtımı) bu belgeye göre değerlendirilmeli.
>
> `META_ADS_CAMPAIGN_LOG.md` bu planın **uygulama günlüğü**dür (kronolojik, session-by-session ilerleme). Bu dosya ise **hedef mimari/strateji**dir — ikisi birbirini tamamlar, biri "ne yapmalıyız", diğeri "ne yaptık".
>
> Hazırlık tarihi: 4 Temmuz 2026. Veri kaynağı: Meta hesabı (son 90 gün) + pixel akışı + Reklam Kütüphanesi.
> **Hedef: haftada 3–5 web satışı ile başabaş döngü.**

## 01 — Durum: sorun ürün değil, sinyal

Son 90 günün beş kampanyasının tamamı Trafik veya Bilinirlik hedefliydi. Meta'ya bir kez bile "bana kayıt olan / satın alan bul" denmedi; o da en ucuz tıklayıcıyı bulup getirdi. Rakamlar bunun dışında iyi haber veriyor: kreatif kancası çalışıyor, tıklama ucuz, pazar Meta'da neredeyse boş.

| Bulgu | Değer | Okuma |
|---|---|---|
| 90 günlük toplam harcama | ₺5.015 | 5 kampanyaya bölünmüş — hiçbiri dönüşüm hedefli değil |
| Boost edilen post | ₺2.882 · %1,02 CTR · ₺7,70 CPC | Paranın %57'si en kötü reklamda yandı |
| Quiz funnel reklamı (/coz) | %4,85 CTR · ₺0,66 CPC | Kreatif-mesaj eşleşmesi kanıtlandı |
| Vaka soru postu | %3,17 CTR · ₺0,77 CPC | Vaka formatı ikinci kez doğrulandı |
| Pixel kurulumu | 27 Haziran 2026 | Bugüne dek dönüşüm optimizasyonu fiziken imkânsızdı |
| Funnel (3–4 Temmuz) | 230 → 39 → 11 → 5 | Görüntüleme → başlama (%17) → tamamlama → App Store tık |
| Web kayıt / satış (28 gün) | 1 kayıt · 0 satış | Kullanıcı App Store'da kayboluyor; ölçülebilir gelir yolu kapalı |
| Rekabet ("TUS soru bankası", TR) | 8 aktif reklam | Açık artırma ucuz (CPM ₺24–35), pazar kazanılabilir |

Rakiplerin şu an dönen reklamlarındaki ortak dil dikkat çekici: MD Kampüs "Mart TUS'unda 49 soruya referans oldu", Kunduz "İlk 100'de 39 öğrenci" satıyor. Tutan reklamlar özellik değil, kanıt ve sonuç satıyor. Tusoskop'un 7.000+ sorusu ve FSRS'i var ama vitrininde henüz kanıt yok — plan bunu da üretiyor.

## 02 — Strateji çatısı: üç ilke, bir merdiven, bir formül

**İlke 1 — Satış web'de biter.** Ölçülebilir tek gelir PayTR web ödemesi. Ücretli trafik daima web funnel'a iner; App Store ikincil buton olur. iOS uygulaması elde tutma kanalıdır, edinim kanalı değil.

**İlke 2 — Sinyal merdiveni.** Meta'ya her zaman haftada ~50 kez gerçekleşen en derin olayı optimizasyon hedefi olarak ver. Hacim büyüdükçe bir basamak in; asla iki basamak atlama.

```
QuizComplete (bugün buradasın) → CompleteRegistration (haftada 50 kayıt olunca) → Purchase (haftada 25+ satış olunca; retarget hariç)
```

**İlke 3 — Sezonla yaşa.** TUS yılda iki sprint demektir: Temmuz→Eylül ve Aralık→Şubat. Ara dönemde bütçe minimuma iner, içerik ve SEO çalışır. Düz çizgi harcama bu pazarda para yakar.

**Kendi kendini döndürme eşiği.** Ortalama sepet ~₺200 varsayımıyla (₺89,9 / ₺209,7 / ₺359,4 karması):
```
haftalık reklam harcaması ≤ haftalık yeni satış × ₺200 + yenilemeler
```
₺150/gün planında eşik: haftada ~5 satış · ₺300/gün planında: haftada ~10 satış

## 03 — Kampanya mimarisi: 10 fikir, 4 kampanya

On fikrin her biri ayrı kampanya değildir — bu bütçede beş paralel kampanya açmak, parayı beşe bölüp hiçbirini öğrenme fazından çıkarmamak demek. Fikirler dört kampanyalık bir çatıya oturur; çoğu, çekirdek kampanyanın içinde yarışan kreatif programlarıdır. Meta en iyisine bütçeyi kendi kaydırır.

| Kampanya | Hedef / optimizasyon | İçindeki fikirler | Bütçe payı |
|---|---|---|---|
| **C1 — Çekirdek dönüşüm (sürekli)** | Satış hedefi · QuizComplete → sonra CompleteRegistration | K2 · K3 · K4 · K7 · K9 | %55–60 |
| **C2 — Mini TUS etkinliği (haftalık)** | Satış hedefi · MiniTusComplete | K1 | %20–25 |
| **C3 — Retarget & satış (sürekli)** | Satış hedefi · Purchase (dar sıcak kitle) | K5 · K6 · K8 | %20 |
| **C4 — Sezon kanıt sprinti (Eylül)** | Satış hedefi · CompleteRegistration | K10 | Sınav sonrası C1'in yerine |

Hedefleme her yerde aynı ve sıkıcı: Türkiye, 20–33 yaş, Advantage+ açık, ilgi alanı daraltması yok. Bu kadar niş bir üründe daraltmayı kreatif yapar ("62 yaşında erkek hasta…" yazan reklamı tıp öğrencisinden başkası tıklamaz) — Meta'nın algoritmasına alan bırak.

**⚠️ Önemli mimari not:** K1 (Mini TUS), plana göre **C2'nin içinde, ayrı bir kampanya** olmalı — C1'in içinde DEĞİL. C1 sadece K2/K3/K4/K7/K9'u içermeli.

## 04 — 10 kampanya fikri, detaylı plan

### K1 — Türkiye Geneli Mini TUS — haftalık canlı deneme
*Etkinlik · C2 · Amiral gemisi*

**Kanca:** "Bu pazar 21.00'de Türkiye geneli ücretsiz Mini TUS. 20 soru, 25 dakika. Eylül'den önce nerede olduğunu öğren." Sonraki haftalar: "Geçen hafta 412 kişi girdi. Bu hafta patoloji ağırlıklı."

**Format:** 4:5 statik afiş (lacivert #070c18 + emerald, mevcut SVG→Chrome PNG hattıyla) + 10 sn geri sayımlı Reels. Her hafta tarih ve ders vurgusu değişir — kreatif kendini yeniler.

**Kurgu:** C2 kampanyası, Satış hedefi, özel dönüşüm MiniTusComplete. Perşembe–pazar yayın, pazartesi–çarşamba kapalı (bütçe yoğunlaştırma). Katılımcılar otomatik özel hedef kitleye düşer → C3'ü besler.

**Funnel:** /coz/mini-tus → 20 soru → sonuç ekranı: net + tahmini TUS puanı (`tusScoring.js` hazır) + "Türkiye'de ilk %X" yüzdeliği → birincil CTA "Skorunu kaydet, zayıf konularını gör" (web kayıt) → 1080×1920 paylaşım kartı indir/paylaş.

**Bütçe:** ₺35–75/gün (senaryoya göre), yalnız Per–Paz. Aylık ~₺600–1.300.

**KPI:** Tamamlama ≤ ₺12 · katılımcı→kayıt ≥ %25 · kart paylaşımı ≥ %10

**Neden işler:** TUS öğrencisinin tek gerçek sorusu "ben neredeyim?" — yüzdelik bunu 25 dakikada cevaplıyor. Paylaşım kartı her katılımcıyı reklam panosuna çevirir; deneme neti paylaşmak bu kitlede zaten alışkanlık. Haftalık ritim, ligle (mevcut özellik) doğal köprü kurar.

**Risk:** İlk haftalarda katılım azken "412 kişi" diyemezsin — sayı 300'ü geçene dek yüzdeliği geçmiş katılımcı tabanından hesapla, metinde toplam sayı kullanma. Yüzdelik iddiası her zaman gerçek veriden gelsin.

### K2 — Vaka Reels serisi — kanıtlanmış formatın videosu
*Çekirdek · C1*

**Kanca:** "62 yaşında erkek, 3 gündür ateş ve sol alt kadran ağrısı… En olası tanı?" — 5 saniyelik sayaç — cevap + tek cümle açıklama — "7.000+ soru, günde 30'u ücretsiz."

**Format:** 15–30 sn metin tabanlı Reels; seslendirme yok, iri altyazı (sessiz izlenir). Tek şablon, ayda 8 video tek oturumda toplu üretim. Statik 4:5 eşi de aynı kampanyada yarışır.

**Kurgu:** C1 içinde reklam varyantı. Satış hedefi, QuizComplete optimizasyonu. Reklamdaki soru = landing'in ilk sorusu, birebir (mevcut kural korunuyor).

**Funnel:** /coz/<ders> → ilk soru şıklarıyla açık gelir, şıkka basınca quiz başlamıştır (bkz. §07-1) → 3 soru → sonuç → web kayıt birincil.

**Bütçe:** C1 havuzundan; başlangıçta C1'in ~%40'ı bu seriye.

**KPI:** 3 sn izlenme (hook) ≥ %30 · CPC ≤ ₺1 · QuizComplete ≤ ₺10

**Neden işler:** Bu formatın statik hali hesabında zaten kanıtlı: %3,17–4,85 CTR, ₺0,66–0,77 CPC. Reels envanteri statik feed'den daha ucuz erişim verir; vaka anlatısı tıp öğrencisini kendiliğinden filtreler.

**Risk:** Üretim disiplini tek risk. Şablonu bir kez kur, cuma günleri 2 video planla; üretilemeyen hafta statikler döner.

### K3 — "Tahmini TUS puanın kaç?" — 10 soruluk kalibrasyon
*Çekirdek · C1*

**Kanca:** "10 soruda tahmini TUS puan aralığını gör. İlk denemede 45 üstü görene az rastlanır — sen dene."

**Format:** Statik 4:5 + basit Reels. Görselde puan skalası ve "?" — merak boşluğu bırakılır, örnek soru gösterilmez (bu seri format merakıyla değil sonuç merakıyla tıklatır).

**Kurgu:** C1 varyantı, QuizComplete optimizasyonu. Landing'de "≈6 dakika" beklentisi kurulur (10 soru, 3'ten uzun — dürüst ol, yarıda bırakma düşer).

**Funnel:** /coz/puan-tahmini → 4 temel dersten 10 karışık soru → sonuç: tahmini puan aralığı (tusScoring çapalarından, ±5 bandı) + "Bu aralığı yükselten şey şu 3 zayıf konun" → web kayıt.

**Bütçe:** C1 havuzundan, ~%20 pay ile test; kazanırsa pay artar.

**KPI:** Başlayan→tamamlayan ≥ %45 · tamamlama ≤ ₺15 · tamamlayan→kayıt ≥ %30 (puanını kaydetmek isteyen kayıt olur — kayıt oranı K2'den yüksek beklenir)

**Neden işler:** Puan, bu kitlenin tek KPI'ı. "Soru çöz" davetinden çok daha güçlü bir vaat: kendi hakkında bir sayı öğrenmek. Ürün tarafı ucuz — `tusScoring.js` zaten yazılmış, iş 10 soruluk kampanya tipi eklemek.

**Risk:** 10 soruyla "puanın bu" demek bilimsel olarak savunulamaz — dil hep "tahmini aralık / kalibrasyon" olsun. Abartılı iddia bu kitlede güveni kalıcı bozar.

### K4 — "%68'i yanlış yaptı" — en çok yanılınan soru serisi
*Çekirdek · C1*

**Kanca:** "Bu patoloji sorusunu çözenlerin %68'i yanlış şıkka gitti. Çoğunluk B dedi; doğrusu değil. Sen hangisini seçerdin?"

**Format:** Statik 4:5 seri — her ders için bir soru; ayrıca 3 soruluk carousel ("3'ünü de bilen ilk %9'da"). Yanlış oranı gerçek veriden: soru istatistiklerin zaten Firestore'da birikiyor.

**Kurgu:** C1 varyantı, QuizComplete. Reklam sorusu = landing ilk sorusu kuralı burada da geçerli.

**Funnel:** /coz/tuzak-<ders> → aynı soru açık → cevap + "çoğunluğun neden yanıldığı" açıklaması (bu açıklama ürünün kalite vitrini) → 2 soru daha → sonuç → kayıt.

**Bütçe:** C1 havuzundan ~%25 pay.

**KPI:** CTR ≥ %4 · QuizComplete ≤ ₺8 — serinin en agresif hedefi; ego+merak kancası en ucuz tamamlamayı getirmeli.

**Neden işler:** "%68 yanlış yaptı" iki şeyi aynı anda yapar: meydan okur (ego) ve verinin derinliğini kanıtlar (binlerce çözümden istatistik çıkarabilen ciddi bir platform izlenimi). Rakip reklamların hiçbiri soru düzeyinde veri gösteremiyor.

**Risk:** Hep zor soru göstermek "bu uygulama çok zor" algısı yaratır — karışım kullan: bir "%68 yanlış" sorusuna karşı bir "%89 doğru ama herkes 40 saniye düşünüyor" sorusu. Oranlar asla uydurma olmasın.

### K5 — Unutma eğrisi — FSRS'i öğrenci diliyle satmak
*Retarget · C3*

**Kanca:** "Bugün çözdüğün 50 sorunun 35'ini dokuz gün sonra hatırlamayacaksın. Tusoskop yanlışını tam unutmak üzereyken karşına çıkarır. Dershane bunu yapamaz; algoritma yapar."

**Format:** 20 sn animasyonlu Reels: eğri düşer (unutma), emerald çizgi tam düşerken yakalar (tekrar) — tek sahne, tek mesaj. Statik versiyon: iki eğrili tek grafik kartı.

**Kurgu:** C3 retarget: kitle = son 30 gün ViewContent + QuizStart + QuizComplete + kayıtlı-ücretsizler. Soğuk kitleye çıkmaz (kavramsal mesaj ilk temasta zayıf). Sıklık tavanı ~4/hafta.

**Funnel:** Kayıtsıza → web kayıt; kayıtlı ücretsize → uygulamada Akıllı Tekrar ekranı. İkinci temas mesajıdır: kullanıcı soruyu zaten çözdü, şimdi "neden burada kalmalıyım"ın cevabı.

**Bütçe:** C3 havuzundan ~%35.

**KPI:** Kayıt ≤ ₺40 · retarget CPM ≤ ₺90 (dar kitlede CPM yüksek olur, normal).

**Neden işler:** Rakipler soru satıyor; sen hafıza sistemi satıyorsun — kategoride tek konumlanma bu. FSRS "spaced repetition" diye değil "tam unutmadan önce" diye anlatılınca dershaneyle kıyas kendiliğinden doğuyor.

**Risk:** Soğuk kitlede harcarsan boşa gider — bu fikir kesinlikle sıcak kitle mesajı. C1'e sızdırma.

### K6 — "Dershaneye 45.000₺ vermeden önce" — Eylül Paketi
*Retarget · C3 · Satış katmanı*

**Kanca:** "TUS dershanesi: 45.000₺. Tusoskop Eylül Paketi — sınava kadar sınırsız her şey: 209,70₺. Soru çözerek kazanılan sınava soru çözerek hazırlan." Kartta kanıt satırı şart: "7.000+ soru · akıllı tekrar · haftalık Türkiye ligi" — yoksa ucuzluk kalitesizlik okunur.

**Format:** Tek slaytlık kıyas kartı + 3 kartlı carousel (dershane / online kamp / Tusoskop). "Eylül Paketi" = mevcut 3 aylık planın (₺209,70) sezonluk yeniden adlandırması — fiyat değişmiyor, çerçeve değişiyor.

**Kurgu:** C3'ün satış katmanı: kitle = CompleteRegistration + QuizComplete (30 gün) + Mini TUS katılımcıları, optimizasyon Purchase. Kitle küçükken öğrenme fazından çıkmayacak — dert değil; dar kitlede sıklıkla teslimat yeter.

**Funnel:** /fiyatlandirma (kıyas tablosu eklenmiş hali) → PayTR web ödeme → Purchase pixel + CAPI. Uçtan uca ölçülebilir tek gelir döngüsü budur.

**Bütçe:** C3 havuzundan ~%40; Ağustos ortasından itibaren (sınava 4 hafta kala) pay %60'a çıkar.

**KPI:** İlk 60 gün Purchase ≤ ₺300, sonra ≤ ₺200 · sıklık ≤ 4/hafta

**Neden işler:** Satın alma anı yaratır: soruyu çözmüş, skorunu görmüş, kayıt olmuş kullanıcıya doğru anda fiyat çıpasıyla gelir. 45.000₺'lik çıpanın yanında ₺209,70 "karar bile değil" seviyesine iner.

**Risk:** Ucuz fiyat tek başına güven kırar — bu kart asla K8 (sosyal kanıt) olmadan tek başına dönmesin; C3'te ikisi rotasyonda kalsın.

### K7 — "Eylül'e 9 hafta" — geri sayım matematiği
*Çekirdek · C1 · Kreatif yenileme motoru*

**Kanca:** "Eylül'e 9 hafta. Günde 40 soru = sınava kadar 2.500 soru daha. Bugün başlayanla Ağustos'ta başlayan arasındaki fark, denemede 8 net." Her cuma sayı güncellenir: "8 hafta… 7 hafta…" — aciliyet uydurulmaz, takvimden okunur.

**Format:** Tek statik şablon (büyük hafta sayısı + soru matematiği), 10 sn'lik sayaç Reels. Üretim maliyeti sıfıra yakın — sayı değişir, şablon kalır.

**Kurgu:** C1 varyantı, QuizComplete. Ayrıca C3'te "hâlâ başlamadın" tonlu versiyonu döner. Kreatif yorgunluğa karşı yapısal çözüm: reklam her hafta zaten yenileniyor.

**Funnel:** /coz karışık set → sonuç → "Eylül'e kadar planını çıkardık" (AI çalışma planı vitrine çıkar) → kayıt.

**Bütçe:** C1 havuzundan ~%15; Ağustos'ta %30'a çıkar (deadline yaklaştıkça mesaj güçlenir).

**KPI:** Sıklık ≤ 2,5 · CTR düşüşü %30'u geçerse şablon değişir (renk/kompozisyon rotasyonu hazır dursun).

**Neden işler:** TUS'un gerçek bir deadline'ı var; FOMO üretmek gerekmiyor, hatırlatmak yetiyor. "Günde X soru" matematiği soyut kaygıyı somut plana çevirir — ve planın adresi Tusoskop olur.

**Risk:** Sınav geçince anlamı biter — Eylül'de otomatik kapanış tarihi kur, Aralık'ta "2027/1'e X hafta" olarak geri döner.

### K8 — Canlı sosyal kanıt — lig ve sayaç
*Retarget · C3 · Güven katmanı*

**Kanca:** "Geçen hafta Tusoskop'ta [gerçek sayı] soru çözüldü. Haftalık ligde [gerçek sayı] kişi yarışıyor. TUS'a yalnız hazırlanma." Sayılar küçükken bireysel anlatı: "Aktif kullanıcılar günde ortalama [X] soru çözüyor — sen kaç çözüyorsun?"

**Format:** Statik kart + ligin anonimleştirilmiş gerçek ekran görüntüsü. Ayda 2 kez sayılar güncellenir. Kullanıcı yorumu/DM ekran görüntüleri (izinli) üçüncü varyant.

**Kurgu:** C3 rotasyonunda K6'nın eşlikçisi; C1'de düşük bütçeli soğuk test de alır (sosyal kanıt bazen soğukta da çalışır).

**Funnel:** Kayıt sayfası; kayıtlıya lig ekranı derin linki.

**Bütçe:** C3 havuzundan ~%25.

**KPI:** CTR ≥ %2 · K6 ile birlikte döndüğü haftalarda Purchase maliyetinin tekil K6 haftalarına göre düşmesi (asıl görevi asist).

**Neden işler:** Hocasız markanın otorite ikamesi kalabalıktır. Kunduz'un "İlk 100'de 39 öğrenci" oyununun senin verinle oynanabilir hâli — ve senin verin haftalık yenileniyor, onlarınki yılda iki kez.

**Risk:** Küçük sayı ters teper: haftalık çözülen soru güven verici eşiği (≥50k) geçene kadar toplam yerine ortalama/bireysel istatistik anlat. Sayı asla şişirilmez — bu kitle yakalar.

### K9 — Koğuştan UGC — beş öğrenci, ortaklık reklamları
*Ortaklık · C1 içinde whitelisted*

**Kanca:** "Stajdayken günde 1 saatim var. O saati nasıl kullandığımı göstereyim." / "30 günde 2.400 soru çözdüm — yanlışlarım 12 nete böyle döndü."

**Format:** Telefonla çekilmiş, ham, 30–45 sn öğrenci videosu. Parlak prodüksiyon yasak — inandırıcılık ham görüntüde. Yüksek performanslılar öğrencinin hesabından partnership ad (whitelisting) olarak döner.

**Kurgu:** 5 dönem-5/6 veya intern öğrenci; takas: 6 ay ücretsiz Plus + ayda ₺1.000–2.000 sabit, karşılığı ayda 2 video + işbirliği etiketi izni. Videolar C1'de QuizComplete optimizasyonuyla normal varyant gibi yarışır.

**Funnel:** Videodaki yönlendirme /coz veya Mini TUS'a — öğrencinin anlattığı akışın aynısına iner (mesaj eşleşmesi kuralı burada da geçerli).

**Bütçe:** Nakit maliyet ayda ~₺5.000–10.000 (öğrenci ücretleri); medya bütçesi C1 havuzundan, kazanan videoya doğal akar.

**KPI:** Thumbstop ≥ %35 · QuizComplete maliyeti C1 ortalamasının altı · yorumlarda organik soru ("hangi uygulama bu?")

**Neden işler:** Bu dikeyde güven yalnızca akrandan alınır; dershaneler hoca otoritesi satar, sen sınıf arkadaşı otoritesi satarsın. Türkiye edtech'inde kanıtlanmış tek ölçekleme kanalı budur.

**Risk:** Yanlış seçim: takipçi sayısına bakma — sınıf WhatsApp gruplarında sözü dinlenen öğrenciyi ara. Vaat diline dikkat: "kazandırır" yok, süreç anlatısı var (etik + güven).

### K10 — "Çıkanları biz sorduk" — sınav sonrası kanıt sprinti
*Sezon · C4 · Eylül*

**Kanca:** "2026/2 TUS'ta sorulan konuların %[X]'i Tusoskop soru bankasında çalışılabiliyordu. Kontrol et: işte 5 örnek eşleşme." — ve aynı hafta: "2027/1'e bugün başlayan, Şubat'a 8.000 soru çözmüş girer."

**Format:** Kanıt kartı + 5'li carousel (TUS soru konusu ↔ Tusoskop soru ekranı yan yana). Sınavdan sonraki 48 saat içinde yayında olmalı — hazırlık şimdiden yapılır (§07-8).

**Kurgu:** C4, Satış hedefi, CompleteRegistration. Kitle: soğuk + tüm sıcak kitleler. Sınav haftası C1 durur, sınav ertesi C4 açılır — hedef artık 2027/1 kohortu (dönem 6'ya geçenler, ilk kez hazırlananlar).

**Funnel:** Kanıt landing'i (/tus-2026-2-analiz — SEO sayfası olarak da yaşar) → örnek eşleşmeler → "2027/1 planını başlat" → kayıt → K6'nın kış versiyonu devralır.

**Bütçe:** Eylül–Ekim: günlük bütçenin tamamı 2 hafta boyunca C4'te; sonra ₺50/gün bakım moduna iniş.

**KPI:** Eylül–Ekim kayıt maliyeti yaz ortalamasının ≤ %60'ı (rakipler reklamı keser, açık artırma boşalır — yılın en ucuz kayıt dönemi).

**Neden işler:** Pazarın kazandığı kanıtlanmış format: MD Kampüs şu an tam olarak bunu dönüyor ("Mart TUS'unda 49 soruya referans oldu"). Senin versiyonun soru ekranı görüntüsüyle doğrulanabilir — iddia değil, belge.

**Risk:** ÖSYM telifi: sınav sorusu yayınlanmaz, konu/tanı düzeyinde eşleştirme yapılır; dil "referans oldu" değil "kapsıyordu". Oran dürüst hesaplanır — şişirilmiş kanıt, kanıt değildir.

## 05 — Bütçe: iki senaryo, dürüst matematik

| | A — Minimum (₺150/gün) | B — Önerilen (₺300/gün) |
|---|---|---|
| Aylık toplam | ~₺4.550 | ~₺9.100 |
| C1 Çekirdek dönüşüm | ₺90/gün | ₺165/gün |
| C2 Mini TUS (Per–Paz) | ₺35/gün | ₺75/gün |
| C3 Retarget & satış | ₺25/gün | ₺60/gün |
| Başabaş (₺200 sepet) | ~23 satış/ay | ~46 satış/ay |
| 1. ay gerçekçi hedef | 300+ tamamlama · 80+ kayıt · 3–6 satış | 600+ tamamlama · 180+ kayıt · 8–15 satış |

İlk ayın hedefi başabaş değil, sinyal. İlk 4 hafta Meta'nın öğrenmesini ve funnel düzeltmelerinin (§07) oturmasını satın alıyorsun. Satış döngüsü ikinci ayda, K6'nın sıcak kitlesi dolunca kurulur: kayıt maliyeti ₺40'a, kayıt→satış oranı %5'e gelirse satış başına maliyet ~₺200'e iner ve arada sırada satış düzenli hâle gelir. Bu eşikler tutmazsa büyütme değil teşhis yapılır — **bütçe artışı asla çözüm değildir.**

**Guardrail'ler:** CPC ≤ ₺1 · landing→başlama ≥ %40 (düzeltme sonrası; bugün %17) · QuizComplete ≤ ₺10 · kayıt ≤ ₺50 · satış ≤ ₺300 (ilk 60 gün), sonra ≤ ₺200. **Bir metrik iki hafta üst üste guardrail dışıysa o katman durdurulur, kreatif değil önce funnel şüphelidir.**

## 06 — 9 haftalık takvim (Eylül başı TUS varsayımı — ÖSYM takvimine göre kaydır)

| Hafta | Medya | Ürün / hazırlık |
|---|---|---|
| **H1 · 6–12 Tem** | Tüm eski kampanyalar kapanır. C1 açılır: statik vaka (K2) + tuzak soru (K4), QuizComplete optimizasyonu. | §07'nin 1–5'i canlıya alınır (landing ilk soru, web CTA, özel dönüşümler, CAPI, kitleler). |
| H2 · 13–19 Tem | İlk Reels'ler C1'e girer. Özel kitleler dolmaya başlar. | Mini TUS ürün işi: 20 soruluk tip + yüzdelik + paylaşım kartı. |
| H3 · 20–26 Tem | Mini TUS #1 (yumuşak açılış, düşük bütçe). C3 retarget açılır: K5 + K8. | Öğrenci (K9) anlaşmaları: 5 kişi, brief + örnek video. |
| H4 · 27 Tem–2 Ağu | Mini TUS #2 tam bütçe. K7 geri sayım C1'e girer ("6 hafta"). | /fiyatlandirma kıyas tablosu + "Eylül Paketi" adlandırması yayında. |
| H5 · 3–9 Ağu | K6 Eylül Paketi C3'te açılır. İlk UGC videoları C1'de yarışır. | K3 puan tahmini funnel'ı yayına girer. |
| H6 · 10–16 Ağu | İki haftalık ilk büyük okuma: guardrail dışı katman durdurulur; kazanan kreatife bütçe kayar. | K10 hazırlığı başlar: konu eşleştirme scripti + kanıt landing taslağı. |
| H7 · 17–23 Ağu | Bütçe +%30 (sınav yaklaşımı = niyet tepesi). K6 payı C3'te %60'a çıkar. | Mini TUS "Genel Prova" duyurusu (büyük edisyon). |
| H8 · 24–30 Ağu | Mini TUS Genel Prova — haftanın ana harcaması. K7 "son 2 hafta" tonu. | K10 kreatifleri hazır bekler (yayın değil). |
| **Sınav haftası** | Tüm reklam durur. Kimse reklam görmek istemiyor; para biriktir. | Sınav günü analiz ekibi (sen + script) çalışır. |
| Sınav +1/+2 hafta | C4 açılır: K10 kanıt + "2027/1'e bugün başla". Yılın en ucuz kayıtları toplanır, sonra ₺50/gün bakım. | Sezon raporu: CAC, kohort, hangi kreatif kazandı → Aralık sprintinin planı. |

**Şu an H1 haftasındayız (6-12 Temmuz 2026).**

## 07 — Ön koşullar: reklamdan önce yapılacak işler

Bunlar olmadan yukarıdaki hiçbir kampanya hakkını vermez. 1–6 kod işi.

1. **Landing'de ilk soru direkt açık.** "Başla" ekranı kalkar; reklamdaki soru şıklarıyla gelir, şıkka basmak = QuizStart. Bugünkü %83'lük başlama kaybının ilacı. *kod · 1 gün*
2. **Sonuç ekranında birincil CTA web kayıt.** "Skorunu kaydet, zayıf konularını gör" birincil; App Store ikincil. Çözülen cevaplar hesaba işlenir (Phase-2 borcu kapanır). *kod · 1–2 gün*
3. **Events Manager'da özel dönüşümler:** QuizComplete ve MiniTusComplete tanımlanır ki Satış kampanyaları bunlara optimize edebilsin. *panel · 30 dk*
4. **CAPI (Conversions API):** paytrCallback'ten sunucu taraflı Purchase (event_id = merchantOid ile pixel'le dedup) + kayıt eventi Functions'tan. Ad-blocker kullanan tıp öğrencisi kitlesinde tarayıcı pixel'i tek başına eksik sayar. *kod · 1 gün*
5. **Özel hedef kitleler:** ViewContent / QuizStart / QuizComplete / CompleteRegistration (30–90 gün) + kayıt bazlı %1 benzer hedef kitle. *panel · 30 dk*
6. **Mini TUS ürün paketi:** 20 soruluk kampanya tipi, tahmini puan + yüzdelik hesabı, 1080×1920 paylaşım kartı (canvas→PNG). *kod · 3–4 gün*
7. **/fiyatlandirma kıyas bloğu + "Eylül Paketi" adlandırması** (3 aylık planın sezonluk çerçevesi). *kod · yarım gün*
8. **K10 kanıt altyapısı:** TUS konu başlıklarını soru bankası taksonomisiyle eşleştiren script + kanıt landing şablonu — sınav günü 48 saat içinde yayın için. *kod · 2 gün, Ağustos'ta*

## 08 — Ben olsam neyi farklı yapardım

**Satışı tamamen web'e alırdım.** Bugün ücretli trafiğin çıkışı App Store — Apple'ın ATT duvarının arkasında kör bir kuyu. PayTR web ödemesi ise pixel + CAPI ile uçtan uca ölçülüyor. Reklamın işi web'de kayıt ve satış; iOS uygulaması, kazanılmış kullanıcıyı tutma aracı.

**Boost butonunu emekliye ayırırdım.** 90 günlük harcamanın %57'si (₺2.882) bir boost'ta, %1 CTR ile yandı. Boost, Meta'nın "para ver, düşünme" ürünüdür. Bir daha asla — her lira, optimizasyon hedefi bilinçle seçilmiş bir kampanyadan geçer.

**Bütçeyi tek yerde toplar, sinyal biriktirirdim.** 5 kampanyaya ₺50'şer vermek, beş ayrı öğrenme fazını aynı anda açlıktan öldürmek. Tek çekirdek kampanya, içinde yarışan kreatifler: Meta'nın makinesi ancak yoğun sinyalle çalışır.

**Ürüne satın alma anı inşa ederdim.** "Arada sırada satış", fiyat sayfasına tesadüfen gelenden çıkmaz; en yüksek niyet anından çıkar. O an belli: deneme/quiz sonucu ekranı. Oraya "zayıf konuların: [gerçek liste] — Eylül'e kadar sınırsız çalış: ₺209,70" kartı koyardım. Reklam insanları o âna taşır; satışı o an yapar.

**Kanıt stoğu biriktirirdim.** Pazarın kazanan reklamı belli: MD Kampüs "49 soruya referans", Kunduz "İlk 100'de 39". Tusoskop'un kanıt üretecek verisi var ama vitrini yok. Eylül sabahı yayınlanacak kapsam analizinin scriptini Temmuz'da yazar, her hafta bir mikro kanıt (lig, sayaç, kullanıcı mesajı) arşivlerdim.

**Influencer'ı ajanstan değil hastane koridorundan seçerdim.** 10 bin takipçili "eğitim fenomeni" değil; sınıf WhatsApp grubunda sözü dinlenen dönem-6 öğrencisi. Beş kişi, takas + küçük ücret, ortaklık reklamı izni. Bu kitle reklama değil akrana inanır.

**Ölçümü tarayıcıdan sunucuya taşırdım.** Tıp öğrencisi kitlesinde ad-blocker oranı yüksek; yalnız tarayıcı pixel'i satışlarının bir kısmını Meta'dan saklar ve algoritma kör kalır. paytrCallback zaten sunucuda — Purchase'ı CAPI ile oradan atmak yarım günlük iş, etkisi kalıcı.

**Takvimle konuşurdum.** Bu pazar yılda iki kez nefes alır. Temmuz–Eylül yüklen, sınav haftası sus, sınav ertesi ucuz kayıtları topla, Ekim–Kasım ₺50/gün bakım + SEO/organik, Aralık'ta ikinci sprint. Yıl boyu sabit harcama, sezonun matematiğini görmemektir.

## 09 — Yapma listesi

- **Bilinirlik/erişim kampanyası açma.** ₺350'ye 28 tık gördün; bu bütçede bilinirlik satın alınmaz, kazanılır.
- **Instagram boost kullanma.** Hiçbir koşulda. Aynı para C1'de her zaman daha iyi çalışır.
- **Soğuk trafiği App Store'a gönderme.** Ölçemediğin yere bütçe akıtma; App Store linki yalnız sonuç ekranında ikincil buton.
- **Reklam görseli ile landing ilk sorusunu ayrıştırma.** Mesaj eşleşmesi bu funnel'ın bel kemiği — tek istisna yok.
- **Hacim yokken soğuk kitlede Purchase optimizasyonuna çıkma.** Haftada 25+ satış olana dek Purchase yalnız C3'ün dar sıcak kitlesinde.
- **Beşten fazla paralel kampanya / ₺50 altı günlük bütçeli kampanya açma.** Sinyali bölen her yapı, öğrenmeyi öldürür.
- **Sınav haftası harcama.** O hafta kimse müşteri değil; parayı sınav ertesinin ucuz açık artırmasına sakla.
