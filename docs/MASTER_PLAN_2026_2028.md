# Tusoskop Master Plan — 2026 Temmuz → 2028 Haziran

> Hazırlanma tarihi: 2026-07-06. Kaynak: repository'nin `main` branch'i (commit `6027bdd`) üzerinde
> yapılan kod incelemesi + `CLAUDE.md` + `reports/` altındaki denetim raporları.
> Bu doküman kanıt ile varsayımı ayırır: **[KANIT]** = repoda doğrulandı, **[VARSAYIM]** = repoda
> kanıt yok, açıkça varsayıldı.

## 0. Görev Tanımıyla Çelişkiler (önce bunlar)

| İddia | Repodaki durum |
|---|---|
| `docs/CURRENT_STATE.md` okunmalı | **Dosya yok.** `docs/` altında sadece `QUESTION_BANK_QUALITY_WORKFLOW.md` var. |
| "302 test" | **Doğrulanamadı.** Repoda 10 sabit deneme (200 soruluk, `src/data/exams.js`) + 150 benzersiz konu (audit raporu) var. Konu testleri dinamik üretiliyor; "302" sayısına hiçbir yerde rastlanmadı. |
| "20 soruluk Mini TUS üzerinde çalışılıyor" | **Repoda hiçbir iz yok** (grep: `miniTus/kalibrasyon/percentile` → 0 sonuç). Plan aşamasında kabul edildi. |
| "Pixel ve CAPI ölçüm ihtiyaçları" | Pixel var (`src/lib/metaPixel.js`), **CAPI yok** — ihtiyaç doğru, uygulama yok. |
| iOS `ios-appstore-v1` branch'i | **Bu klonda görünmüyor** (remote'ta yalnızca `main` + plan branch'i). iOS'a dair her şey CLAUDE.md'ye dayalı [VARSAYIM]. |
| Soru sayısı 7000+ | **[KANIT]** `_manifest.json` toplamı = 7077. Ancak `reports/question-bank-quality-audit.md` 5687 soruyla üretilmiş (2026-05-24) → **audit bayat**, son ~1390 soru kalite denetiminden geçmemiş görünüyor. |

---

## 1. MEVCUT DURUM ANALİZİ (10 üzerinden)

### 1.1 Ürün değeri — **7/10**
**[KANIT]** 7077 soru / 11 ders (`_manifest.json`), FSRS scheduler (`src/utils/smartReviewScheduler.js`, 396 satır, testli), 10 sabit 200'lük deneme, haftalık lig (temel/klinik iki lig, `leaderboardService.js`), streak, konu takip tablosu (`TopicTrackerData.js`), premium'a özel Gemini 2.5 Flash tabanlı günlük AI çalışma planı (`functions/services/generateAiStudyPlan.js`, JSON şema doğrulamalı, fallback'li). Bu, tek kurucu için olağanüstü geniş bir yüzey.
**Eksik:** Ürünün en değerli parçası (FSRS) ile konu yeterliliği birleşmiyor; kullanıcıya "senin TUS'un nerede" diyen kalibrasyon katmanı yok.

### 1.2 İlk kullanıcı deneyimi — **5/10**
**[KANIT]** `/coz` funnel'ı login'siz 3 soru çözdürüyor, session resume + in-app browser uyarısı gibi inceliklerle (`PublicQuizFunnel.jsx`). PublicHome + SEO sayfaları hızlı (auth lazy-load).
**Eksik [KANIT]:** Login sonrası onboarding YOK — yeni kullanıcı dashboard'a düşüyor, TUS tarihi/hedef/mevcut seviye sorulmuyor (`Dashboard.jsx`'te sadece `targetScore`). `/coz`'da çözülen cevaplar hesaba taşınmıyor (CLAUDE.md'de "bilinen sınır" olarak kayıtlı).

### 1.3 Aktivasyon — **4/10**
**[KANIT]** Aktivasyon tanımı yok; ölçülen tek şey `CompleteRegistration` (`userService.js:59`). "Aha anı"na (ilk FSRS tekrarının işe yaraması) götüren tasarlanmış bir akış yok. `signup_start` funnel'da var ama kayıt→ilk soru→ilk tekrar zinciri eventlenmemiş.

### 1.4 Kullanıcı tutma — **4/10**
**[KANIT]** FSRS + streak + haftalık lig geri dönüş nedeni yaratıyor; ancak **hiçbir geri çağırma kanalı yok**: FCM/push yok, e-posta altyapısı yok (grep: `fcm|messaging|sendEmail|resend` → 0). Kullanıcı uygulamayı kendisi hatırlamak zorunda. Streak gün sınırı UTC (`streakService.js` `toISOString()`), yani TR'de gün 03:00'te dönüyor — gece çalışan tıp öğrencisi için streak kırılması riski. `scripts/seedFakeLeaderboard.mjs` ile sahte lig kullanıcısı ekleme scripti var — kısa vadede motivasyon, uzun vadede güven riski.

### 1.5 Monetizasyon — **5/10**
**[KANIT]** PayTR entegrasyonu sağlam: fiyat sunucu tablosundan (`functions/paytr.js` `PAYTR_PLANS`), hash doğrulamalı, idempotent aktivasyon, `premiumUntil` uzatmalı. Fiyatlar: 89,90 / 209,70 / 359,40 TL. Purchase pixel'i backend-onaylı anda atılıyor.
**Eksik:** Deneme yok, yıllık plan yok, win-back yok, iptal kavramı yok (süreli erişim — aslında avantaj), süresi biten kullanıcıya hiçbir şey olmuyor. iOS'ta IAP yok [VARSAYIM: ios branch görünmüyor]; PayTR web-only olduğundan iOS kullanıcısının ödeme yolu belirsiz → Apple 3.1.1 riski (bkz. Red Team).

### 1.6 İçerik kalitesi — **6/10**
**[KANIT]** Üç kapılı kalite hattı var (`validate/audit/review:questions`, `docs/QUESTION_BANK_QUALITY_WORKFLOW.md`) ve CI'da format kapısı çalışıyor. Ancak: audit raporu 5687 soruyla bayat (bugün 7077), 755 orta bulgu açık, **soru versiyonlama yok**, **kullanıcıdan soru hata bildirimi alma özelliği yok** (StudyScreen'deki `feedback` cevap geri bildirimi, hata raporu değil).

### 1.7 Teknik güvenilirlik — **6/10**
**[KANIT]** CI: lint + 39 vitest dosyası + soru validasyonu + build + Playwright (tek `smoke.spec.js`). ErrorBoundary var. Ancak: **hata izleme yok (Sentry vb. → 0 sonuç)** — üretimde kullanıcı hatası görünmez; `test:rules` scripti var ama **CI'da çalışmıyor** (`ci.yml`'de yok); Cloud Functions'ın hiç testi yok; `usageLimitService` callable hata verirse local fallback'e düşüyor (audit raporu "Orta" bulgu).

### 1.8 Güvenlik — **7/10**
**[KANIT]** `reports/firebase-security-audit.md` (2026-05-17) kritik bulgu yok demiş; audit önerileri **uygulanmış**: `firestore.rules`'ta `role/isAdmin/admin` artık diff korumasında (L111-125), purchase intent create'e katı key allowlist gelmiş (L237-269). PayTR secret'ları Secret Manager'da.
**Açık kalan:** `weeklyLeaderboard/{week}/users/{uid}` owner'a serbest yazım — istemci istediği skoru yazabilir (hile); `results`/`studySessions` create'te içerik doğrulaması yok (sahte skor).

### 1.9 Analitik ve attribution — **4/10**
**[KANIT]** Dört sistem var (GA4, Meta Pixel, Clarity, backend `publicQuizSessions`/`campaignClicks`) ama **tek bir taxonomy dokümanı yok**; funnel eventleri (`quiz_landing_view`...) yalnızca CLAUDE.md'de. CAPI yok → iOS ATT + ad-blocker kaybı ölçülemiyor. Purchase deduplication `merchantOid` ile Pixel'de var, GA4'te purchase eventi hiç yok. Kayıt→ödeme arası attribution `acquisition` alanıyla sınırlı (utm-only, tıklama ID'leri kayboluyor: `hasValidAcquisitionShape` yalnızca source/medium/campaign tutuyor, `fbclid` tutulmuyor).

### 1.10 SEO — **7/10**
**[KANIT]** Üç render katmanı (React + statik prerender + ana sayfa statik DOM), www canonical, sitemap/robots otomatik, 11 branş sayfası + puan hesaplama + kontenjan tablosu araç sayfaları, JSON-LD (FAQ hizalamalı). Tek kurucu için çok iyi altyapı.
**Bilinmeyen [VARSAYIM]:** Gerçek sıralama/trafik verisi repoda yok; otorite (backlink) muhtemelen zayıf; içerik (blog/konu anlatımı) katmanı yok.

### 1.11 Reklam funnel'ı — **5/10**
**[KANIT]** `/coz` mimari olarak iyi (izole bundle, beacon logging, resume token, AppStoreClick garantisi #9, in-app browser banner #10, link-copy skor taşıma #11 — son 3 commit bunlara harcanmış). Ancak **tek aktif kampanya** var (`publicQuizCampaigns.js`'te 1 slug), sonuç ekranından hesaba köprü zayıf (cevaplar taşınmıyor), Mini TUS yok, funnel'ın dönüşüm verisi repoda yok.

### 1.12 Uzun vadeli rekabet avantajı — **5/10**
FSRS + kullanıcı başına öğrenme verisi doğru moat adayı; ama bugün moat değil çünkü: kalibrasyon/percentile verisi toplanmıyor, FSRS çıktısı "bugün şu kadar kart due" düzeyinde, konu yeterliliğiyle birleşmiyor, veri ağı etkisi (kullanıcı arttıkça ürün iyileşir döngüsü) kurulmamış. İçerik hacmiyle dershanelere karşı moat kurulamaz — bu doğru teşhis.

**Toplam görünüm:** Güçlü mühendislik temeli + geniş özellik yüzeyi, ama ölçüm/aktivasyon/geri çağırma üçlüsü zayıf. Ürün "iyi yapılmış ama kendini kanıtlayamayan ve kullanıcıyı geri çağıramayan" durumda.

---

## 2. STRATEJİK KONUMLANDIRMA

- **Tek cümlelik vaat:** "Tusoskop, ne çözdüğünü unutmadan önce sana geri getiren ve TUS gününe kadar tam olarak neye çalışacağını söyleyen kişisel TUS koçudur."
- **İdeal hedef kullanıcı:** TUS'a 3-12 ay kalmış, dershane kaynağı (video/kitap) zaten olan, fakat *soru pratiği + tekrar disiplinini* telefonundan yönetmek isteyen 5.-6. sınıf tıp öğrencisi ve pratisyen hekim. (Dershane *yerine* değil, dershanenin *yanına*.)
- **En önemli üç problem:**
  1. "Çözdüğümü unutuyorum; neyi ne zaman tekrar edeceğimi bilmiyorum." (FSRS bunu çözer — mevcut güç)
  2. "Nerede olduğumu bilmiyorum: bu netle kaçıncı yüzdelikteyim, hangi branşım beni batırıyor?" (kalibrasyon — henüz yok)
  3. "Sınırlı zamanımı hangi konuya harcayacağıma karar veremiyorum." (adaptif plan — AI plan embriyosu var)
- **Savunulabilir avantaj:** Kullanıcı başına biriken *hafıza verisi* (FSRS state) + *kalibrasyon verisi* (sabit denemelerdeki dağılım). İkisi birleşince rakibin kopyalayamayacağı şey ürün değil, **kullanıcının kendi geçmişi** olur; geçiş maliyeti yaratır.
- **Kesinlikle rekabet edilmeyecek alanlar:** video ders üretimi, hoca kadrosu, basılı kitap, "en çok soru" yarışı, kurumsal/dershane B2B satışı, TUS dışı sınavlar (ilk 24 ay).
- **North Star Metric (NSM):** **Haftalık Kararlı Tekrarcı (Weekly Committed Reviewers)** = o hafta en az 3 farklı günde due FSRS tekrarını tamamlamış kullanıcı sayısı. (Değer üretimi + retention + monetizasyon öncülü tek metrikte.)
- **Aktivasyon tanımı:** Kayıttan sonraki **72 saat içinde ≥20 soru çözmüş VE ilk 7 gün içinde ≥1 due tekrar oturumu tamamlamış** kullanıcı. (Event: `activation_completed`.)
- **Retention tanımı:** **W4 tekrar retention** = kayıt haftasından 4 hafta sonra hâlâ en az 1 tekrar oturumu tamamlayan kullanıcı oranı.
- **Uzun vadeli moat stratejisi:** (a) Her kullanıcının FSRS hafıza grafiği + konu yeterlilik haritası → taşınamaz kişisel değer; (b) sabit denemeler + Mini TUS'tan gelen anonim skor dağılımı → Türkiye'de gerçek zamanlı TUS kalibrasyon verisi (tek kurucunun bile toplayabileceği, dershanelerin paylaşmadığı veri); (c) bu ikisinden üretilen "TUS tarihine adaptif günlük kuyruk" — kopyalanması aylar süren, veri gerektiren özellik.

---

## 3. 18-24 AYLIK MASTER PLAN

Öncelik zinciri her dönemde: **güvenilirlik → ölçüm → aktivasyon → retention → monetizasyon → ölçeklenme.**

### Dönem 1 — İlk 30 gün (2026 Tem): "Görebilir hale gel"
- **Ana amaç:** Üretimde ne olduğunu görmek (hata + funnel + gelir tek bakışta) ve bilinen güvenilirlik çukurlarını kapatmak.
- **İşler:** (1) Sentry (web+functions) kur; (2) `docs/METRICS_AND_EVENTS.md`'deki taxonomy'yi koda uygula — kayıt→ilk soru→ilk tekrar zinciri eventleri; (3) `test:rules`'ı CI'ya ekle; (4) streak/limit gün sınırını Europe/Istanbul'a çevir; (5) `/coz` cevaplarını kayıt sonrası hesaba taşı (localStorage'da zaten duruyor); (6) soru içi "hata bildir" butonu (mailto değil, Firestore `questionReports`).
- **Kullanıcı etkisi:** Görünmez hata kaybı durur; funnel'dan gelen kullanıcı emeğini kaybetmez.
- **Teknik bağımlılık:** Yok — hepsi mevcut altyapı üstüne.
- **Başarı metriği:** Üretim hatalarının %100'ü Sentry'de; aktivasyon funnel'ı GA4'te uçtan uca görünür; `/coz`→kayıt dönüşümünde cevap taşıma sonrası artış ölçülebilir.
- **Riskler:** Ölçüm işi "görünmez iş" — motivasyon düşebilir. Panzehir: her hafta tek kullanıcıya dokunan 1 iş (hata bildir butonu gibi).
- **Geçiş kriteri:** Taxonomy'deki Tier-1 eventler 7 gün kesintisiz veri üretiyor.
- **Yapılmaması gerekenler:** Yeni içerik ekleme, yeni kampanya kreatifi, Mini TUS'a başlamak (ölçüm hazır değilken).

### Dönem 2 — 31-90 gün (Ağu-Eyl 2026): "Mini TUS + aktivasyon"
- **Ana amaç:** Mini TUS'u (20 soru, kalibrasyon puanı + yüzdelik) funnel'ın merkezine koymak; aktivasyonu tanımlı orandan yönetmek.
- **İşler:** Mini TUS motoru (sabit 20 soru, `examBlueprints` dağılımından); kalibrasyon v1 = `tusScoring.js` çapa tablosu + sabit deneme sonuç dağılımı (`results` koleksiyonu) — veri azken "tahmini aralık" göster, kesin yüzdelik iddia etme; kayıt sonrası 3 adımlı onboarding (TUS tarihi → hedef branş → Mini TUS daveti); `/coz` sonuç ekranından Mini TUS'a köprü; 2-3 yeni `/coz` kampanyası (kanıtlanmış şablonla).
- **Kullanıcı etkisi:** "Neredeyim?" sorusuna ilk cevap; kayıt olan kullanıcının ilk 10 dakikası tasarlanmış olur.
- **Teknik bağımlılık:** Dönem 1 eventleri (aktivasyon ölçülemiyorsa Mini TUS etkisi de ölçülemez).
- **Başarı metriği:** Aktivasyon oranı ≥%35 (taban ölçülüp +10 puan hedeflenir [VARSAYIM: taban bilinmiyor]); Mini TUS tamamlama ≥%60.
- **Riskler:** Kalibrasyonun güvenilirliği — az veriyle yüzdelik iddiası itibar yakar. Panzehir: aralık + "ilk N kullanıcı verisiyle" şeffaflığı.
- **Geçiş kriteri:** Mini TUS→kayıt dönüşümü `/coz`→kayıt'tan yüksek VE aktivasyon eventi güvenilir.
- **Yapılmaması gerekenler:** Push/e-posta altyapısı (henüz), fiyat değişikliği, Android.

### Dönem 3 — 3-6 ay (Eki 2026-Oca 2027): "Geri çağırma + FSRS'i hissettir"
- **Ana amaç:** Retention'ı kanal + ürün döngüsüyle büyütmek. (2027 TUS 1. dönem sezonu — trafik zirvesi.)
- **İşler:** FCM push (iOS izin akışıyla) — tek kritik bildirim: "X kartın bugün due, 10 dk yeter"; e-posta (Resend vb.): haftalık kişisel rapor (çözülen, unutulmak üzere olanlar, lig durumu); dashboard'a "hafıza durumu" görselleştirmesi (kaç kart hangi stabilite bandında); FSRS + konu yeterlilik birleşik "bugünkü kuyruk" v1; leaderboard hile koruması (skor yazımını callable'a taşı).
- **Başarı metriği:** W4 tekrar retention +5 puan; push opt-in ≥%50; NSM haftalık seri ölçülüyor ve büyüyor.
- **Riskler:** Bildirim yorgunluğu → tek bildirim/gün kuralı. Apple push izin reddi → değer önce, izin sonra.
- **Geçiş kriteri:** NSM 4 hafta üst üste artıyor.
- **Yapılmaması gerekenler:** İkinci bildirim türü eklemek, gamification genişletmesi, sahte lig kullanıcısı eklemek (kaldırılmalı).

### Dönem 4 — 6-12 ay (Şub-Tem 2027): "Monetizasyonu değere bağla + adaptif plan"
- **Ana amaç:** Plus'ı "limit kaldırma"dan "kişisel koç"a dönüştürüp dönüşümü artırmak.
- **İşler:** Değer-önce paywall (limit anında kişisel özet: "bu hafta 214 soru çözdün, 41 kartın tekrar bekliyor — Plus ile sınırsız"); 12 aylık plan (~599-649 TL [VARSAYIM: fiyat testi gerekir]); süre bitimi win-back dizisi (e-posta, D-7/D0/D+7); TUS tarihine adaptif plan v1 (Gemini planını takvim + yeterlilik verisiyle besle, tıbbi içerik üretme — sadece mevcut soru/konulara yönlendir); Mini TUS kalibrasyonunu gerçek Eylül-2026/Mart-2027 deneme verisiyle yeniden ağırlıkla.
- **Başarı metriği:** Kayıt→Plus dönüşümü [taban ölçülecek] +%30 göreli artış; win-back ile dönen kullanıcı >%8.
- **Riskler:** Apple 3.1.1 — iOS'ta dijital içerik satışı IAP gerektirir; PayTR yalnızca web'de kalmalı ve iOS uygulaması harici ödemeye *link vermemeli*. Bu dönemde iOS IAP kararı verilmeli (bkz. DECISION_LOG D-007).
- **Geçiş kriteri:** MRR eşdeğeri (aktif Plus × aylık fiyat) 3 ay üst üste büyüyor.
- **Yapılmaması gerekenler:** Fiyat indirimi savaşı, kurumsal satış, soru sayısı pazarlamasına dönüş.

### Dönem 5 — 12-24 ay (Ağu 2027-Haz 2028): "Moat'u derinleştir + ölçekle"
- **Ana amaç:** Kalibrasyon verisini kamuya açık avantaja çevirmek; platform genişletmeyi veriye göre yapmak.
- **İşler:** "Tusoskop Endeksi" — anonim toplu veriden dönemsel TUS hazırlık raporu (SEO + PR + güven); adaptif plan v2 (deneme takvimine göre otomatik yoğunluk); Android kararı (yalnızca web mobil trafiği verisi Android talebini kanıtlıyorsa — Capacitor sayesinde efor orta); soru bankasını 9-10k'ya çıkarma (kalite hattından geçerek, pazarlama için değil müfredat boşlukları için); ölçeklenme: Firestore maliyet gözden geçirme, soru chunk'larının CDN/lazy yüklenmesi.
- **Başarı metriği:** NSM yıllık 3x; organik kayıt payı >%50; Plus yenileme oranı >%40.
- **Riskler:** Tek kurucu tükenmişliği — bu dönemde ilk dış destek (içerik editörü hekim, part-time) kararı.
- **Yapılmaması gerekenler:** TUS dışı sınava açılmak (USMLE/DUS) — veri moat'u TUS'a özgü; sıfırdan mimari rewrite (`SEO_MIGRATION_PLAN.md`'deki Astro/Next tartışması ancak ölçüm bunu zorunlu kılarsa).

---

## 4. FUNNEL VE BÜYÜME SİSTEMİ (uçtan uca)

Ayrıntılı event parametreleri `docs/METRICS_AND_EVENTS.md`'de; deney listesi `docs/GROWTH_EXPERIMENTS.md`'de.

### Aşama 1 — Meta reklamı / Google araması → landing
- **Mesaj:** Reklam görseliyle birebir aynı ilk soru (mevcut kural korunur); SEO'da "TUS puan hesaplama / branş soruları" araç sayfaları.
- **CTA:** "Çözmeye başla" (tek buton, login yok).
- **Event:** `quiz_landing_view` (mevcut) / SEO'da `page_view`.
- **Parametreler:** `campaign_slug, campaign_code, utm_*, ad_id, adset_id, placement, device_type, fbclid` (fbclid şu an kaybediliyor — eklenecek).
- **Drop-off nedenleri:** Yavaş ilk boya (izole bundle bunu çözüyor), mesaj uyumsuzluğu, in-app browser.
- **Deney:** Branş bazlı kampanya çeşitliliği (tek kampanya → 4 kampanya), soru zorluğu A/B.
- **Başarı:** Landing→ilk cevap ≥%55.

### Aşama 2 — Login'siz soru çözme (3 soru)
- **Mesaj:** Her cevaptan sonra kısa, iddialı açıklama ("TUS'ta bu konu son 5 yılda 7 kez soruldu" tarzı — yalnızca doğrulanabilirse).
- **CTA:** "Sıradaki soru".
- **Event:** `quiz_start`, `question_answered` (index, correct, elapsed_ms).
- **Drop-off:** 2. soruda sıkılma; çok zor ilk soru.
- **Deney:** 3 vs 5 soru; açıklama uzunluğu.
- **Başarı:** Başlayan→tamamlayan ≥%70 (mevcut oran ölçülüp taban alınacak).

### Aşama 3 — Üç soruluk sonuç + kişisel analiz
- **Mesaj:** Skor + "Bu 3 soru {konu} içindi. Gerçek seviyeni 20 soruluk Mini TUS ölçer — tahmini puanın ve Türkiye'deki yerinle."
- **CTA:** Birincil: "Mini TUS'a geç (ücretsiz, kayıt 30 sn)"; ikincil: App Store (iOS cihazda).
- **Event:** `quiz_complete`, `result_view`, `mini_tus_cta_click`.
- **Drop-off:** Kayıt duvarı korkusu; App Store'a gidip dönmeme.
- **Deney:** Mini TUS'u kayıtsız başlatıp 10. soruda kayıt istemek vs önce kayıt.
- **Başarı:** Sonuç→(kayıt VEYA store click) ≥%25.

### Aşama 4 — Hesap açma
- **Mesaj:** "Cevapların ve analizin kaydedilsin" — kayıt bir *kaybetmeme* aksiyonu olarak sunulur.
- **CTA:** Google/Apple tek dokunuş.
- **Event:** `signup_start`, `sign_up` (GA4 standart), Pixel `CompleteRegistration` (mevcut).
- **Parametre:** `method, funnel_source (coz|seo|store|direct), campaign_code`.
- **Drop-off:** In-app browser'da Google girişi (banner mevcut, commit `1f51970`); e-posta seçeneğinin yokluğu [KANIT: yalnızca Google/Apple].
- **Deney:** Kayıt anında `/coz` skorunun ekranda görünmesi ("2/3'lük sonucun seni bekliyor").
- **Başarı:** CTA→tamamlanan kayıt ≥%60.

### Aşama 5 — Mini TUS (20 soru)
- **Mesaj:** "20 soru ≈ 12 dakika. Sonunda: tahmini T puanın + yüzdelik aralığın + en zayıf 3 konun."
- **Event:** `mini_tus_start`, `mini_tus_question_answered`, `mini_tus_complete`, `mini_tus_result_view`.
- **Parametre:** `score, estimated_t_range, weakest_subjects[3], duration_ms`.
- **Drop-off:** 20 sorunun uzunluğu → ilerleme çubuğu + "8/20, en zor kısmı geçtin".
- **Deney:** 20 vs 12 soru; sonuç ekranında yüzdelik aralık vs tek sayı.
- **Başarı:** Başlayan→tamamlayan ≥%60; tamamlayan→D1 dönüş ≥%40.

### Aşama 6 — Kişisel çalışma önerisi
- **Mesaj:** "Mini TUS'a göre: bugün {konu}'dan 20 soru + yanlışların yarın tekrara girecek." FSRS burada *görünür* kılınır: "Çözdüğün her yanlış, tam unutacağın gün karşına çıkacak."
- **CTA:** "Bugünkü kuyruğu başlat".
- **Event:** `onboarding_plan_view`, `first_queue_start`, `activation_completed` (tanım: §2).
- **Drop-off:** Öneri jenerik kalırsa güven kaybı.
- **Başarı:** Aktivasyon oranı ≥%35.

### Aşama 7 — Plus teklifi
- **Mesaj:** Yalnızca limit anında + kişisel değer özetiyle (bkz. §9 Monetizasyon). Asla D0'da cold paywall.
- **Event:** `paywall_view (trigger, usage_snapshot)`, `plan_selected`, `paytr_token_requested`, `purchase` (backend-onaylı; Pixel `Purchase` mevcut, GA4 `purchase` eklenecek).
- **Deney:** Limit mesajında kişisel istatistik vs jenerik; 3 aylık planın "önerilen" konumu.
- **Başarı:** `paywall_view→purchase` ≥%4 [VARSAYIM — taban ölçülecek].

### Aşama 8 — FSRS ile geri dönüş döngüsü
- **Mesaj (push/e-posta, Dönem 3):** "12 kartın bugün due — 10 dakikada bitir, {streak} günlük serin sürsün."
- **Event:** `review_session_start (source: push|email|organic)`, `review_session_complete`, `notification_open`.
- **Drop-off:** Due yığılması ("borç" hissi) → 20+ due'da "bugün sadece en kritik 10" modu.
- **Başarı:** NSM (Weekly Committed Reviewers) haftalık artış; push→oturum ≥%15.

---

## 5. İÇERİK VE FSRS MOAT PLANI (tasarımlar)

1. **Soru kalite kontrolü:** Mevcut 3 kapı korunur; ek kural: her yeni parti audit'i CI'da bloklamaz ama `_manifest` ile audit raporu tarihi arasında >500 soru fark varsa CI uyarı verir (bugünkü bayatlama tekrarlanmasın).
2. **Soru versiyonlama:** Her soruya `rev` (int) ve `revisedAt` alanı; içerik değişince `rev++`. `questionHistory` ve FSRS kayıtları `questionId+rev` bilir → "bu soruyu yanlış yaptın ama soru o zamandan beri düzeltildi" durumu ayrıştırılabilir. Sabit denemelerdeki `setVersion` deseni (mevcut, `exams.js`) soru düzeyine indirilir.
3. **Hatalı soru bildirimi:** Soru ekranında "Hata bildir" → `questionReports/{autoId}` (uid, questionId, rev, tür: yanlış-cevap/yazım/açıklama, serbest metin ≤500). Rules: create-only, owner. Admin panelde kuyruk; haftalık triage; düzeltme → `rev++` → bildiren kullanıcıya (ileride) "raporun düzeltildi" bildirimi = güven döngüsü.
4. **Açıklama kalite puanı:** Audit heuristiklerine `expScore` (uzunluk, cevap-gerekçe uyumu, madde işareti); soru gösteriminde A/B değil, düşük skorlu açıklamalar review kuyruğuna öncelikli girer.
5. **Ders-konu taksonomisi:** `TRACKER_TOPICS` (150 konu) tek doğruluk kaynağı ilan edilir; her sorunun `topic` alanı bu listeye validasyonla bağlanır (`validate:questions`'a kural eklenir). Serbest metin topic sapmaları rapora düşer.
6. **FSRS + konu yeterlilik birleşimi:** Konu yeterlilik skoru = son 30 gün doğruluk (weighted) × soru sayısı güveni; FSRS due kartları + düşük yeterlikli konudan taze sorular tek "bugünkü kuyruk"ta harmanlanır (%60 due / %40 zayıf konu [VARSAYIM — deneyle ayarlanır]).
7. **Günlük kişisel kuyruk:** Kuyruk sunucuda değil istemcide hesaplanır (mevcut `getDueSmartReviews` + yeterlilik skoru); tek ekran, tek "başla" butonu; hedef süre 15-20 dk.
8. **TUS tarihine adaptif plan:** Onboarding'de alınan sınav tarihi → kalan hafta sayısı → konu kapsama hedefi geriye doğru planlanır; son 4 hafta "yeni konu yok, tekrar + deneme" moduna geçer. AI (Gemini) yalnızca *sıralama ve motivasyon metni* üretir; hangi konu/soru sayısı deterministik koddan gelir.
9. **AI halüsinasyon kontrolü:** Kural: AI hiçbir zaman tıbbi içerik (yeni soru, açıklama, tanı bilgisi) üretmez; yalnızca mevcut, uzman onaylı içeriğe yönlendirir. Mevcut `validateStudyPlanJson` şema kapısı korunur; plan çıktısındaki konu adları `TRACKER_TOPICS` ile eşleşmezse fallback plana düşülür (bugün eksik — eklenecek). AI ile soru üretimi denenirse (Dönem 5+) zorunlu çift hekim onayı + ayrı "AI-taslak" havuzu, kullanıcıya karışmaz.

---

## 6. MONETİZASYON

- **İlke: değer önce.** Paywall yalnızca (a) limit anında, (b) premium özelliğe dokunma anında; her ikisinde de kullanıcının *kendi* verisiyle ("bu hafta X soru çözdün, Y kartın bekliyor"). D0'da paywall gösterilmez.
- **Free sınırları (mevcut: 30 soru/gün, 2 konu testi, 1 deneme/ay, 10 tekrar/gün):** 30 soru/gün korunur (aktivasyona yetiyor). **Değişiklik önerisi: `dailyReviewQuestions: 10 → 20`.** Gerekçe: FSRS ürünün aha-anı; free kullanıcı tekrar alışkanlığı kuramazsa Plus'ın değerini hiç yaşamaz. Ölçüm: değişiklik sonrası W4 retention ve Plus dönüşümü — dönüşüm düşerse geri alınır (vazgeçme kriteri: 6 haftada dönüşüm -%15).
- **Abonelik yapısı:** Mevcut 1/3/6 ay korunur; **12 aylık (~599 TL, ay başına ~49,90) eklenir** — TUS hazırlığı 12-18 ay sürer, en sadık segment kilitlenir. Otomatik yenileme yok (mevcut model süreli erişim) — bu dürüst bir model, "iptal akışı" = doğal bitiş; bitişte win-back devreye girer.
- **Web ↔ App Store:** PayTR yalnızca web'de. iOS uygulamasında Plus satın alma *gösterilmez ve harici linke yönlendirilmez* (Apple 3.1.1); iOS'ta ya IAP eklenir (komisyon %15-30, fiyat +%20 farkla) ya da satın alma yüzeyi tamamen gizlenir. Karar Dönem 4'te veriyle: iOS DAU / web DAU oranına göre. [VARSAYIM: ios branch'i incelenemedi, mevcut durum bilinmiyor.]
- **Deneme/indirim:** Kredi kartı isteyen trial yok (altyapı yok, güven maliyeti var). Bunun yerine "**Plus haftası**": aktivasyonu tamamlayan kullanıcıya 7 gün tam Plus (sunucudan `premiumUntil` +7g, `premiumSource:"trial"`). Ölçüm: trial→ödeme ≥%8 hedef; <%3 ise kaldır. İndirim: yalnızca win-back'te ve dönem sonu (sınav sonrası ölü sezon) kampanyasında; sürekli indirim yok.
- **Win-back:** `premiumUntil` bitişine D-7 ("süren bitiyor, kaldığın yerden devam") ve D+7 ("kartların birikti: N due") e-postası; D+30'da tek seferlik %20 kod. Bağımlılık: e-posta altyapısı (Dönem 3).
- **Premium'un anlaşılır sunumu:** "Sınırsız soru" değil, üç somut vaat: (1) Sınırsız tekrar — hafızan asla sıraya girmez; (2) Kişisel AI günlük plan; (3) Tüm denemeler + tam geçmiş analizi. Fiyat sayfasında kullanıcının kendi sayıları gösterilir.

---

## 7. RED TEAM ANALİZİ

**TUS öğrencisi:** "7000 soru mu? Dershanemde 30 bin var. Açıklamaların yarısı iki cümle. Yüzdelik dediğin şey kaç kişilik veriye dayanıyor? Lig'deki 'drtus_ezgi' gerçek mi?" → Sahte lig kullanıcıları (`seedFakeLeaderboard.mjs`) fark edilirse güven ölür.
**Ücret ödeyen kullanıcı:** "Süre bitince otomatik uyarı bile gelmedi. Plus'ta somut olarak ne aldığımı dashboard'da göremiyorum. Web'den ödedim, iOS'ta niye giriş yapınca fark yok gibi?"
**Rakip dershane:** "Bunun tek farkı FSRS; iki sprintte kopyalarız. İçerik havuzumuz 5 kat, hocalarımız marka. Fiyatı da bizden ucuz — sürdürülemez."
**Mobil PM:** "Onboarding yok, push yok, geri çağırma yok — retention eğrisi 3. günde ölür. `/coz`'dan kayıt olan kullanıcı cevaplarını kaybediyor: funnel'ın ortası kırık."
**Yatırımcı:** "TAM: TUS adayı/yıl ~25-30 bin aktif hazırlanan [VARSAYIM]. Tek kişi, tek sınav, tek ülke. Bu bir lifestyle business — büyüme hikâyesi kalibrasyon verisinin ağ etkisine bağlı ve o veri henüz toplanmıyor."
**Güvenlik mühendisi:** "Leaderboard skoru istemciden yazılıyor — bir curl ile lig birincisi olurum. `results` create doğrulamasız. Sentry yok: saldırıyı bırak, kendi hatalarınızı bile görmüyorsunuz. Usage limiti callable düşerse localStorage'a emanet."
**Apple reviewer:** "Uygulama içinden erişilen hesapta web'de satılan dijital abonelik var; IAP yok. Guideline 3.1.1 — reject. Ayrıca login'siz içerik App Store metadata'sıyla uyumlu mu?"
**Tek kurucu (kendisi):** "Instagram otomasyonu, SEO, reklam kreatifi, soru girişi, kod — haftada kaç saat kaldı? En pahalı kaynağım odak ve bu plan bile 6 iş akışı öneriyor." → Bu yüzden 90 günlük planda aynı anda en fazla 2 akış var.

### Başarısızlığa götürebilecek 10 neden + erken uyarı göstergesi

| # | Neden | Erken uyarı göstergesi |
|---|---|---|
| 1 | Retention çözülmeden reklama para basılması (delik kovaya su) | CAC ödeyen kullanıcı başına LTV altında; W1 retention <%20 |
| 2 | Kalibrasyon/yüzdelik iddiasının az veriyle itibar yakması | Mini TUS sonuç ekranında Clarity rage-click / şikâyet DM'leri |
| 3 | Apple 3.1.1 reddi ile iOS kanalının kapanması | App Store güncellemesinde review süresinin uzaması / ilk reject |
| 4 | Sahte leaderboard'un ifşası | Sosyal medyada tek bir "bu kullanıcılar bot" postu |
| 5 | Soru kalitesindeki açıkların (755 açık bulgu) viral tek yanlış cevapla patlaması | `questionReports` hacminde spike; aynı soruya ≥3 rapor |
| 6 | Tek kurucu tükenmişliği / hastalık — bus factor 1 | 2 haftadan uzun commit boşluğu; destek e-postalarının birikmesi |
| 7 | Ölçümsüzlük: hangi işin işe yaradığının bilinmemesi | Bir özellik yayınlandıktan 2 hafta sonra etkisine dair tek sayı söylenememesi |
| 8 | TUS mevzuat/format değişikliği (ÖSYM) | ÖSYM duyuru takibi; kontenjan/format haberleri |
| 9 | Firestore maliyetinin kullanıcıyla lineer büyümesi (özellikle leaderboard/analitik okuma) | Aylık Firebase faturası / aktif kullanıcı oranının artması |
| 10 | Dershanelerin (fiyat gücüyle) benzer mobil ürünü bedava vermesi | Rakip app store sıralamalarında FSRS/spaced-repetition dili |

---

## 8. Yarın Sabah İlk Beş Görev (kesin sıra)

1. **Sentry'yi kur** (web + functions, 2-3 saat) — bugünden itibaren her üretim hatası görünür olsun.
2. **`test:rules`'ı `ci.yml`'e ekle** (30 dk) — güvenlik kurallarının regresyonu CI'da yakalansın.
3. **`docs/METRICS_AND_EVENTS.md`'deki Tier-1 eventleri koda ekle** (kayıt→ilk soru→ilk tekrar zinciri; 1 gün).
4. **Streak/limit gün sınırını Europe/Istanbul'a çevir** (`streakService.js`, `usageLimitService.js`, `functions/index.js` `todayKey`; 2-3 saat + test).
5. **`/coz` cevaplarını kayıt sonrası hesaba taşı** (localStorage `tusoskop_quiz_result` → `questionHistory` + FSRS seed; 1 gün) — funnel'ın kırık ortası kapansın.

Devamı: `docs/90_DAY_EXECUTION_PLAN.md`.
