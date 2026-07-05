# Tusoskop Meta Reklam Kampanyası — Güncel Durum

> **Bu dosyanın amacı:** Bu, tek bir uzun sohbette yürütülen bir Meta reklam kampanyası projesinin tam hafızasıdır. Yeni bir Claude oturumu bu dosyayı okuyarak sıfırdan hiçbir şey sormadan kaldığı yerden devam edebilmeli. Branch: `claude/tusoskop-ad-campaign-slspzd`. Son güncelleme: **5 Temmuz 2026**.
>
> Meta Ads MCP araçları (`mcp__META__*`) bu hesaba bağlı: **ad_account_id = `2734371800349546`** (TRY, Tusoskop). Sayfa (page_id, C1 creative'lerinde kullanılan): `1262932140225631`. Pixel/dataset_id: `1327796822800702`.
>
> **KRİTİK DAVRANIŞ KURALI:** Kampanya/ad set/reklam oluşturma işlemleri her zaman **PAUSED** yapılır. `ads_activate_entity` (gerçek para harcamaya başlatan tek işlem) **asla kullanıcının açık onayı olmadan çağrılmaz.** Bu kural bu oturumda defalarca kullanıcı tarafından teyit edildi ("Sen c3 ü de paused olarak kur. Aktif etme.").
>
> **DÜRÜSTLÜK KURALI (asla çiğnenmez):** Reklam kreatiflerinde veya uygulama içi metinde **asla uydurma istatistik/rakam/katılımcı sayısı yazılmaz.** Örnek/illüstratif rakamlar mutlaka "(ÖRNEK)" etiketi ve "İstatistiksel tahmindir" gibi bir dipnotla işaretlenir. Gerçek rakamlar (K8'deki haftalık soru sayısı, katılımcı sayısı gibi) kullanıcı tarafından Firestore/admin panelden doğrulanmadan kullanılamaz. Bu kural bu oturumda birkaç kez devreye girdi (K6 fiyat uyuşmazlığı, K8 rakamları) — her seferinde `AskUserQuestion` ile durup teyit alındı.

---

## 1) Orijinal Teşhis (hesap verisiyle, sohbetin başında yapıldı)

Kullanıcının "muadillerimden daha iyiyim ama Meta'da tutmuyor" sorusuna, hesabın gerçek 90 günlük verisine bakılarak verilen cevap:

1. **Son 90 günün 5 kampanyası da Trafik/Bilinirlik hedefliydi, hiç Dönüşüm kampanyası yoktu.** Meta'ya "tıklayan bul" deniyordu, "kayıt olan/ödeyen bul" değil.
2. **Bütçenin yarısından fazlası en kötü kampanyada yanmış** ("Hemen ücretsiz denemek için" boost: ₺2.882, %1,02 CTR, ₺7,70 CPC). Buna karşılık quiz-funnel reklamı (Patoloji-01 → `/coz`) %4,85 CTR / ₺0,66 CPC ile zaten çok iyiydi — **kreatif sorun değildi, kampanya hedefi sorundu.**
3. **Pixel 27 Haziran'da kurulmuştu** — o tarihe kadarki harcama Meta'nın hiç dönüşüm sinyali göremediği bir dönemdeydi.
4. **Funnel'da iki büyük sızıntı** (3-4 Temmuz verisi): ~230 ViewContent → ~39 QuizStart (**%83 kayıp**) → ~11 QuizComplete → 5 AppStoreClick → 28 günde toplam **1 CompleteRegistration, 0 Purchase**. Kullanıcı App Store'a atılıp orada izi kaybediliyordu; web kaydı neredeyse sıfırdı.

**Yapılacaklar sıralaması (verilen ilk tavsiye):**
A. Trafik kampanyalarını kapat, tek bir Satış/Dönüşüm kampanyası aç, optimizasyon eventi `QuizComplete` (hacim Purchase'a yetmiyor, QuizComplete şu an ulaşılabilecek en derin sinyal).
B. Landing'de "başla" ekranını kaldır, reklamdaki soru direkt açılsın (momentum kaybı önlensin).
C. Sonuç ekranında birincil CTA "App Store" değil "Skorunu kaydet, web'de devam et" olsun (App Store ATT arkasında Meta için kördür, web ölçülebilir+retarget edilebilir).
D. Retargeting: ViewContent/QuizStart yapıp tamamlamayanlardan custom audience kur.

**"Benden kötüler niye tutuyor?" sorusunun cevabı:** TUS pazarında satın alma kararını hoca otoritesi + sosyal kanıt verdiriyor. Tusoskop'un hocası yok ama ikamesi var: sıralama ve rakamlar ("7.000+ soru", "Geçen hafta X kişi çözdü"). Fiyat da bir sinyal — 89,90₺/ay çok ucuz durup "ciddiyetsiz" izlenimi verebiliyor; dershane fiyat kıyası (45.000₺ vs Tusoskop) bunu tersine çevirip ucuzluğu silaha dönüştürüyor.

---

## 2) Orijinal 10 Fikir + 4 Kampanya Yapısı

> Tam artifact (bu oturumda üretildi, claude.ai'de barındırılıyor, muhtemelen bu hesaptan erişilebilir): *Tusoskop Medya Planı — 10 Kampanya* — `https://claude.ai/code/artifact/136217f4-ca61-4183-bdb7-181621e411b5`

**Kritik yapı kararı:** 10 fikir 10 kampanya değil, **4 kampanyaya** oturuyor (sinyali bölmemek için):
- **C1 — Çekirdek Dönüşüm** (soğuk/geniş kitle, QuizComplete optimizasyonu) — 5 kreatif fikrinin (K2, K3, K4, K7, K9) yarıştığı havuz.
- **C2 — Mini TUS** (haftalık ritüel kampanyası, K1 ürünü üstüne kurulu) — **henüz Meta'da kurulmadı**, çünkü ürün bitmeden kampanya boş kabuk olur.
- **C3 — Retarget/Satış** (ViewContent/QuizStart yapıp tamamlamayan sıcak kitleye) — K5, K6, K8 kreatifleri.
- **C4 — Eylül Sprinti** (sınav sonrası "çıkanları biz sorduk" kanıt kampanyası, Ağustos'ta kurulacak) — **henüz hiç başlanmadı.**

**10 fikir (orijinal plandaki adlar — bazıları implementasyonda yeniden adlandırıldı, bkz. §3 ve §5 tablosu):**

1. **K1 — Türkiye Geneli Mini TUS**: Amiral gemisi. 20 soru, tahmini puan + "Türkiye'de ilk %X" + paylaşılabilir story kartı.
2. **K2 — Vaka Reels serisi**: Hesapta zaten kanıtlanmış vaka formatının (%3-5 CTR) 15-30sn video hali. **Hiç üretilmedi.**
3. **K3 — "Tahmini TUS puanın kaç?"**: 10 soruluk kalibrasyon. (İmplementasyonda `/coz/karisik-tus-01` "Karışık TUS Denemesi" olarak kodlandı — 3 sorulu mini deneme, K1 Mini TUS'tan farklı ve daha küçük bir ürün.)
4. **K4 — "%68'i yanlış yaptı"**: Ego+merak kancası, ucuz tamamlama hedefi. (İmplementasyonda `/coz/tuzak-farmakoloji-01` "Tuzak Soru" konseptine dönüştü — ilk soru klaritromisin/rabdomiyoliz vakası.)
5. **K5 — Unutma eğrisi**: FSRS'i "tam unutmadan önce karşına çıkarır" diliyle anlatan retarget mesajı. Soru içermiyor, iki eğri grafiği.
6. **K6 — "Dershaneye 45.000₺ vermeden önce" (Eylül Paketi)**: 3 aylık planın fiyat-kıyas kartı, sıcak kitlede Purchase katmanı.
7. **K7 — "Eylül'e N hafta" geri sayımı**: Takvimden okunan aciliyet, dev rakam + günde-X-soru matematiği.
8. **K8 — Canlı sosyal kanıt**: Haftalık lig + gerçek kullanım sayıları. **Gerçek rakam gerektirir, uydurulamaz.**
9. **K9 — Koğuştan UGC**: 5 dönem-6/intern öğrenciyle ham telefon videosu, whitelisting reklamı. **İş geliştirme tarafı, hiç başlamadı.**
10. **K10 — "Çıkanları biz sorduk"**: TUS 2026/2 sonrası kapsam-kanıt sprinti. Planda Ağustos'ta yapılması yazıyor, **henüz sırası gelmedi.**

**"Ben olsam ne yapardım" (stratejik ilkeler, bu oturum boyunca uygulandı):**
- Satışı tamamen web'e al (App Store ATT arkasında kör, PayTR CAPI ile ölçülüyor).
- Boost butonuna bir daha dokunma (paranın %57'si orada yanmıştı).
- Bütçeyi tek dönüşüm kampanyasında topla, 5 kampanyaya bölme.
- Satın alma anını fiyat sayfasına değil deneme **sonuç ekranına** inşa et.
- Kanıt stoğu biriktir (K10 için).
- Influencer'ı ajanstan değil hastane koridorundan seç (K9).
- Purchase ölçümünü CAPI ile sunucuya taşı (ATT/ad-blocker'a karşı dayanıklı).
- Yıl boyu düz harcama yerine sezonla yaşa (Tem-Eyl yoğun, Ara-Şub ikinci sezon).

**Takvim:** Bugün (5 Temmuz) planın **H1 (6-12 Temmuz)** haftasının hemen başı — C1 bir gün erken ateşlendi. "İskelet zamanında, içerik geride" durumu H1 sonunda tespit edilmişti; bu genel olarak hâlâ geçerli (bkz. §6 açık işler).

---

## 3) Kod Tarafında Yapılanlar (hepsi build+test geçti, branch'e push edildi)

| Dosya | Değişiklik |
|---|---|
| `src/components/funnel/PublicQuizFunnel.jsx` | Mini TUS branch: `estimateMiniTusResult` entegrasyonu, `mini_tus_complete`/`MiniTusComplete` event tracking, `miniTusEstimate` useMemo |
| `src/components/funnel/QuizQuestionCard.jsx` | `total` prop, dinamik "N soru daha çözerek..." ipucu (hardcoded "2" kaldırıldı) |
| `src/components/funnel/QuizResultScreen.jsx` | Mini TUS branch: "Mini TUS tamamlandı" başlığı, tahmini puan/yüzdelik bloğu, dürüstlük dipnotu, "Sonucunu Paylaş" butonu (canvas→PNG→Web Share API, download fallback). Web-öncelikli CTA ("Skorunu Kaydet, Devam Et" / App Store ikincil) **koşulsuz** korunuyor — bu §07-2 kuralıydı, Mini TUS'tan bağımsız her zaman geçerli. |
| `src/utils/miniTusScoring.js` (YENİ) | `MINI_TUS_QUESTION_COUNT=20`, `tusScoring.js`'teki gerçek TUS ortalama/varyansını 20/200 oranıyla ölçekler. Abramowitz-Stegun `erf` yaklaşımı ile `normalCdf`. `estimateMiniTusResult({correct,total})` → `{net,z,tahminiPuan,topPercent}`. **İSTATİSTİKSEL TAHMİN, gerçek ÖSYM puanı değil** — dosya başında bunu vurgulayan yorum var, asla "resmi puan" gibi sunulmamalı. |
| `src/utils/miniTusShareCard.js` (YENİ) | `renderMiniTusShareCard()` — 1080×1920 canvas, marka renkleriyle (#070C18 / #10B981) paylaşılabilir sonuç kartı PNG'si üretir. `shareOrDownloadCard()` — Web Share API + download fallback. |
| `src/data/publicQuizCampaigns.js` | K4 (`tuzak-farmakoloji-01`) ilk sorusu klinik vakaya (klaritromisin/rabdomiyoliz) çevrildi (sınav tarihine göre daha çarpıcı). Yeni kampanya: `mini-tus` slug'ı, `isMiniTus:true`, 20 gerçek soru (10 temel + 10 klinik, gerçek TUS oranı) — `src/data/questionChunks/*`'ten seçildi, boilerplate açıklamalar temizlendi. |
| `src/components/premium/PremiumInfoScreen.jsx` | Dershane fiyat çıpası `~45.000₺` → `~120.000₺` (K6 kreatifiyle tutarlılık için, kullanıcı teyidiyle). |

**Doğrulama:** Playwright ile gerçek tarayıcıda `/coz/mini-tus` uçtan uca test edildi (20 soru cevaplandı, sonuç ekranı "49,7 / İlk %51" doğru render, paylaş butonu çalıştı, web-CTA görünür). `npx eslint`, `npm run build`, `npx vitest run` (354 test) hepsi temiz.

**Commit'ler** (branch: `claude/tusoskop-ad-campaign-slspzd`):
- `be2daf3` feat(ads): funnel dönüşüm engellerini kaldır + Meta CAPI Purchase
- `c99829b` chore(ads): tuzak-farmakoloji-01 ilk soruyu klinik vakaya çevir
- `cf7c418` feat(mini-tus): 20 soruluk Mini TUS + istatistiksel tahmin puanı
- `ccb9277` fix(premium): dershane fiyat çıpasını 120.000₺'ye güncelle

**§07 kod ön koşulları (planın 8 maddesinden 6'sı kod işiydi) — tamamlanan alt görevler:** §07-2 (web-öncelikli CTA), §07-4 (CAPI Purchase sunucu kodu — `functions/paytr.js`/`functions/index.js`, event dedup için `eventID=merchantOid`), §07-7 (satın alma ekranı dershane kıyas kartı). K3/K4 kampanya verisi ve Mini TUS paketi de bu kapsamda tamamlandı.

---

## 4) Meta Panelinde Yapılanlar

### Custom Audience'lar (8 adet — 4 temel + 4 lookalike, hepsi kuruldu)

ToS onayı (`error_code 2663`) kullanıcı tarafından manuel kabul edildikten sonra oluşturuldu:

| Audience ID | İsim | Subtype | Delivery Status |
|---|---|---|---|
| `52561038367163` | WCA - ViewContent 30g | PLATFORM | ACTIVE |
| `52561038601963` | WCA - QuizStart 30g | PLATFORM | ACTIVE |
| `52561038615363` | WCA - QuizComplete 30g | PLATFORM | INACTIVE (henüz yeterli eşleşme yok) |
| `52561038908763` | WCA - CompleteRegistration 90g | PLATFORM | INACTIVE (kaynak kitle çok küçük) |
| `52561039399963` | Lookalike (TR, %1) - WCA - CompleteRegistration 90g | LOOKALIKE | INACTIVE |
| `52561039400163` | Lookalike (TR, %1) - WCA - QuizStart 30g | LOOKALIKE | INACTIVE |
| `52561039400363` | Lookalike (TR, %1) - WCA - QuizComplete 30g | LOOKALIKE | INACTIVE |
| `52561039400563` | Lookalike (TR, %1) - WCA - ViewContent 30g | LOOKALIKE | INACTIVE |

Lookalike'ların INACTIVE olması normal — kaynak kitleler (özellikle CompleteRegistration) henüz yeterince dolmadı.

### C1 — Çekirdek Dönüşüm (ACTIVE)

- **Kampanya ID:** `52561037294163` — "C1 · Çekirdek Dönüşüm — QuizComplete", objective `OUTCOME_SALES`, **CBO günlük bütçe ₺300,00** (5 Temmuz'da ₺165'ten yükseltildi, kullanıcı onayıyla).
- **⚠️ Dikkat (öğrenildi 5 Temmuz):** `ads_update_entity` ile CBO bütçesi değiştirilince Meta kampanyayı **otomatik PAUSED'a çekiyor** (`status_forced_to_paused`). Bütçe güncellemesinden sonra kampanyayı tekrar `ads_activate_entity` ile ACTIVE'e almak gerekiyor — unutulursa tüm C1 durur.
- **Ad Set ID:** `52561037322763` — "C1 · TR 20-33 · Geniş", optimizasyon: QuizComplete (custom event, `promoted_object: {pixel_id, custom_event_type:"OTHER", custom_event_str:"QuizComplete"}` — resmi "Özel Dönüşüm" nesnesi OLARAK KURULMADI, doğrudan pixel event'i hedeflendi; bu çalışıyor ama Ads Manager'ın "Özel Dönüşümler" sekmesinde görünmez, raporda "Özel Etkinlik" olarak görünür).
- **Reklamlar:**

| Ad ID | İsim | Durum | Creative ID |
|---|---|---|---|
| `52561037371763` | C1 · Patoloji-01 (kanıtlanmış kreatif) | **ACTIVE** | `1321207569996005` |
| `52561072857363` | C1 · K3 Karışık Deneme | **ACTIVE** | `1525375429128203` |
| `52561072875563` | C1 · K7 Geri Sayım | **ACTIVE** | `1034067412919221` |
| `52561072844763` | C1 · K4 Tuzak Farmakoloji | **⚠️ DISAPPROVED** | `2277307659682607` |
| `52561079280163` | C1 · K1 Mini TUS (Story, 1080×1920) | PAUSED (bilerek yedekte tutuluyor, §6 madde 2 kararı) | `1565109175270607` |
| `52561095267963` | C1 · K1 Mini TUS Feed (1080×1350) | **ACTIVE** (kullanıcı onayıyla aktive edildi) | `2007932956513390` |
| `52561172814363` | C1 · K2 Vaka Reels — Patoloji-01 (video, 1080×1920, 18sn) | **ACTIVE** (kullanıcı onayıyla, 5 Temmuz) — `effective_status: PENDING_REVIEW`, Meta incelemesi tamamlanana kadar delivery başlamaz | `1445220184304632` (video_id: `1485496119932305`) |

Görsel hash'leri: K1 Story → `c2179d195f043dfb9fc60138f8be2fe0`; K1 Feed → `8acdeded48c3ee9880a41beb5e2f9feb` (1122×1402, indirilip görsel olarak doğrulandı: "(ÖRNEK)" etiketi ve "İstatistiksel tahmindir, resmi ÖSYM puanı değildir." dipnotu mevcut).

### C3 — Retarget/Satış (tamamen PAUSED)

- **Kampanya ID:** `52561039359763`
- **Ad Set ID:** `52561039377163`
- **Reklamlar (üçü de PAUSED, hiçbiri aktive edilmedi):**

| Ad ID | İsim | Creative ID |
|---|---|---|
| `52561079102363` | C3 · K5 Unutma Eğrisi | `1767323217955107` |
| `52561079086363` | C3 · K6 Eylül Paketi | `4411324679196140` |
| `52561079113563` | C3 · K8 Sosyal Kanıt | `1031038562999872` |

K6 fiyatı ₺120.000 olarak üretildi (K5/K6/K8 promptunda ₺45.000 yazıyordu ama kullanıcı yüklediği görselde ₺120.000 çıktı; kullanıcı bunun doğru olduğunu teyit etti, uygulama da buna göre güncellendi — bkz. §3). K8'in rakamları (soru sayısı, lig katılımcı sayısı) kullanıcı tarafından "admin panelden/Firestore'dan doğruladım, gerçek" diye teyit edildi.

### CAPI / Dataset

- **Dataset ID:** `1327796822800702` ("Tusoskop"), `is_active: true`, `data_use_setting: advertising_and_analytics`.
- **`last_fired_time` (browser pixel):** güncel (5 Temmuz 2026'da ateşlenmiş).
- **`server_last_fired_time`:** kullanıcı tarafından test ödemesiyle doğrulandı — CAPI Purchase event'i artık ateşleniyor (§6 eski madde 4, çözüldü).

---

## 5) K-kodu → gerçek route/creative eşleşmesi (implementasyon)

| Kod | Konsept | Route | Meta durumu |
|---|---|---|---|
| K1 | Mini TUS (20 soru, istatistiksel tahmini puan) | `/coz/mini-tus` | Feed **ACTIVE**, Story PAUSED yedekte, C1 içinde |
| K3 | Karışık TUS Denemesi (3 soru, klinik vaka) | `/coz/karisik-tus-01` | ACTIVE, C1 |
| K4 | Tuzak Soru — Farmakoloji (klinik vaka: klaritromisin/rabdomiyoliz) | `/coz/tuzak-farmakoloji-01` | **DISAPPROVED**, C1 |
| K5 | Unutma Eğrisi (FSRS, grafik, soru yok) | — (retarget mesajı, landing'e link yok, sadece kreatif) | PAUSED, C3 |
| K6 | Eylül Paketi (dershane 120.000₺ kıyası) | `PremiumInfoScreen` fiyat sayfası | PAUSED, C3 |
| K7 | Geri Sayım ("7 hafta kaldı, +1.900 soru") | — | ACTIVE, C1 |
| K8 | Sosyal Kanıt (haftalık lig, gerçek rakamlar) | — | PAUSED, C3 |
| K2 | Vaka Reels (Patoloji-01'in video versiyonu) | `/coz/patoloji-01` | **ACTIVE**, C1 (PENDING_REVIEW, Meta incelemesi sürüyor) |
| K9, K10 | UGC / post-exam kanıt | — | **Hiç üretilmedi** |
| Patoloji-01 | Önceden var olan "kanıtlanmış" statik kreatif | `/coz` (eski) | ACTIVE, C1 (kontrol/baseline) |

---

## 6) ⚠️ ŞU AN AÇIK SORUNLAR (yeni oturum önce buraya baksın)

1. **K4 Tuzak Farmakoloji reklamı DISAPPROVED — hâlâ açık.** Bu MCP araç seti (Marketing API) ret sebebini expose etmiyor — `ads_get_errors` boş döndü, `ads_account_get_activity_logs` bu hesapta henüz kullanıma açılmamış ("gradually rolled out"). Kullanıcı Ads Manager'daki ret sebebini kendisi araştırıyor, öğrenince iletecek — **bu oturumda hâlâ cevap gelmedi, sıradaki oturum önce buna bakmamalı, kullanıcıdan bekliyor.** Muhtemel sebep: ilaç adı geçen klinik vaka metninin sağlık/ilaç reklam politikasına takılması — ama bu doğrulanmadı, tahmin.
2. ~~Mini TUS aktivasyon kararı bekliyor.~~ **Çözüldü (5 Temmuz):** Kullanıcı onayıyla Feed (`52561095267963`) ACTIVE edildi, Story (`52561079280163`) plana göre yedekte PAUSED bırakıldı.
3. **C3'ün tamamen aktive edilip edilmeyeceği kararı hâlâ açık.** 3 reklam da (K5, K6, K8) PAUSED — kitleler (özellikle CompleteRegistration bazlı lookalike) henüz yeterince dolmadı. Kitleler birkaç yüz kişiye ulaşınca gündeme gelmesi planlanmıştı.
4. ~~CAPI Purchase sunucu event'i hiç ateşlenmedi.~~ **Çözüldü (5 Temmuz):** Kullanıcı gerçek bir test ödemesiyle doğruladı, CAPI Purchase server-side event artık ateşleniyor.
5. ~~Meta CAPI access token rotasyonu teyit edilmedi.~~ **Çözüldü (5 Temmuz):** Kullanıcı yeni bir CAPI access token aldı, `firebase functions:secrets:set` ile Firebase secret'ı güncellendi. Eski token artık kullanımda değil.

---

## 7) Henüz Yapılmamış / Plandaki Kalan İşler

- **C2 (Mini TUS haftalık ritüel kampanyası)** Meta'da hiç kurulmadı — ürün (K1) artık hazır olduğu için istenirse şimdi kurulabilir, ya da mevcut plana göre Mini TUS reklamları şimdilik C1 içinde test edilip C2 daha sonra (kendi kitlesi/ritmiyle) kurulabilir.
- **K2 Vaka Reels serisi** — İlk video üretildi (5 Temmuz): `public/reklam/mq_pat_01_reels.mp4`, 1080×1920, 18sn, mp4 (h264+aac). Patoloji-01'in aynı soru/şık/CTA metnini kullanan kinetic-typography animasyon (hook → geri sayım → soru reveal → şık stagger → CTA pulse), `/coz/patoloji-01` landing'iyle message-match korunuyor. Üretim scripti `scripts/ads-creative/k2-vaka-reels/capture.mjs` — yeni varyant için `index.html`'deki soru/şık metnini değiştirip tekrar çalıştırılabilir.
  - **Meta'ya yüklendi, reklam kuruldu ve aktive edildi (5 Temmuz).** Kullanıcı videoyu Ads Manager'dan elle yükledi (thumbnail ayrıca yüklenemedi ama gerekmedi — Meta'nın videodan otomatik ürettiği kapak karesi `ads_get_ad_videos`'un `picture` alanından çekilip kullanıldı). Video ID: `1485496119932305`. Creative ID: `1445220184304632` (mesaj: Patoloji-01 creative'iyle birebir aynı body/title/CTA=LEARN_MORE, link `/coz/patoloji-01`). **Ad ID: `52561172814363` — C1 içinde ACTIVE**, `effective_status: PENDING_REVIEW` (Meta incelemesi sürüyor, henüz delivery yok).
  - **⏳ HATIRLATMA (kullanıcı 5 Temmuz'da istedi, henüz yapılmadı):** K2'nin **farklı bir versiyonu** üretilecek — CTA hook'u "Anında patoloji seviyeni gör" tarzı bir merak/skor vaadine çevrilecek. **Kritik:** bu hook patoloji-01/karışık-tus gibi 3 soruluk mini denemelere DEĞİL, sadece **K1 Mini TUS**'a (20 soru, kalibre edilmiş `tahminiPuan`/`topPercent`) bağlanmalı — çünkü "seviyeni gör" vaadini gerçek hesapla karşılayan tek ürün o (dürüstlük kuralı: 3 soruluk quiz'de "seviye" hesabı yok, `QuizResultScreen.jsx` sadece doğru/yanlış sayısı gösteriyor).
- **K9 UGC** — 5 dönem-6/intern öğrenciyle iş geliştirme görüşmesi hiç başlamadı (bu tamamen kullanıcı tarafı, Claude'un erişimi yok).
- **K10 post-exam kanıt altyapısı** — TUS 2026/2 sonrası "çıkanları biz sorduk" sayfası. Planda Ağustos'ta yapılması yazıyor, konu eşleştirme scripti + kanıt landing şablonu hiç yazılmadı. C4 kampanyası da bu ürüne bağlı, henüz kurulmadı.
- **Resmi "Özel Dönüşüm" (Custom Conversion) nesnesi** hâlâ yok — QuizComplete pixel event'i doğrudan hedeflendi (çalışıyor), ileride CompleteRegistration/Purchase'a geçişte bu nesneler gerekebilir.
- **PayTR panelinde işyeri adı değişikliği** — opsiyonel, panel işi, kod değil.

---

## 8) Kreatif Prompt Arşivi (ileride yeni varyant üretmek gerekirse)

Bütün kreatifler aynı marka sistemini paylaşıyor: **arka plan #070C18 (koyu lacivert), vurgu #10B981 (zümrüt), ana metin #E8EEFB, ikincil metin #8496B8**, kalın geometrik sans-serif (Archivo/Montserrat/Poppins/Anton), Türkçe karakter zorunlu, 1080×1350 (feed 4:5) veya 1080×1920 (story/reels 9:16).

**Değişmez üç kural her prompt'ta tekrarlanır:**
1. Soru görsellerinde doğru cevap asla işaretlenmez.
2. Soru/şık metinleri landing sayfasındakiyle birebir aynı olmalı (mesaj eşleşmesi kritik).
3. Uydurma istatistik/rakam yasak — gerçek veri yoksa köşeli parantez `[YER_TUTUCU]` bırakılır, kullanıcı kendisi doldurur; örnek/illüstratif rakamlar "(ÖRNEK)" + "İstatistiksel tahmindir" ile işaretlenir.

Tier 1 (K3/K4/K7), Tier 2 (K5/K6/K8) ve K1 Mini TUS (Feed+Story) promptlarının tam metinleri bu oturumun transcript'inde mevcut (satır 579, 601, 738, 976 civarı — `/root/.claude/projects/-home-user-tusoskop/aa63f9dc-6eff-5e53-8fc5-ff0791039262.jsonl`, bu path yalnızca bu ortamda geçerli olabilir). Yeni bir kreatif varyantı gerekirse aynı yapı takip edilmeli: önceki görsellerle marka tutarlılığı vurgusu + ilgili K-kodunun spesifik yerleşim/metin talimatları + üç değişmez kural.

---

## 9) Sonraki Oturum İçin İlk Adımlar (önerilen sıra)

1. Kullanıcıdan K4'ün Ads Manager'daki ret sebebini al, düzelt veya kaldır. **(hâlâ açık, kullanıcı araştırıyor)**
2. ~~Mini TUS Feed aktivasyonu için onay al.~~ **Yapıldı** — Feed ACTIVE.
3. ~~CAPI test ödemesi + dedup doğrulaması.~~ **Yapıldı** — kullanıcı doğruladı.
4. ~~Token rotasyonu.~~ **Yapıldı** — yeni CAPI token alındı, Firebase secret güncellendi.
5. Birkaç günlük C1 performans verisi birikince (QuizComplete/maliyet), K3 vs Patoloji vs Mini TUS Feed karşılaştırıp zayıf olanı C3'ün kitle doluluğuna göre değerlendir. **Şimdiki en yakın açık iş** — K4 dışında bekleyen bir aksiyon yok, veri birikmesi gerekiyor.
