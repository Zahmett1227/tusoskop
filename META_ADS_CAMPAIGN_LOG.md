# Meta Ads Kampanya Günlüğü — Patoloji-01 / TUS Mikro Deneme Funnel'ı

> Bu dosya, uzun bir sohbette (Temmuz 2026) yapılan Meta Ads kampanya kurulumu, hata ayıklama ve analiz çalışmasının **tam özetidir**. Amaç: yeni bir Claude oturumunun bu dosyayı okuyarak, önceki sohbetin hiçbir parçasını görmeden kaldığı yerden devam edebilmesi. Kod/mimari bağlamı için önce `CLAUDE.md`'deki "Meta Reklam Mikro Deneme Funnel'ı" bölümünü oku, bu dosya onun **kronolojik, ayrıntılı** eki niteliğindedir.
>
> **ÖNEMLİ:** `META_ADS_MEDIA_PLAN.md` bu projenin **asıl nihai stratejisi/mimarisidir** (Temmuz→Eylül 2026, C1/C2/C3/C4 kampanya çatısı, 10 kreatif fikri, sinyal merdiveni, bütçe, 9 haftalık takvim, guardrail'ler). Bu dosya (CAMPAIGN_LOG) o planın kronolojik uygulama günlüğü — yeni bir oturum ÖNCE media plan'ı, SONRA bu günlüğü okumalı.

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

### 8.6 CompleteRegistration fonksiyonel testi — BAŞARILI ✅ (7 Temmuz 2026, doğrulandı)
Kullanıcı 7 Temmuz ~12:4x civarı `/coz/patoloji-01` üzerinden tamamen yeni bir hesapla login denedi. İlk kontrolde `ads_get_dataset_stats` gecikmeli veri gösteriyordu, birkaç dakika sonra tekrar kontrol edilince **iki bağımsız kanıtla doğrulandı:**
- Custom Conversion `Kayıt tamamlama` (id `1012897055065152`) `last_fired_time` alanı ilk kez doldu: **2026-07-07T12:51:13-07:00** — testin yapıldığı zamanla birebir örtüşüyor.
- Events Manager Genel Bakış'ta ham "Kaydı Tamamlama" event sayacı **7 → 15**'e çıktı, "Son alma 28 dakika önce" (kullanıcının ekran görüntüsüyle teyit edildi).

**Sonuç: funnel'ın CompleteRegistration izleme zinciri (pixel event → URL-scope'lu Custom Conversion) uçtan uca çalışıyor, doğrulandı.** Bölüm 5'teki bu açık madde artık kapalı. Not: ham event sayacı (15) hesaptaki TÜM kayıtları sayıyor (sadece funnel'dan değil, `ensureUserDocument` her yeni hesapta tetikleniyor) — asıl scope'lu/güvenilir sinyal Custom Conversion'ın fire olması.

### 8.5 K1 Mini TUS Feed durduruldu (7 Temmuz 2026)
Zayıf performans (CTR %1,39, cost per link click ₺7,15 — diğer C1 reklamlarının 4-7 katı) nedeniyle `52561095267963` ("C1 · K1 Mini TUS Feed") kullanıcı onayıyla **PAUSED** durumuna alındı (`ads_update_entity`). Bütçe artık güçlü çalışan reklamlara (Patoloji-01 kanıtlanmış kreatif, K2 Vaka Reels, K3 Karışık Deneme) kayacak. C1'de artık aktif reklamlar: Patoloji-01, K2 Vaka Reels, K3 Karışık Deneme, K7 Geri Sayım, K4 Tuzak Farmakoloji (yeni onaylı, henüz teslimat yok).

**Sonraki adım:** Birkaç gün sonra C1'in genel performansını (özellikle QuizComplete/AppStoreClick — artık custom conversion'lar hazır) tekrar kontrol et, K1 Feed'in durdurulmasının bütçe dağılımına etkisini gözlemle.

## 10 — Asıl nihai plan bulundu ve gerçek denetim yapıldı (7 Temmuz 2026)

Kullanıcı `META_ADS_MEDIA_PLAN.md`'yi (Temmuz→Eylül 2026 nihai medya planı) paylaştı — bu ana kadar hiç bilinmeyen, C1/C2/C3/C4 mimarisini, sinyal merdivenini (QuizComplete→CompleteRegistration→Purchase) ve §07 ön koşullarını tanımlayan asıl strateji belgesiydi. Repoya kaydedildi, CLAUDE.md ve bu günlükten referans verildi.

### 10.1 Kod + Meta hesabı denetimi — plana göre gerçek durum

**Kampanya mimarisi (Bölüm 3):**
- C1 ✅ doğru (QuizComplete'e optimize) ama **K1 reklamları yanlışlıkla içine konmuş** (tek ad set: "C1 · TR 20-33 · Geniş", campaign_id `52561037294163`).
- **C2 (Mini TUS haftalık kampanyası) hiç yok** — plana göre K1 burada, ayrı, MiniTusComplete'e optimize olmalıydı.
- C3 PAUSED — **bu doğru**, sinyal merdiveni CompleteRegistration eşiğine (haftada 50 kayıt) bile ulaşmadı, Purchase'a optimize olmak için çok erken. (Önceki oturumdaki "C3'ü aktive edelim" önerim yanlıştı, düzeltildi.)
- C4 yok — doğru, Eylül'e kadar gerekmiyor.

**🔴 Kritik bulgu — K1'in kötü performansının kök sebebi:** K1 reklam metni (`ads_get_creatives`, creative `2007932956513390`) "20 soruda TUS'un neresinde olduğunu gör, tahmini kalibrasyon puanın ve Türkiye'de sıralaman" vaat ediyor. Ama `src/data/publicQuizCampaigns.js`'te **tek slug var: `patoloji-01`** — "mini-tus" hiç yazılmamış, 20 soruluk format/yüzdelik/paylaşım kartı (§07-6 ürün paketi) hiç kodlanmamış. Yani K1 reklamları **var olmayan bir ürünü satıyor** — muhtemelen 404 veya alakasız bir sayfaya düşüyor. Düşük CTR (%1,39) ve yüksek maliyetin (₺7,15) asıl sebebi zayıf kreatif değil, mesaj-gerçeklik uyumsuzluğu. Kalıcı çözüm: Mini TUS ürününü inşa etmek (planda zaten H2 haftası, §07-6, 3-4 gün kod işi).

**Ön koşullar (§07) — H1 haftası (6-12 Temmuz) hedefi olan 1-5 maddesi:**
| # | Ön koşul | Durum |
|---|---|---|
| 1 | Landing'de ilk soru direkt açık, "Başla" ekranı yok | ✅ Yapılmış — `PublicQuizFunnel.jsx`'te ayrı bir "başla" fazı yok, `phase` hep `"quiz"` ile başlıyor, ilk şıkka basmak (`handleSelect`) QuizStart'ı tetikliyor |
| 2 | Sonuç ekranında web kayıt birincil / App Store ikincil + cevaplar hesaba işlenir | ⚠️ Kısmen — **iOS'ta App Store hâlâ birincil CTA'ydı** (Android/Desktop'ta zaten web birincildi), **7 Temmuz'da düzeltildi** (`QuizResultScreen.jsx`, bkz. 10.2). Cevapların hesaba aktarılması (Phase-2 borcu) **hâlâ yapılmadı** — `tusoskop_quiz_result` localStorage'a yazılıyor ama hiçbir yerde okunmuyor. |
| 3 | Custom Conversions: QuizComplete + MiniTusComplete | QuizComplete ✅ (bu oturumda kuruldu), MiniTusComplete ❌ (ürün olmadığı için event de yok) |
| 4 | CAPI (sunucu taraflı Purchase + kayıt event, `paytrCallback`'ten) | ❌ Hiç yok — `functions/` içinde Facebook Conversions API çağrısı bulunmuyor |
| 5 | Custom Audiences (ViewContent/QuizStart/QuizComplete/CompleteRegistration 30-90g + %1 lookalike) | ✅ Yapılmış — 5 Temmuz'da kurulmuş (`ads_get_ad_account_custom_audiences`), WCA-ViewContent/QuizStart/QuizComplete ACTIVE, CompleteRegistration + tüm lookalike'ler henüz INACTIVE (muhtemelen küçük boyut/henüz ad set'e bağlanmamış) |

**Sonuç: Şu an H1 haftasındayız, §07'nin 5 maddesinden 2'si tam, 1'i kısmen (bu oturumda tamamlandı), 2'si (CAPI, MiniTusComplete/ürün) hiç yapılmamış.**

### 10.2 Kod fix — iOS'ta web CTA'yı birincil yap (7 Temmuz 2026)
`src/components/funnel/QuizResultScreen.jsx` — iOS cihaz bloğunda `AppStoreCta`'nın `primary` olması, planın İlke 1'ine ("satış web'de biter, App Store ikincil") doğrudan aykırıydı ve planın kendi teşhisiyle örtüşüyordu ("Web kayıt/satış 28 günde 1 kayıt 0 satış — kullanıcı App Store'da kayboluyor"). Düzeltme: Android/Desktop ile aynı desene getirildi — `WebCta` artık iOS'ta da `primary` ("Web'de Ücretsiz Devam Et"), `AppStoreCta` ikincil. Commit `claude/meta-ads-campaign-log-idhrgw` branch'inde.

### 10.3 Kullanıcı onaylı öncelik sırası
Kullanıcıya H1'in bitmemiş 3 maddesi (iOS CTA / K1'i tamamen durdurma / genel yol haritası) soruldu. **Seçim: önce iOS CTA düzeltmesi** (yukarıda 10.2, tamamlandı). Ardından kullanıcı **Phase-2 cevap aktarımı + CAPI kurulumunu** istedi (bkz. 10.4). K1'in kaderi hâlâ karar bekliyor.

### 10.4 Phase-2 cevap aktarımı + Meta CAPI kurulumu (7 Temmuz 2026, kod tamamlandı)

**Phase-2 (çözülen cevapların hesaba aktarılması) — ✅ tamamlandı:**
- `src/utils/publicQuizSession.js` → `QUIZ_RESULT_KEY` export edildi + `readAndClearQuizResult()` eklendi (localStorage'dan oku, tekrar işlenmesin diye sil).
- `src/services/publicQuizImportService.js` (yeni) → `importPublicQuizResultIfPresent(user, userData, questions)`: yanlış cevaplanan soruları `addWrongQuestion` + `upsertSmartReview(..., "wrong")` ile işler (`useStudyState.js`'teki normal yanlış-cevap akışıyla birebir aynı çağrı deseni). Doğru cevaplar hiçbir kayıt tetiklemiyor (normal akışla tutarlı).
- `src/AppAuthenticated.jsx` → `user?.uid` ve `QUESTIONS` hazır olunca bu fonksiyonu çağıran yeni bir effect eklendi, ardından `refreshSmartReviewSummary()` çağrılıyor.
- Doğal olarak idempotent: `readAndClearQuizResult` ilk okumada localStorage'ı siliyor, sonraki tetiklenmelerde `null` dönüyor.

**Meta CAPI (Conversions API) — ✅ kod tamamlandı, ⚠️ deploy öncesi bir secret gerekiyor:**
- `functions/metaCapi.js` (yeni) → `sendMetaCapiEvent(eventName, params)`: Graph API'ye `https://graph.facebook.com/v21.0/{pixel_id}/events` POST atar, `em`/`external_id` SHA-256 hash'lenir, hata asla fırlatmaz (sadece loglar, akış bozulmaz).
- **Purchase:** `functions/paytr.js` → `createPaytrTokenHandler` artık `fbp`/`fbc`/`clientUserAgent`/`clientIp`'i `premiumPurchaseIntents/{merchantOid}` dokümanına kaydediyor (istemciden: `src/services/paytrService.js` → `requestPaytrToken` artık `_fbp`/`_fbc` çerezlerini okuyup gönderiyor). `paytrCallbackHandler`, transaction'ın DIŞINDA (retry'da tekrar API çağrısı olmasın diye) `sendMetaCapiEvent("Purchase", {eventId: merchantOid, ...})` çağırıyor.
- **CompleteRegistration:** `functions/userTriggers.js` (yeni) → `users/{uid}` Firestore `onDocumentCreated` trigger'ı, `functions/index.js`'te `exports.onUserDocumentCreated` olarak bağlandı. `event_id: uid`.
- **Dedup:** `src/lib/metaPixel.js`'in `track()` fonksiyonu artık 3. parametre olarak `eventId` alıyor, `fbq(..., {eventID})` ile gönderiyor. `trackPurchase({orderId})` → eventId=merchantOid, `trackCompleteRegistration({uid})` → eventId=uid (`src/services/userService.js`'te `ensureUserDocument` çağrısına `uid` eklendi). Sunucu ve istemci aynı `event_id`'yi kullandığı için Meta ikisini tek olay sayacak.
- **Secret adı — çözülmüş isim uyuşmazlığı (7 Temmuz 2026):** Kullanıcı token'ı Firebase'e **`META_CAPI_TOKEN`** adıyla eklemişti (birkaç gün önce, başka bir oturumda). Kod başta `META_CAPI_ACCESS_TOKEN` okuyordu → uyuşmuyordu (`firebase functions:secrets:access META_CAPI_ACCESS_TOKEN` hata, `META_CAPI_TOKEN` değer döndü). Çözüm: **kod, mevcut secret ismine göre güncellendi** — `functions/metaCapi.js` ve `functions/index.js`'te tüm referanslar `META_CAPI_ACCESS_TOKEN` → `META_CAPI_TOKEN`. Token zaten Firebase'de mevcut ve geçerli, yeniden üretmeye gerek yok.
- **Bilinen ayrı sorun (bilerek düzeltilmedi, scope dışı bırakıldı):** `PublicQuizFunnel.jsx:349`'daki `trackMetaStandard("CompleteRegistration", ...)` her girişte (yeni/mevcut ayrımı yapmadan) tetikleniyor — `ensureUserDocument`'in yalnızca yeni hesapta ateşlenen kanonik event'inden ayrı, potansiyel bir çift sayım kaynağı. CAPI dedup'ı sadece kanonik event'i kapsıyor, bu ayrı çağrıyı kapsamıyor. İleride ayrıca ele alınmalı.

**Sonraki adım (secret hazır, tek kalan deploy):** `META_CAPI_TOKEN` secret'ı Firebase'de mevcut ve kod artık bu ismi okuyor. Kullanıcının yapması gereken tek şey **bu branch'i deploy etmek**: `firebase deploy --only functions`. Sonra bir test satın alma / test kayıt ile CAPI event'lerinin Events Manager'da (Entegrasyonlar → Dönüşümler API'si satırında) göründüğünü doğrulamalı.

### 10.5 K1'in kaderi — plana göre çözüldü (7 Temmuz 2026)
Kullanıcı "plan ne diyorsa o" dedi. Plan (`META_ADS_MEDIA_PLAN.md` §03): K1 (Mini TUS), **C2'nin** fikri (C1'in değil); ihtiyaç duyduğu 20 soruluk Mini TUS ürünü §07-6 ön koşulu, henüz yazılmamış (takvimde H2 işi, C2 yumuşak açılışı H3). Ayrıca "Yapma listesi": reklam görseli ile landing ilk sorusu ayrıştırılamaz — K1 var olmayan bir ürün vaat ettiği için bu kuralı ihlal ediyor. **Sonuç: her iki K1 reklamı da (`52561095267963` "K1 Mini TUS Feed" ve `52561079280163` "K1 Mini TUS") zaten PAUSED durumda — plana uygun, ek işlem gerekmedi.** `ads_get_ad_entities` ile doğrulandı. C1'de kalan aktif reklamlar (K2 Vaka Reels, K3 Karışık Deneme, K4 Tuzak Farmakoloji, K7 Geri Sayım, Patoloji-01 kanıtlanmış kreatif) hepsi planın C1 üyeleri, QuizComplete'e optimize.

**C1/C2 mimari borcu (gelecek iş, H2-H3):** K1 reklamları teknik olarak hâlâ C1 kampanyasının içindeki tek ad set'te (`52561037322763`) duruyor — PAUSED olsalar da yanlış kampanyadalar. Doğru çözüm: Mini TUS ürünü yazıldıktan sonra ayrı bir C2 kampanyası açıp K1'i orada MiniTusComplete'e optimize kurmak (Meta'da ad'ı kampanyalar arası taşımak pratik değil, yeniden oluşturmak gerekiyor — o yüzden şimdilik PAUSED bırakmak yeterli, ürün gelince C2 sıfırdan kurulacak).

## 11 — Funnel dönüşüm analizi + K4 yayında + login fix'leri (8 Temmuz 2026)

### 11.1 Yeni kod düzeltmeleri (bu oturumda, hepsi main'e merge edildi)
- **PR #16** — Meta CAPI + funnel dönüşüm iyileştirmeleri + medya planı (iOS CTA web-birincil, QuizComplete value/currency, Phase-2 import, CAPI istemci dedup, `META_ADS_MEDIA_PLAN.md`). CAPI functions **deploy edildi, canlı**. Secret adı: **`META_CAPI_TOKEN`** (kod bu isme göre güncellendi).
- **PR #17** — Phase-2 içe aktarımı bug fix (Codex P2): funnel cevapları sentetik id (`public_pat_001`) taşıyor, `Number()` ile ana bankada çözülemiyordu → her yanlış sessizce atlanıyordu. Çözüm: sorulara `bankId` (15/18/19) eklendi, import sentetik id → bankId → ana banka sorusu çözüyor.
- **PR #18** — Apple/Safari login fix: `signInWithPopup` auth başarılı olduğu halde bazen null döndürüyor (`auth/popup-closed-by-user`) → funnel modalda takılıyordu ("giriş başarılı ama Web'de Devam Et ekranında kalıyor"). Çözüm: `runLogin`'de giriş öncesi UID yakalanıp, `loginFn()` null dönse de `auth.currentUser` bu denemeyle **gerçekten değiştiyse** girişi tamamla (Codex P2 edge-case'i: mevcut oturumu olan biri popup'ı iptal edince yanlış kayıt sayılmasın diye UID karşılaştırması eklendi).

### 11.2 K4 "Tuzak Farmakoloji" artık teslimat alıyor (last_3d, 5-7 Tem)
Log 8.1'de "yeni onaylandı, henüz teslimat yok" idi. Artık aktif teslimatta: 54 gösterim · 18 tıklama · CTR %33,3 · tıklama başı ₺0,07. **⚠️ 54 gösterim çok küçük örneklem — %33 CTR henüz gürültü**, birkaç yüz gösterime ulaşınca değerlendirilecek. Diğer C1 reklamları (last_3d): Patoloji-01 kanıtlanmış 19.311 imp/%5,49/₺2,02 CPLC (harcamanın ~%75'i), K2 Vaka Reels %5,51/₺1,07 (en iyi CPLC), K3 Karışık Deneme %8,12 (en iyi CTR)/₺1,34, K7 Geri Sayım düşük hacim. C1 toplam last_3d: 24.464 imp · ₺1.099 · ~₺366/gün tempo.

### 11.3 Funnel dönüşüm sayıları (`ads_get_dataset_stats`, 30 Haz–8 Tem, YAKLAŞIK — saatlikten elle toplandı)
| Event | ~Toplam |
|---|---|
| QuizStart | ~380 |
| QuizComplete | ~210 (başlayanların ~%55'i — sağlam tamamlama) |
| WebContinueClick | ~80 |
| CompleteRegistration | ~20 (1'i kampanya öncesi) |
| AppStoreClick | ~25 |
| Purchase | 2 (ikisi de 6 Tem, yeni satış yok) |

**🔑 Login adımında kayıp hipotezi — AMA metrik geçersiz (8 Tem düzeltmesi):** İlk analizde "WebContinueClick ~80 → CompleteRegistration ~20 = ~%25 tamamlama" yazılmıştı. **Bu oran YANLIŞ/abartılı** — funnel-scoped `WebContinueClick`'i **ham** `CompleteRegistration` ile kıyaslıyor. Ham kayıt event'i `/coz` dışında da tetikleniyor (`ensureUserDocument` her yeni hesapta) + funnel'ın kendi CompleteRegistration çift-sayımı karışabilir. `ads_get_dataset_stats` aggregation=url ile doğrulandı: **20 CompleteRegistration'ın HEPSİ `https://www.tusoskop.com/` (uygulama kökü) URL'inde, HİÇBİRİ `/coz` URL'inde değil** — yani ham event funnel kaydını izole etmiyor, funnel + organik kayıtları karışık sayıyor. Gerçek funnel login tamamlama oranı bu ham orandan hesaplanamaz.
- **Doğru ölçüm için:** URL-scoped custom conversion **"Kayıt tamamlama"** (id `1012897055065152`, kuralı `coz/patoloji-01`) fire sayısı — ama bu `ads_get_customconversions`'da (config-only) görünmez; **Events Manager**'dan ya da kampanyaya-atfedilen (campaign-tagged) CompleteRegistration'dan alınmalı.
- **Login-kaybı hipotezi hâlâ makul** (Apple popup bug'ı gerçekti, PR #18 ile düzeltildi) ama **bu ham oranla ölçülemez/doğrulanamaz**. PR #18 etkisi ve optimizasyon-hedefi değiştirme kararları **URL-scoped custom conversion veya campaign-tagged event'lerle** verilmeli, bu ham oranla DEĞİL.

**Sinyal merdiveni konumu (plana göre):**
- QuizComplete ~23/gün (~160/hafta) → optimizasyon hedefi olarak fazlasıyla yeterli ✅
- CompleteRegistration ~15/hafta → **50/hafta eşiğinin ALTINDA** → henüz CompleteRegistration'a geçilmez
- Purchase 2 toplam → 25/hafta'nın çok altında
- **Sonuç: C1'i QuizComplete'e optimize tutmak DOĞRU, C3'ü (Purchase) PAUSED tutmak DOĞRU** — plan tam öngördüğü basamakta. Kayıt hacmini 50/hafta'ya çıkarmanın yolu: login kaybını kapatmak (PR #18) + hacim.

**Güvenilirlik notu:** `ads_get_dataset_stats` log 4.2'de tutarsız olabildiği notlu; bu sefer saatlik kırılım (aggregation=event) makul/tutarlı geldi ama kesin sayı için Events Manager ekran görüntüsüyle çapraz kontrol önerilir. Oranlar/hikaye küçük sayım hatalarından etkilenmeyecek kadar net.

### 11.4 H1 ön koşulları durumu (§07) — 8 Temmuz itibarıyla
1. Landing ilk soru açık ✅ · 2. Web-birincil CTA + Phase-2 ✅ (deploy edildi) · 3. QuizComplete custom conversion ✅ / MiniTusComplete ❌ (H2) · 4. CAPI ✅ (deploy edildi) · 5. Custom Audiences ✅. **H1 kod ön koşulları tamam.** Sıradaki: Mini TUS ürünü (H2, §07-6) → C2 kampanyası + duran K1'leri açar.

### 11.5 K4 breakout + güncel durum (9 Temmuz 2026)
**🌟 K4 "Tuzak Farmakoloji" gerçek kazanan çıktı.** Dün (8 Tem) 54 gösterim/%33 CTR "gürültü" diye işaretlenmişti; bugün örneklem büyüdü ve rakam TUTTU:

| Reklam (today, 9 Tem) | Gösterim | CTR | CPLC |
|---|---|---|---|
| **K4 Tuzak Farmakoloji** | 240 | **%13,75** | **₺0,31** ⭐ |
| Patoloji-01 (kanıtlanmış) | 2.714 | %6,34 | ₺1,03 |
| K2/K3/K7 | ~0-4 (Meta bugün beslemiyor) | — | — |

- K4 artık C1'in en verimli reklamı: Patoloji'nin CTR'ının ~2 katı, CPLC'sinin ~1/3'ü. Reddedilip düzeltilen kreatif (bkz. Bölüm 6 + 8.1) kazanan oldu — planın K4 fikrini ("%68 yanlış yaptı / klinik vaka + ego-merak kancası") doğruluyor. Meta henüz bütçenin çoğunu Patoloji'de tutuyor ama K4'ü beslemeye başladı; CBO olduğu için birkaç güne bütçeyi K4'e kaydırması beklenir — **Meta'nın optimizasyonuna bırak, izle.**
- **Patoloji CPLC ₺2,02 → ₺1,03'e düştü** (kampanya olgunlaştı).
- **Funnel sağlıklı:** QuizStart→QuizComplete hâlâ ~%55-65.
- **⚠️ Non-funnel PageView dalgaları:** 7-8 Tem gecesi bazı saatlerde 85-145 PageView ama ~0 ViewContent/QuizStart (ör. 8 Tem 01:00: 145 PV / 0 VC) — `/coz` dışı organik/SEO/uygulama trafiği. Bölüm 11.3'teki metrik uyarısını somut olarak doğruluyor: dataset'te bol non-funnel trafik var, funnel ölçümü scoped custom conversion'dan yapılmalı.
- **Purchase hâlâ 2** (yeni satış yok — retarget/satış katmanı henüz açık değil, plana uygun).
- **Login fix (PR #18) etkisi:** dün ~15:00 deploy oldu; sonraki kayıt penceresi çok küçük (8 Tem 23:00: 3, 9 Tem 01:00: 2) + ham event güvenilmez. 2-3 gün sonra **Events Manager "Kayıt tamamlama" custom conversion** sayısından ölçülmeli.

**Aksiyon:** Acil yok. K4'ün yükselişini izle (birkaç gün daha korursa kazanan kreatif formatı teyit). Optimizasyon hedefi ve C3/C2 kararları değişmedi — plandaki H1 basamağındayız.

## 12 — Mini TUS ürünü (H2 işi, §07-6) — Faz 1 + Faz 2 tamamlandı (10 Temmuz 2026)

Plan §07-6 / K1 (C2 kampanyası) için Mini TUS ürünü kodlandı. Kullanıcı kararları: **Faz 1 MVP önce**, **10 Temel + 10 Klinik** dağılım.

### 12.1 Faz 1 — Çekirdek (PR #22, merge edildi)
Yeni rota **`/coz/mini-tus`**: 20 soru (10 Temel + 10 Klinik, ana bankadan) → tahmini T/K puan aralığı + "Türkiye'de tahmini ilk %X" + zayıf alan ipucu → web-kayıt CTA. Mevcut 3-soruluk mini deneme akışı dokunulmadan `type` alanıyla ayrıştırıldı.
- **`src/seo/miniTusScoring.js`** — `tusScoring.js`'i yeniden kullanır: 10 soruluk mini-net → ×10 projeksiyon → **bölüm ortalamasına shrinkage (0.55)** → normal CDF yüzdelik. **Kritik dürüstlük düzeltmesi:** ham ×10 "15/20 → ilk %1" gibi savunulamaz sonuç veriyordu; shrinkage + yüzdelik tabanı (min %3) ile artık 20/20 → ilk %3, 15/20 → ilk %8, 10/20 → ilk %31, 0/20 → ilk %83. Puan **±5 band aralık** olarak. Dil her yerde "tahmini/kalibrasyon".
- **`src/data/miniTusQuestions.js`** — ana bankadan 20 soru, her biri `bankId` (Phase-2 import) + `section` ("temel"/"klinik", puan hesabı).
- **`MiniTusResultScreen.jsx`** — yeni sonuç ekranı.
- **`publicQuizCampaigns.js`** — `type: "mini_tus" | "mini_deneme"` şeması + mini-tus kampanyası (slug `mini-tus`, campaignCode `mq_minitus_01`).
- **`PublicQuizFunnel.jsx`** — tip-farkında akış, `MiniTusComplete` pixel event'i (mini_deneme'de `QuizComplete`), dinamik başlık.

### 12.2 Faz 2 — Paylaşım kartı (bu PR)
- **`src/components/funnel/miniTusShareCard.js`** — 1080×1920 (9:16 story) canvas → PNG. Skor + tahmini puan + "İLK %X" yüzdeliği; **doğru cevap GÖSTERİLMEZ** (teaser). Lacivert #070c18 + emerald #10b981. Web Share API level-2 (dosya paylaşımı), yoksa PNG indir fallback. Chrome-headless ile görsel olarak doğrulandı (kart temiz/marka-tutarlı).
- **`MiniTusResultScreen.jsx`** — "Sonuç kartını paylaş" butonu eklendi (`shareMiniTusCard`).
- **`PublicQuizFunnel.jsx`** — `share_card` (Firebase) + `MiniTusShare` (Meta pixel) event'leri.

### 12.3 Kalan — Faz 3 (yapılmadı)
- **`MiniTusComplete` custom conversion** — Events Manager'dan elle kurulmalı (event en az bir kez fire olduktan sonra; API'de create yok). Aynı şekilde istenirse `MiniTusShare`.
- **C2 kampanya kurulumu** — ayrı kampanya, MiniTusComplete'e optimize, Per–Paz yayın (plan K1). Bu, log'daki C1/C2 mimari borcunu da kapatır (K1 artık C1'de değil, gerçek bir C2 landing'i var).
- Reklam kreatifi (K1 görseli) — mesaj eşleşmesi: reklam "20 soruda nerede olduğunu gör" → landing `/coz/mini-tus`.

**Doğrulama:** Faz 1 ve Faz 2'de 354 test geçti, `vite build` + `eslint` temiz, skor kalibrasyonu ve paylaşım kartı (Chrome screenshot) doğrulandı.

### 12.4 Faz 3 kısmı — C2 kampanyası kuruldu (11 Temmuz 2026)
Kullanıcı canlıda Mini TUS'u test etti (çalışıyor), **MiniTusComplete event'i fire oldu (2 adet, 10 Tem 13:00)**. Faz 3'e geçildi.

**Karar (kullanıcı):** C2 bütçe **₺75/gün** (plan B), yayın **her gün** (day-parting sonra), başlatma yolu **A: şimdi kur + bootstrap** (custom conversion'ı beklemeden).

**Neden bootstrap:** MiniTusComplete Events Manager custom conversion seçicisinde henüz görünmüyor (2 kez, birkaç saat önce fire oldu — Meta seçiciye eklemek için birikim istiyor; QuizComplete/AppStoreClick'te de yaşanmıştı). Ayrıca sinyal merdiveni (İlke 2) ~0/hafta event'e optimizasyonu yasaklıyor. Çözüm: C2 şimdilik **ViewContent'e** optimize; hacim birikince MiniTusComplete'e çevrilecek (tek `ads_update_entity`, aynı OFFSITE_CONVERSIONS goal — sadece promoted_object custom_event_type → custom_conversion_id).

**Kurulan yapı (hepsi PAUSED — kullanıcı inceleyip yayına alacak):**
| Katman | ID | Ayar |
|---|---|---|
| Kampanya | `52564189098163` | C2 · Mini TUS Etkinliği, OUTCOME_SALES, CBO ₺75/gün (7500 kuruş) |
| Ad set | `52564189409363` | OFFSITE_CONVERSIONS → CONTENT_VIEW (ViewContent) bootstrap, TR 20-33, Advantage+, WEBSITE, pixel `1327796822800702` |
| Reklam | `52564189421963` | "C2 · K1 Mini TUS" |
| Kreatif | `995100973346876` | "C2 · Mini TUS Kreatif — mq_minitus_01"; image_hash `8acdeded48c3ee9880a41beb5e2f9feb` (eski K1'den yeniden kullanıldı), başlık "20 Soruda Nerede Olduğunu Gör", link `https://www.tusoskop.com/coz/mini-tus?campaign_code=mq_minitus_01&utm_source=facebook&utm_medium=paid_social&utm_campaign=mini_tus&utm_content=mq_minitus_01`, CTA LEARN_MORE |

- **Önizleme (MOBILE_FEED_STANDARD) doğrulandı** — kreatif ürünle birebir mesaj eşleşmesi (örnek "kalibrasyon puanın 49,7 → ilk %51" + "resmi ÖSYM puanı değildir" notu). Link doğru.
- **Bilinen kısıt — IG kimliği:** `ads_get_ig_accounts` bu hesapta henüz açık değil ("gradually rolling out"), IG user id alınamadı. Kreatif sayfa-bağlı IG kimliğiyle oluşturuldu. Kullanıcı Ads Manager'da INSTAGRAM önizlemesini + IG hesabını yayına almadan önce doğrulamalı.
- **campaignCode:** `mq_minitus_01`, slug `mini-tus` (bkz. `src/data/publicQuizCampaigns.js`).

**Sıradaki adımlar:**
1. ~~Kullanıcı: C2'yi yayına al~~ → **YAPILDI (13 Temmuz 2026):** C2 kampanya+ad set+reklam `ads_activate_entity` ile ACTIVE. Reklam Meta incelemesinden **temiz geçti** (K4'teki gibi red YOK). İlk saatler (13 Tem): 1.542 gösterim · 19 tıklama · ₺55,70 · CTR %1,23. **Erken CTR düşük ama beklenen/erken:** öğrenme fazı + ViewContent optimizasyonu (tıklayıcı değil içerik-görüntüleyici arıyor) + sonuç-teaser kreatifi (soru-teaser'dan doğal düşük CTR) + landing artık gerçek ürün. 1.5k gösterimde karar verilmez, izlenecek.
2. MiniTusComplete ~30-50/hafta olunca: Events Manager'dan custom conversion oluştur → ad set `52564189409363`'ün promoted_object'ini `{custom_conversion_id: <MiniTusComplete CC>}` yap (`ads_update_entity`).
3. Kalan Faz 3: `MiniTusShare` custom conversion (opsiyonel), in-app tarayıcı paylaşım ipucu (`isInAppBrowser()`).
4. **İzleme:** 1-2 gün sonra C2 CTR trendi + MiniTusComplete organik hacmi. Ayrıca login-fix'in (PR #18) kayıt dönüşümüne etkisini scoped "Kayıt tamamlama" custom conversion'dan ölç.

## 13 — Satış katmanı: Eylül Paketi + dershane ~120.000₺ çıpası (13 Temmuz 2026)

Kullanıcı: *"Önce plan yap. Dershane fiyatları şuan 120.000 TL civarı, buna göre detaylı plan çıkar. Amaç: satışı artırmak. Plandan çok aşırı kopmayalım."* → Onay: *"Hepsini onaylıyorum. Satışı artıracak ne varsa yap. Kaliteli yap."* Plan §07-7 + §08 + K6 satış katmanı **H5'ten (3-9 Ağu) H2'ye (şimdi) öne çekildi** — plandan yapısal sapma değil: satış hedefi + retarget Purchase plan-onaylı + C1/C2'nin sıcak havuzu zaten dolmakta. Çıpa dershane 45.000₺ → **~120.000₺** güncellendi (fark ~214× → ~572×).

### 13.1 Teşhis (neden satış ~0)
Hiçbir kampanya "satın al" demiyordu: C1→QuizComplete, C2→ViewContent (ikisi de edinim/huni tepesi). Satış katmanı (C3 + K6 + `/fiyatlandirma` kıyas) hiç kurulmamıştı. Ürün sorunu değil, **eksik katman**.

### 13.2 Kod — satış katmanı (bu oturum, tek PR)
Tek doğruluk kaynağı **`src/constants/eylulPaketi.js`** (Eylül Paketi = plus_3m'in sezonluk çerçevesi, 209,70₺; dershane çıpası ~120.000₺; kanıt satırı; günde ≈2,3₺). Dürüstlük guardrail'i dosyada belgeli.
- **Adım 0 — `/fiyatlandirma` kıyas bloğu + deep-link:**
  - `PublicSeoPages.jsx` → `PricingComparison` (React) + `scripts/generate-seo-pages.mjs` → `renderPricingComparison()` (statik prerender, SEO/no-JS) — **iki katman senkron**. Dershane ~120.000₺ vs Eylül Paketi 209,70₺ + zorunlu kanıt satırı + "farklı tür ürün" dürüstlük notu.
  - `seoContent.js` → `/fiyatlandirma` metni artık gerçek fiyat/Eylül Paketi çerçevesini yansıtıyor ("fiyat verilmez" politikası kaldırıldı — fiyatlar sunucu-otoriter ve gerçek).
  - **Deep-link `/app?intent=plus`** (`AppAuthenticated.jsx`): girişliyse doğrudan `premiumInfo`; anonimse giriş sonrası SPA state korunduğu için yine açılır. URL tüketilince temizlenir.
  - **"Eylül Paketi" adlandırması** (`PremiumInfoScreen.jsx`): plan cards üstünde dershane çıpa şeridi + plus_3m kartında "🍂 Eylül Paketi · TUS'a kadar sınırsız her şey" eyebrow. plusPlans.js **dokunulmadı** (billing güvende) — sadece EYLUL_PAKETI.planId eşleşmesiyle sunum.
- **Adım 1 — satın alma anı kartı (§08):** `src/components/funnel/EylulPaketiCard.jsx` (yeni, ortak). Funnel sonuç ekranlarına (`MiniTusResultScreen` + `QuizResultScreen`) **ikincil** kart olarak eklendi (birincil CTA hâlâ ücretsiz kayıt — soğuk edinimi bastırmıyor). En yüksek niyet anında (skor + zayıf konu görüldü) fiyat çıpası. CTA → `/app?intent=plus`, `EylulPaketiClick` (Meta) + `eylul_paketi_click` (Firebase) event'leri.
- **Adım 3 — `InitiateCheckout` köprü sinyali:** `metaPixel.js` → `trackInitiateCheckout`; `PremiumInfoScreen` token başarısında (iframe açılmadan) fire eder. ViewContent↔Purchase arası ara sinyal — C3, Purchase hacmi yokken buna optimize edilebilir. **Not: şimdilik yalnız istemci pixel'i (CAPI yok);** ad-blocker'da az sayar ama optimizasyon bootstrap'ı için yeterli. event_id=merchantOid → istenirse CAPI ile dedup edilebilir (gelecek iş).

**Doğrulama:** 354 test geçti · `vite build` (generator dâhil) + eslint temiz (0 hata; 1 önceden var olan uyarı) · `/fiyatlandirma` React bloğu Chromium'da temiz render (içerik tam, JS exception yok) · `/app?intent=plus` deep-link JS exception'sız. **Sınırlı test:** PremiumInfoScreen değişiklikleri (Eylül eyebrow, dershane şeridi, InitiateCheckout) giriş arkasında olduğu için headless sürülemedi — derleme + import'lar geçerli, mantık minimal; canlıda bir kez göz doğrulaması önerilir.

### 13.3 Sıradaki — C3 kampanyası (kuruluyor)
Retarget & satış: sıcak kitle (CompleteRegistration + QuizComplete + Mini TUS), **Purchase optimizasyonu** (plan §09 retarget istisnası), K6 Eylül Paketi ~120.000₺ çıpalı kreatif + K8 sosyal kanıt rotasyonda. Funnel: reklam → `/fiyatlandirma` → `/app?intent=plus` → PayTR → Purchase pixel+CAPI (✅ canlı). PAUSED kurulacak, kullanıcı yayına alacak. Detay bu bölümün devamına işlenecek.
