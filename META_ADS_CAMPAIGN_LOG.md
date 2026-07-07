# Meta Ads Kampanya Günlüğü — Patoloji-01 / TUS Mikro Deneme Funnel'ı

> Bu dosya, uzun bir sohbette (Temmuz 2026) yapılan Meta Ads kampanya kurulumu, hata ayıklama ve analiz çalışmasının **tam özetidir**. Amaç: yeni bir Claude oturumunun bu dosyayı okuyarak, önceki sohbetin hiçbir parçasını görmeden kaldığı yerden devam edebilmesi. Kod/mimari bağlamı için önce `CLAUDE.md`'deki "Meta Reklam Mikro Deneme Funnel'ı" bölümünü oku, bu dosya onun **kronolojik, ayrıntılı** eki niteliğindedir.

## 1. Genel bağlam

Tusoskop, `/coz/:campaignSlug` altında login-öncesi 3 soruluk bir "mini deneme" funnel'ı sunuyor (mimari detayı `CLAUDE.md`'de). Bu funnel, Meta (Instagram/Facebook) reklamlarıyla trafik çekmek için kullanılıyor. Bu sohbette:
1. İlk kez gerçek bir Meta Ads kampanyası (**patoloji-01** dersi için) sıfırdan kuruldu ve yayına alındı.
2. Funnel'da birkaç gerçek bug bulunup düzeltildi (kod + PR + merge).
3. Kampanya performansı ve pixel event'leri defalarca analiz edildi.
4. Bir "Reels/Stories vs Feed" yerleşim testi kuruldu ve olumlu sonuç alındı.
5. Kullanıcı bağımsız olarak **çok daha büyük bir kampanya yapısı** (C1/C3, çoklu kreatif varyantı) kurdu; bunlardan biri (K4 "Tuzak Farmakoloji") Meta tarafından reddedildi ve düzeltme süreci başladı (henüz tamamlanmadı).

## 2. Kimlikler (ID'ler) — hepsi tek yerde

| Ne | ID / Değer |
|---|---|
| Meta Ads hesabı (Tusoskop) | `2734371800349546` (TRY, min. günlük bütçe ₺46,81) |
| İkinci ad hesabı (görüldü, kullanılmadı) | `1822186825426707` |
| Facebook Page | `1262932140225631` ("Tusoskop") |
| Meta Pixel / Dataset adı | "Tusoskop" |
| Pixel / Dataset ID | `1327796822800702` |
| Business ID | `1538696950973323` |
| Patoloji-01 kampanya slug/kodu | slug: `patoloji-01`, campaignCode: `mq_pat_01` (bkz. `src/data/publicQuizCampaigns.js`) |
| Reklam kreatif görseli | `public/reklam/mq_pat_01.png` (repoda var, `https://www.tusoskop.com/reklam/mq_pat_01.png` üzerinden canlı) |
| Funnel linki (utm'li) | `https://www.tusoskop.com/coz/patoloji-01?campaign_code=mq_pat_01&utm_source=facebook&utm_medium=paid_social&utm_campaign=patoloji_01&utm_content=mq_pat_01` |

### 2.1 Benim (bu sohbette) kurduğum kampanya yapısı

| Seviye | ID | Ad | Durum (son bilinen) |
|---|---|---|---|
| Kampanya | `52560159975763` | Trafik \| Patoloji-01 → /coz (OUTCOME_TRAFFIC, CBO ₺160/gün) | PAUSED (kullanıcı Feed testini izole etmek için durdurdu) |
| Ad Set (orijinal, geniş) | `52560160072763` | Patoloji-01 \| TR 18-30 (Reels+Stories+Feed hepsi) | PAUSED |
| Ad Set (Feed testi) | `52560700074363` | Patoloji-01 \| TR 18-30 \| Sadece Feed Testi (`facebook_positions:["feed"]`, `instagram_positions:["stream"]`) | ACTIVE, başlangıç: 2026-07-04T11:55:44+0300 |
| Reklam (orijinal ad set altında) | `52560160146363` | Patoloji-01 Reklam | — |
| Kreatif (paylaşılan, her iki ad set'te de kullanılıyor) | `1321207569996005` | "Patoloji-01 Kreatif — mq_pat_01" — image_url: `.../reklam/mq_pat_01.png`, link: yukarıdaki utm'li URL, CTA: LEARN_MORE | ACTIVE |

Not: billing_event=IMPRESSIONS + optimization_goal=LANDING_PAGE_VIEWS kullanıldı çünkü **bu hesap LINK_CLICKS faturalamaya henüz uygun değil** ("yeni işletmelere özel birkaç haftalık kısıtlama" hatası alındı, `ads_create_ad_set` ile doğrulandı). Targeting: `{"geo_locations":{"countries":["TR"]},"age_min":18,"age_max":30}` + Advantage+ Audience açık (age suggestion olarak uygulanıyor, hard cap değil).

### 2.2 Kullanıcının BENDEN BAĞIMSIZ kurduğu yeni yapı (C1/C3) — kısmi görünürlük

Sohbetin sonlarına doğru, Meta hesabında şu YENİ kampanyalar keşfedildi (ben oluşturmadım, muhtemelen başka bir oturumda/Ads Manager'dan elle kuruldu):

| Seviye | ID | Ad | Durum |
|---|---|---|---|
| Kampanya | `52561037294163` | C1 · Çekirdek Dönüşüm — QuizComplete | ACTIVE |
| Kampanya | `52561039359763` | C3 · Retarget & Satış — Purchase | PAUSED |
| Ad Set | `52561037322763` | (C1 altında, tüm K-reklamları burada) | — |

**C1 altındaki reklamlar/kreatifler:**

| Ad ID | Ad adı | creative_id | Durum |
|---|---|---|---|
| `52561172814363` | C1 · K2 Vaka Reels — Patoloji-01 | `1445220184304632` | ACTIVE |
| `52561095267963` | C1 · K1 Mini TUS Feed | `2007932956513390` | ACTIVE |
| `52561072875563` | C1 · K7 Geri Sayım | `1034067412919221` | ACTIVE |
| `52561072857363` | C1 · K3 Karışık Deneme | `1525375429128203` | ACTIVE |
| `52561037371763` | C1 · Patoloji-01 (kanıtlanmış kreatif) | `1321207569996005` (benim oluşturduğum, yeniden kullanılmış) | ACTIVE |
| `52561072844763` | **C1 · K4 Tuzak Farmakoloji** | `2277307659682607` | **effective_status: DISAPPROVED** ⚠️ |
| `52561079280163` | C1 · K1 Mini TUS | `1565109175270607` | PAUSED |

**ÖNEMLİ — bilgi eksiği:** Bu C1/C3 yapısının targeting, bütçe, tam kreatif metinleri (body/title/link_url) hakkında **detaylı bilgim yok** — ben bunları kurmadım, sadece `ads_get_ad_entities` ile isim/ID/durum seviyesinde gördüm. Yeni oturum bu yapıyı anlamak için `ads_get_ad_entities` (level=adset/ad, campaign.id=52561037294163 filtresiyle) ve mümkünse `ads_get_creatives` ile tekrar sorgulamalı.

## 3. Kod tarafında yapılan değişiklikler (bu sohbette, hepsi `claude/campaign-launch-1wypch` branch'inden main'e merge edildi)

Tüm PR'lar **main**'e squash-merge edildi. Sırasıyla:

1. **PR #9** — `fix(funnel): AppStoreClick pixel eventini App Store geçişinden önce garantiye al`
   - Dosya: `src/components/funnel/PublicQuizFunnel.jsx`
   - Sorun: `AppStoreClick` Meta pixel event'i hiç Events Manager'da görünmüyordu. Sebep: `<a href>` üzerinden App Store'a hard navigasyon, pixel isteği ağa çıkmadan sayfayı koparıyordu.
   - Çözüm: `handleAppStoreClick` artık `event.preventDefault()` yapıyor, event'i gönderiyor, ~250ms sonra `window.location.href = appStoreUrl` ile yönlendiriyor.
   - Doğrulandı: sonraki testte AppStoreClick gerçekten geldi.

2. **PR #10** — `feat(funnel): in-app tarayıcıda Google girişi için uyarı banner'ı ekle`
   - Dosyalar: `src/utils/device.js` (yeni `isInAppBrowser()` — UA'da `FBAN|FBAV|FB_IAB|Instagram|Messenger` arıyor), `src/components/funnel/QuizContinueModal.jsx`
   - Sorun: Hiç `CompleteRegistration` gelmiyordu (0/3 giriş denemesi tamamlanıyordu). Kök sebep: Meta reklam trafiğinin çoğu Instagram/Facebook'un **uygulama-içi tarayıcısında** açılıyor, Google bu tarayıcılarda OAuth'u kendi politikasıyla engelliyor (`signInWithPopup` sessizce/karmaşık şekilde başarısız oluyor).
   - Çözüm: in-app tarayıcı tespit edilince modalda amber renkli bir uyarı banner'ı + "Linki Kopyala" fallback'i gösteriliyor ("Sağ üstteki ··· menüsünden Tarayıcıda Aç'ı seç").

3. **PR #11** — `fix(funnel): kopyalanan linke skor bilgisini göm, in-app tarayıcı geçişinde kaybolmasın`
   - Dosyalar: `src/utils/publicQuizSession.js` (yeni `buildResumeUrl(session)` / `parseResumeToken()`), `src/components/funnel/PublicQuizFunnel.jsx`, `src/components/funnel/QuizContinueModal.jsx`
   - Bu, **code review (Codex) bulgusuydu**: "Linki Kopyala" ile Instagram'dan gerçek Safari/Chrome'a geçilince `sessionStorage` taşınmadığı için tamamlanmış quiz skoru kayboluyordu — banner'ın çözmeye çalıştığı senaryonun ta kendisi kırılıyordu.
   - Çözüm: Kopyalanan linke `?qr=<base64 token>` ile `{score, completedAt}` gömülüyor; yeni tarayıcıda local session yoksa bu token'dan sonuç ekranı (skorla birlikte) doğrudan restore ediliyor. `startedAt` da `completedAt`'e eşitlenip süre hesaplaması anlamsız negatif/büyük sayı vermesin diye düzeltildi.
   - Not: Rebase gerekti çünkü GitHub squash-merge her seferinde yeni commit hash'i yaratıyor, yerel branch geçmişi ile main'in squash geçmişi ayrışıyor ("merge conflict" hatası çıktı ama gerçek bir çakışma değildi) — `git rebase origin/main` + `push --force-with-lease` ile çözüldü. **Bu pattern her yeni PR öncesi tekrar çıkabilir, aynı şekilde çözülmeli.**

4. **PR #13** — `docs(memory): patoloji-01 kampanyası kurulumu ve öğrenilenleri hafızaya ekle`
   - Dosya: `CLAUDE.md` (Patoloji-01 alt bölümü eklendi — bu dosyanın özeti niteliğinde ama çok daha kısa/öz).

## 4. Analiz bulguları

### 4.1 Kampanya performansı (orijinal geniş ad set, ~3-4 Temmuz, kümülatif son ölçüm)
- Gösterim: ~5.900, Erişim: ~5.000, Gerçek link tıklaması: ~235, Harcanan: ~₺195, CTR: ~%4,9, Cost per link click: ~₺0,83, Landing page view: ~184.
- Placement kırılımı: **Reels %2.947 gösterim/91 tıklama, Stories 965/77, Feed 1.732/63, Instream 276/5.** Yani tıklamaların **%71'i Reels+Stories'ten**.

### 4.2 Custom event'ler — güvenilirlik uyarısı
`ads_get_dataset_stats` aracı (özellikle `event_total_counts` agregasyonunda) **tutarsız/eski sayılar döndürebiliyor** — aynı anda yapılan iki farklı sorguda birbirinden çok farklı QuizStart/QuizComplete/AppStoreClick sayıları geldi. **Kritik kararlardan önce kullanıcıdan Events Manager ekran görüntüsü almak** (Genel Bakış → Toplam Olaylar listesi) API'den daha güvenilir bulundu.

Events Manager UI'dan doğrulanmış gerçek sayılar (bir ara kontrolde): PageView 82, ViewContent 10, QuizStart 2, QuizComplete 1, AppStoreClick 1, CompleteRegistration 1 (eski, kampanya öncesi — funnel'dan değil).

### 4.3 "Neden kullanıcı soruyu çözmüyor?" analizi
ViewContent→QuizStart oranı karma trafikte (Reels+Stories ağırlıklı) **%13-20** iken, kod tarafında teknik bir engel bulunamadı (rewrite kuralları, lazy-load, bundle boyutu kontrol edildi, sorun yok). Ana hipotez: **Reels/Stories kullanıcısı hızlı kaydırma modunda**, soruyu okuyup cevaplamıyor; ayrıca reklam görselinin kendisi zaten soruyu gösterdiği için sayfaya gelince merak unsuru kalmamış olabilir.

### 4.4 Feed-only test sonucu (hipotez DOĞRULANDI, iki ayrı ölçümde tutarlı)
Ad set `52560700074363` ile Reels/Stories/Instream dışlanıp sadece Feed'e (`facebook_positions:["feed"]` + `instagram_positions:["stream"]`) daraltıldı.

| Ölçüm | ViewContent | QuizStart | Oran | Cost per link click |
|---|---|---|---|---|
| 1. kontrol (~683 gösterim) | 18 | 6 | %33 | ₺1,88 |
| 2. kontrol (~1.572 gösterim) | 42 | 12 | %29 | ₺1,30 (düşüyor) |

Karma kampanyanın %13-20'lik oranına karşı Feed'in %29-33'ü **belirgin ve tekrarlanan bir fark** — örneklem büyüdükçe oran sabit kaldı, tesadüf değil. Bedel: Feed trafiği daha pahalı (cost per link click karma kampanyada ₺0,83 iken Feed'de ₺1,30-1,88) ama maliyet farkı zamanla daralıyor (reklam öğrenme fazı olgunlaştıkça). Cost per QuizStart (Feed testi, 2. ölçüm): ₺44,20 / 12 ≈ **₺3,68**.

**Sonraki adım (yapılmadı):** Örneklem 80-100 ViewContent'e ulaşınca kalıcı karar (bütçeyi tamamen Feed'e kaydırma ya da Reels/Stories'i tamamen dışlama) verilecekti — kullanıcı bunun yerine bağımsız olarak çok daha büyük bir C1/C3 yapısı kurmaya geçti (bkz. 2.2).

## 5. Custom Conversions (Events Manager) durumu

- **`QuizStart` için Custom Conversion oluşturuldu** (Events Manager UI'dan, elle — API'de create-custom-conversion aracı yok, sadece okuma var). URL kuralı: `/coz/patoloji-01` (zorunlu alan, event zaten scope'luyor ama Meta URL kuralı da istiyor).
- **`QuizComplete` ve `AppStoreClick` için henüz oluşturulmadı** — aynı yöntemle (Eylemler → Özel Dönüşümler → Oluştur → Etkinlik dropdown'dan seç → URL alanına `/coz/patoloji-01` yaz) eklenebilir. Not: event'in dropdown'da görünmesi için **yakın zamanda en az bir kez fire olmuş olması** gerekiyor.
- **`CompleteRegistration` custom conversion'ı hâlâ eklenemedi** — pixel'deki tek `CompleteRegistration` (adet 1) funnel'dan değil, uygulamanın genel kayıt akışından ve kampanya öncesinden (2 Temmuz) geliyor, bu yüzden dropdown'da güncel/ilgili olarak görünmüyor. Eklemek için `/coz/patoloji-01` üzerinden **gerçek, daha önce kullanılmamış bir Google/Apple hesabıyla** login tamamlanması gerekiyor (dikkat: gerçek hesap oluşturur).

## 6. AÇIK/DEVAM EDEN SORUN — K4 "Tuzak Farmakoloji" reddi (ÇÖZÜLMEDİ)

Kullanıcının C1 yapısındaki `52561072844763` ("C1 · K4 Tuzak Farmakoloji", creative_id `2277307659682607`) Meta tarafından **reddedildi** ("Aldatıcı veya yanıltıcı işletme uygulamaları" — Meta'nın verdiği örneklerden biri: "bir ürünün etkinliği hakkında sansasyonel/doğrulanmamış iddialarda bulunmak").

**Ekran görüntüsünden okunan mevcut (reddedilen) metin:**
- Caption: "Farmakolojinin bir klasik tuzaklarından biri. İlk denemede doğru şıkkı bulan az %3. 3 soruda kendini dene → üyelik... [Devamını Gör ile kesiliyor, tam metin görülmedi]"
- Görsel üzerinde: rozet "TUZAK", başlık "Pnömoni nedeniyle klaritromisin başlanan, aynı zamanda simvastatin kullanan 62 yaşındaki hastada birkaç gün sonra [myopati/güç kaybı/CK yükselişi ile ilgili bir soru, tam metin görülmedi]"

**Kök sebep teşhisi:** "az %3" gibi kanıtlanamaz istatistik iddiası + "TUZAK" kelimesinin clickbait/yanıltıcı çağrışımı, Meta'nın otomatik inceleme sistemini tetiklemiş olabilir. Soru içeriğinin kendisi (ilaç etkileşimi vakası) sorun değil — zaten onaylı `mq_pat_01` kreatifi de benzer klinik vaka içeriği kullanıyor ve sorunsuz çalışıyor.

**Önerilen düzeltme (kullanıcıya iletildi, henüz UYGULANMADI/DOĞRULANMADI):**
1. Rozet: `TUZAK` → `TUS MİNİ DENEME` (kanıtlanmış, onaylı kelime — `mq_pat_01`'de kullanılıyor)
2. Konu etiketi: nötr bir ifadeye çevrilsin, örn. `FARMAKOLOJİ · İLAÇ ETKİLEŞİMİ`
3. Caption'daki "az %3" istatistiği tamamen kaldırılsın. Önerilen yeni caption:
   > "Farmakolojide sık çıkan bir klinik vaka sorusu 👇 30 saniyede çözebilir misin? 3 soruluk ücretsiz TUS mini denemesini hemen dene. Üyelik gerekmez."
4. Soru metni (klinik vaka) aynı kalabilir.

**Bloke olan şey:** `ads_get_creatives` ve `ads_get_ad_images` araçları bu sohbetin sonunda sürekli **"MCP tool call requires approval"** hatası veriyordu — `ads_get_ad_entities` sorunsuz çalışırken bu ikisi çalışmıyordu (genel bağlantı sorunu değil, bu araçlara özel bir yetki/scope kısıtlaması gibi görünüyor, kullanıcının bağlantıyı yenilemesi bunu çözmedi). Bu yüzden:
- K4 kreatifinin **tam/gerçek metni** (body/title/link_url/image_hash) hiç API'den doğrulanamadı — yukarıdaki metin sadece ekran görüntüsünden okundu, kesin değil.
- Görsel dosyasına (image_hash/image_url) erişilemediği için API üzerinden düzeltilmiş bir kreatif **oluşturulamadı**.
- Kullanıcıya, Ads Manager'daki "Reklam kreatifini düzenle" butonundan **elle** düzeltmesi önerildi (bu daha hızlı ve zaten Meta'nın "reddedilen reklamı düzenle → yeniden incelemeye gönder" akışını doğru tetikliyor).

**Yeni oturum için net görev:** Kullanıcıya K4'ü düzeltip düzeltmediğini sor. Düzeltmediyse: (a) önce `ads_get_creatives` / `ads_get_ad_images` araçlarının artık çalışıp çalışmadığını test et, çalışıyorsa creative_id `2277307659682607`'nin tam mevcut metnini çek ve yukarıdaki öneriyi kesinleştir; (b) düzeltildiyse Meta incelemesinin sonucunu (`effective_status`) kontrol et.

## 7. Genel araç/altyapı notları (yeni oturum için)

- **Meta Ads MCP sunucusu sık sık disconnect/reconnect oluyor** (bu sohbette defalarca oldu) — araç çağrısı "No such tool available" hatası verirse önce `ToolSearch` ile yeniden yükle, hâlâ "MCP tool call requires approval" hatası alırsan kullanıcıdan bağlantıyı yenilemesini iste. Bazen bu genel bir sorun, bazen (bu oturumun sonunda olduğu gibi) sadece belirli araçlara özel kalıcı bir kısıtlama olabilir — birkaç farklı aracı deneyip ayırt et.
- **Custom Conversion oluşturma API'de yok** — sadece Events Manager UI'dan elle yapılabiliyor (`ads_get_customconversions` sadece okuma). Event dropdown'da görünmesi için event'in yakın zamanda en az bir kez fire olmuş olması gerekiyor.
- **GitHub squash-merge sonrası branch geçmişi ayrışıyor** — yeni bir PR açmadan önce `git fetch origin main && git rebase origin/main && git push --force-with-lease` yapılmalı, yoksa gerçek olmayan bir "merge conflict" hatası çıkıyor.
- Proje branch'i: `claude/campaign-launch-1wypch` (bu sohbette kullanılan feature branch, main'e sürekli squash-merge edildi).

## 8. Güncelleme — 7 Temmuz 2026 (yeni oturum)

Önceki oturumun bıraktığı "net görev" (Bölüm 6: K4 reddini kontrol et) ele alındı. Özet: **K4 sorunu çözülmüş.**

### 8.1 K4 "Tuzak Farmakoloji" reddi — ÇÖZÜLDÜ ✅
- Reklam `52561072844763` ("C1 · K4 Tuzak Farmakoloji") artık **`effective_status: ACTIVE`** (onaylı, teslimatta).
- Çözüm yöntemi: reddedilen kreatif değiştirilmiş. Ad'ın `creative_id`'si artık **`1857961992063106`** (eski reddedilen `2277307659682607` değil).
- Yeni onaylı kreatif (`1857961992063106`) metni — Bölüm 6'daki önerinin neredeyse birebir uygulanmış hali:
  - **title:** `TUS MİNİ DENEME`
  - **body:** "Farmakolojide sık çıkan bir klinik vaka sorusu 👇 30 saniyede çözebilir misin? 3 soruluk ücretsiz TUS mini denemesini hemen dene. Üyelik gerekmez."
  - "az %3" istatistiği tamamen kaldırılmış.
  - `call_to_action_type: LEARN_MORE`.
- **Not (küçük risk):** yeni kreatifin `image_hash`'i (`36e15163eee256939ae061972e756e70`) eski reddedilen kreatifle **aynı** — yani görsel değişmemiş, sadece metin (title/body) değişmiş. Eğer "TUZAK" rozeti görselin İÇİNE gömülüyse hâlâ görünüyor olabilir; ama Meta onayladığı için asıl tetikleyici metin istatistiği imiş. Yine de kreatif adı ("...mq_far_02...") ve görsel eski Tuzak temasını taşıyor olabilir, ilerideki bir revizyonda görsel de nötrleştirilebilir.
- **Araç durumu:** `ads_get_creatives` ve `ads_get_ad_images` bu oturumda **sorunsuz çalıştı** (önceki oturumdaki "MCP tool call requires approval" kısıtlaması geçmiş).

### 8.2 Güncel kampanya yapısı ve performans (last_7d, 30 Haz–6 Tem 2026)

Hesaptaki kampanyalar (`ads_get_ad_entities`, level=campaign):

| Kampanya ID | Ad | Durum | Objective | Imp | Clicks | Harcama | CTR | CPLC |
|---|---|---|---|---|---|---|---|---|
| `52561037294163` | C1 · Çekirdek Dönüşüm — QuizComplete | **ACTIVE** | OUTCOME_SALES | 13.144 | 732 | ₺674,72 | 5,57% | ₺1,87 |
| `52561039359763` | C3 · Retarget & Satış — Purchase | PAUSED | OUTCOME_SALES | — | — | — | — | — |
| `52560159975763` | Trafik \| Patoloji-01 → /coz | PAUSED | LINK_CLICKS | 8.027 | 387 | ₺254,10 | 4,82% | ₺0,89 |
| `52555647897963` | Trafik \| Vaka → /basla | PAUSED | LINK_CLICKS | — | — | — | — | — |
| `52554241997363` | Yeni Bilinirlik Kampanya | PAUSED | AWARENESS | — | — | — | — | — |

**Tek aktif kampanya artık C1** (`52561037294163`, OUTCOME_SALES, QuizComplete'e optimize). Benim önceki oturumda kurduğum Trafik kampanyası (`52560159975763`) ve Feed testi ad set'i artık PAUSED — kullanıcı C1 dönüşüm yapısına geçmiş.

C1 altındaki reklamlar (last_7d):

| Ad ID | Ad | Durum | Imp | Clicks | Harcama | CTR | CPLC |
|---|---|---|---|---|---|---|---|
| `52561037371763` | C1 · Patoloji-01 (kanıtlanmış kreatif) | ACTIVE | 8.267 | 510 | ₺409,70 | 6,17% | ₺1,91 |
| `52561172814363` | C1 · K2 Vaka Reels — Patoloji-01 | ACTIVE | 2.014 | 113 | ₺89,19 | 5,61% | **₺1,04** ✅ |
| `52561072857363` | C1 · K3 Karışık Deneme | ACTIVE | 1.162 | 80 | ₺72,22 | **6,88%** ✅ | ₺1,72 |
| `52561095267963` | C1 · K1 Mini TUS Feed | ACTIVE | 1.588 | 22 | ₺100,11 | **1,39%** ⚠️ | **₺7,15** ⚠️ |
| `52561072875563` | C1 · K7 Geri Sayım | ACTIVE | 113 | 7 | ₺3,50 | 6,19% | ₺1,17 |
| `52561072844763` | C1 · K4 Tuzak Farmakoloji | ACTIVE | henüz teslimat yok (yeni onaylandı) | | | | |
| `52561079280163` | C1 · K1 Mini TUS | PAUSED | — | — | — | — | — |

### 8.3 Actionable bulgu (karar kullanıcıya bırakıldı, henüz uygulanmadı)
- **`52561095267963` "K1 Mini TUS Feed" bariz zayıf performanslı:** CTR %1,39 (diğerleri %5-7), cost-per-link-click ₺7,15 (diğerleri ₺1-2). ₺100 harcayıp sadece 22 tıklama getirmiş. En güçlü aday olan "kanıtlanmış kreatif" ve "K2 Vaka Reels" varken bu reklam bütçe yiyor. Öneri: bu reklamı PAUSE et (kullanıcı onayı bekliyor). NOT: C1 OUTCOME_SALES/QuizComplete'e optimize olduğu için nihai metrik link-click değil QuizComplete; ama link-click ve CTR proxy olarak zayıf performansı net gösteriyor.
- QuizComplete/AppStoreClick gerçek sayıları bu güncellemede çekilmedi (log Bölüm 4.2 uyarısı: `ads_get_dataset_stats` güvenilmez; Events Manager ekran görüntüsü daha sağlıklı).

### 8.4 Hâlâ açık kalan işler (Bölüm 5'ten devam)
- ~~`QuizComplete` ve `AppStoreClick` için Custom Conversion~~ → **doğrulandı, üçü de kurulu (7 Temmuz 2026):**
  - `Kayıt tamamlama` (id `1012897055065152`) — event=`CompleteRegistration`, URL `coz/patoloji-01` içeriyor
  - `Quiz tamamlama` (id `1013559844976709`) — event=`QuizComplete`, URL `/coz/patoloji-01` içeriyor
  - `AppStore tıklama` (id `850413834588863`) — event=`AppStoreClick`, URL `/coz/patoloji-01` içeriyor
  - Not: İlk denemede sadece "Kayıt tamamlama" oluşmuştu, kullanıcı Events Manager'ın **Genel Bakış → Olay hareketleri** (ham event listesi) sayfasını **Eylemler → Özel Dönüşümler** (asıl Custom Conversion oluşturma sayfası) sanmıştı — ikinci denemede doğru sayfadan diğer ikisini de ekledi. Üçünün de `last_fired_time` hâlâ `null` (yeni oluşturuldular, bir sonraki eşleşen event'te dolacak).
- `CompleteRegistration` **gerçek fonksiyonel testi** hâlâ yapılmadı — kullanıcı `/coz/patoloji-01` üzerinden yeni bir Google/Apple hesabıyla login tamamladıktan sonra deneyecek.
- **Events Manager Genel Bakış'tan görülen ham event hacmi (9 Haz–6 Tem 2026 aralığı, olumlu sinyal):** PageView 767, İçerik Görüntüleme (ViewContent) 490, QuizStart 188, QuizComplete 107, WebContinueClick 30, AppStoreClick 15, Kaydı Tamamlama 7, Alışveriş (Purchase) 2. Purchase event'i `/coz` funnel'ından bağımsız — uygulamanın genelinde gerçek PayTR Plus satın alımlarından geliyor (`PaytrCheckoutModal.jsx`), kampanya döneminde 2 gerçek satın alma olmuş.
- ~~Aksiyon gerektirebilir: "geçerli para birimi kodları gönderin" uyarısı~~ → **kök sebep bulundu ve düzeltildi (7 Temmuz 2026).** Uyarı Purchase ile değil **`QuizComplete`** event'iyle ilgiliymiş (Events Manager'daki "Detaylar" ekranı: "Olay adı: QuizComplete, % etkilendi: 100, Sorun: Para birimi alanı eksik"). Sebep: `src/components/funnel/PublicQuizFunnel.jsx` içindeki `trackMetaCustom("QuizComplete", {...})` çağrısı `value`/`currency` alanları olmadan gönderiliyordu — C1 kampanyası bu event'e (OUTCOME_SALES) optimize olduğu için Meta ROAS hesaplayamıyordu. **Çözüm:** kullanıcı onayıyla `value: 1, currency: "TRY"` (sembolik/placeholder değer — gerçek LTV verisi henüz yok) eklendi. Commit `claude/meta-ads-campaign-log-idhrgw` branch'inde.

### 8.6 CompleteRegistration fonksiyonel testi — sonuç belirsiz (raporlama gecikmesi)
Kullanıcı 7 Temmuz ~12:4x civarı `/coz/patoloji-01` üzerinden tamamen yeni bir hesapla login denedi. `ads_get_dataset_stats` (event=CompleteRegistration) sorgusunda en güncel veri hâlâ 7 Temmuz 02:00 gösteriyordu (testin birkaç saat öncesi) — API'nin event istatistikleri gerçek zamanlı değil, birkaç saatlik gecikmeli olabiliyor. **Sonuç doğrulanamadı, kesinleşmedi.** Yeni oturum: Events Manager → Genel Bakış'taki "Kaydı Tamamlama" sayacının 7'den arttığını kontrol et, ya da Custom Conversion'ın (`1012897055065152`) `last_fired_time` alanının artık `null` olmadığını doğrula.

### 8.5 K1 Mini TUS Feed durduruldu (7 Temmuz 2026)
Zayıf performans (CTR %1,39, cost per link click ₺7,15 — diğer C1 reklamlarının 4-7 katı) nedeniyle `52561095267963` ("C1 · K1 Mini TUS Feed") kullanıcı onayıyla **PAUSED** durumuna alındı (`ads_update_entity`). Bütçe artık güçlü çalışan reklamlara (Patoloji-01 kanıtlanmış kreatif, K2 Vaka Reels, K3 Karışık Deneme) kayacak. C1'de artık aktif reklamlar: Patoloji-01, K2 Vaka Reels, K3 Karışık Deneme, K7 Geri Sayım, K4 Tuzak Farmakoloji (yeni onaylı, henüz teslimat yok).

**Sonraki adım:** Birkaç gün sonra C1'in genel performansını (özellikle QuizComplete/AppStoreClick — artık custom conversion'lar hazır) tekrar kontrol et, K1 Feed'in durdurulmasının bütçe dağılımına etkisini gözlemle.
