# Tusoskop — Proje Hafızası

Türk TUS (Tıpta Uzmanlık Sınavı) sınav hazırlık uygulaması. React + Vite + Firebase + Capacitor iOS.

## Branch Yapısı

| Branch | Amaç |
|--------|------|
| `main` | Web uygulaması (PWA) |
| `ios-appstore-v1` | App Store iOS build — iOS-specific kodlar burada |

iOS build akışı: `npm run build` → `npx cap sync ios` → Xcode → cihaz/simulator.

## Teknoloji Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Firebase (Firestore, Auth, Functions)
- **Native**: Capacitor 8 (iOS)
- **Paket Yönetimi**: SPM (Swift Package Manager) — CocoaPods yok
- **Test**: Vitest

## Tekrar Sistemi (FSRS)

`src/utils/smartReviewScheduler.js` — FSRS-inspired lightweight scheduler.

### Temel Kavramlar
- **FSRS = tek zamanlama otoritesi**. `wrongQuestions` ve `favoriteQuestions` artık scheduler değil, sadece analitik/metadata.
- `applyReview(reviewState, grade, now, reviewContext)` → master router:
  - `isDue (dueAt <= now)` → normal FSRS update
  - `isSameDay (elapsedDays < 1)` → sadece `lastPracticeAt` güncellenir, schedule değişmez
  - Early review → `applyEarlyReview()` → delta × earlyWeight yaklaşımı
- **Early review**: `progressRatio = elapsedDays / scheduledDays`
  - `progressRatio < 0.5` + doğru → `dueAt` korunur, stability kısmen artar
  - `progressRatio < 0.75` + yanlış → `softLapseCount` artar (gerçek lapse değil)
  - `progressRatio >= 0.75` + yanlış → `lapseCount` artar (gerçek lapse)

### Yeni Firestore Alanları (backward compatible, || 0 fallback)
- `softLapseCount` — erken yanlış sayısı
- `lastPracticeAt` — son practice zamanı
- `sameDayReviewCount` — aynı gün tekrar çözüm sayısı
- `softReviewCount` — soft review sayısı
- `lastReviewContext` — review bağlamı (daily_fsrs_review, topic_practice, vs.)

### Review Context Sabitleri
`src/constants/reviewContext.js`:
```js
DAILY_FSRS_REVIEW, EARLY_REVIEW, SAME_DAY_REVIEW,
WRONGS_PRACTICE, FAVORITES_PRACTICE, TOPIC_PRACTICE, EXAM, NORMAL_STUDY
```

## Dashboard ("Tekrara Başla")

`src/components/Dashboard.jsx`

- `smartDue > 0` → `onStartSmartReview()` çağrılır (direkt FSRS review başlar)
- `smartDue === 0` → `setView("studyCollection")` ile çalışma alanı açılır
- **Akıllı Tekrar Planı** kartında sağ üst köşede dekoratif 🌱 var (opacity %13, absolute positioned)

## Çalışma Alanı (StudyCollectionScreen)

`src/components/StudyCollectionScreen.jsx`

- Tekrar Kuyruğu: sadece FSRS due kartlar (`getDueSmartReviews`)
- Boş durum görseli: 🎯
- `buildTodayReviewQueue()` artık kullanılmıyor; `getDueSmartReviews` + `resolveQuestionsFromReviews` direkt çağrılıyor (circular dependency önlemi)

## iOS Google Sign-In (ios-appstore-v1)

`src/services/nativeAuthService.js`

- `signInWithNativeGoogle(auth)` → `@capacitor-firebase/authentication` plugin kullanır
- Apple Sign-In ile aynı yaklaşım (`skipNativeAuth: true`)
- `firebase.js`'de `loginWithGoogleNative()` → `signInWithNativeGoogle(auth)` delegate eder
- `ios/App/App/Info.plist`'e `REVERSED_CLIENT_ID` URL scheme eklendi:
  `com.googleusercontent.apps.447547841381-7aisne06vbgialiqeq3cgsfeholthbvm`

**Not**: `@codetrix-studio/capacitor-google-auth` KULLANILMIYOR. Projede yüklü değil.
**Not**: Google Sign-In iOS Simulator'da çalışmaz, gerçek cihaz gerekir.

## iOS Yapılandırma

- Bundle ID: `com.tusoskop.app`
- `GoogleService-Info.plist`: `ios/App/GoogleService-Info.plist` (Xcode projesine eklenmiş)
- SPM packages: `ios/App/CapApp-SPM/Package.swift`
- `@capacitor-firebase/authentication` SPM ile dahil

## Ödeme Altyapısı — PayTR iFrame (Shopify kaldırıldı)

Shopify ödeme entegrasyonu tamamen kaldırıldı. Yerine doğrudan PayTR iFrame API kullanılıyor.

### Akış
1. Kullanıcı plan seçer → `PremiumInfoScreen` → `requestPaytrToken()` → Firebase `createPaytrToken` (onCall)
2. Sunucu `premiumPurchaseIntents` koleksiyonuna intent kaydeder, PayTR token alır, döner
3. `PaytrCheckoutModal` iframe'i açar (`https://www.paytr.com/odeme/guvenli/{token}`)
4. Kullanıcı öder → PayTR sunucudan sunucuya `paytrCallback` (onRequest) çağırır
5. Hash doğrulanır, `users/{uid}` güncellenir: `plan:"plus", premiumStatus:"active"`
6. Modal'daki `onSnapshot` değişikliği yakalar → başarı ekranı → "Çalışmaya devam et" → `window.location.reload()`

### Kritik Dosyalar
| Dosya | Görev |
|-------|-------|
| `functions/paytr.js` | Token üretimi + callback handler + PAYTR_PLANS fiyat tablosu |
| `functions/index.js` | `createPaytrToken` (onCall) + `paytrCallback` (onRequest) export |
| `src/services/paytrService.js` | `requestPaytrToken(plan, contact)` — Firebase Function çağrısı |
| `src/components/premium/PaytrCheckoutModal.jsx` | iFrame modal, onSnapshot ile otomatik aktivasyon tespiti |
| `src/components/premium/PremiumInfoScreen.jsx` | Plan seçimi, token talebi, modal yönetimi |
| `src/config/plusPlans.js` | İstemci tarafı plan listesi (shopifyUrl alanları kaldırıldı) |

### Güvenlik Kuralları
- `PAYTR_MERCHANT_KEY` ve `PAYTR_MERCHANT_SALT` → **Firebase Secret Manager** (`defineSecret`)
- `PAYTR_MERCHANT_ID = "699560"` → gizli değil, env ile override edilebilir
- `TEST_MODE`: `process.env.PAYTR_TEST_MODE === "1"` → canlıda "0" olmalı
- Ödeme tutarı **ASLA istemciden alınmaz** → `PAYTR_PLANS` sunucu tablosundan gelir

### Plan Tablosu (functions/paytr.js içinde)
```js
plus_1m: { days: 30,  amount: 89.9,  sku: "TUSOSKOP_PLUS_1M" }
plus_3m: { days: 90,  amount: 209.7, sku: "TUSOSKOP_PLUS_3M" }
plus_6m: { days: 180, amount: 359.4, sku: "TUSOSKOP_PLUS_6M" }
```

### Firestore Koleksiyonları
- `premiumPurchaseIntents/{merchantOid}` — ödeme niyeti kaydı
  - status: `"started"` → `"paid_activated"` | `"failed"` | `"token_error"` | `"needs_review"`
- `users/{uid}` — aktivasyon sonrası güncellenen alanlar:
  - `plan: "plus"`, `premiumStatus: "active"`, `premiumSource: "paytr"`, `premiumUntil: ISO string`
  - `premiumUntil` uzatma: `max(now, mevcutPremiumUntil)` — mevcut süresi silinmez
- `adminLogs/{id}` — aktivasyon log kaydı

### PayTR Panel Ayarları
- Bildirim URL: `https://us-central1-tusoskop.cloudfunctions.net/paytrCallback`
- Test modu: `PAYTR_TEST_MODE=1` env değişkeni ile açılır
- İşyeri adı PayTR panelinden değiştirilir (kod değil): Mağaza Bilgileri → İşyeri Adı

### Önemli Notlar / Geçmiş Hatalar
- `premiumUntilToDate()` helper **`functions/paytr.js` içinde** tanımlı olmalı — `index.js`'de değil (ReferenceError yaşandı)
- `PaytrCheckoutModal` mount anındaki `premiumUntil` değerini `baseUntilRef`'te saklar; sadece bu değerden farklı yeni bir `premiumUntil` gelince başarı sayar (mevcut Plus kullanıcıları hemen başarı görmez)
- Ödeme başarısında `window.location.reload()` çağrılır → dashboard taze veriyle yüklenir

## Önemli Servisler

| Dosya | Görev |
|-------|-------|
| `src/services/smartReviewService.js` | FSRS review CRUD, Firestore sync |
| `src/services/studyCollectionService.js` | wrongQuestions, favoriteQuestions (artık scheduler değil) |
| `src/services/nativeAuthService.js` | iOS native auth (Apple + Google) — sadece ios-appstore-v1'de |
| `src/hooks/useStudyState.js` | Soru çözme state'i, `activeTopicName` → reviewContext olarak FSRS'ye iletilir |

## Dashboard Profil Menüsü (ios-appstore-v1)

`src/components/DashboardProfileMenu.jsx`

- 40×40px circular avatar butonu (Google fotoğrafı veya baş harfler)
- Tıklanınca dropdown: isim/e-posta, 5-renkli tema seçici, Destek linki, Geri bildirim, Çıkış
- Tema seçici direkt görünmez — avatara basınca açılır

## SEO ve Pazarlama (main)

TUS özelliklerini agresif pazarlayan SEO altyapısı. Amaç: özellikleri rakamlarla öne çıkarıp organik görünürlüğü artırmak.

### Auth lazy-load (App / AppAuthenticated ayrımı)
- `src/App.jsx` = **hafif public kabuk**, firebase import ETMEZ. SEO sayfalarını (`SeoLandingPage`) ve anonim `/` (`PublicHome`) doğrudan render eder.
- `src/AppAuthenticated.jsx` = firebase + Firestore + tüm uygulama; **`lazy(() => import("./AppAuthenticated"))`** ile yalnızca `/giris`, `/app`, mevcut oturum veya giriş butonuna tıklanınca yüklenir.
- Giriş butonu (PublicHome): `App.startLogin` → `await import("./firebase")` (tıklayınca lazy). `SignInOptions` artık firebase import etmez (handler dışarıdan gelir).
- Hafif oturum işareti: `localStorage["tusoskop_session"]` — `useAppAuthBootstrap` girişte set/çıkışta temizler; `App.jsx` bunu okuyup mevcut oturumda uygulamayı doğrudan yükler. **Sonuç:** `/` ve SEO route'larında Firebase Auth SDK'sı/iframe'i hiç yüklenmez (curl/Playwright ile doğrulandı).

### Route mimarisi (pathname tabanlı, react-router YOK)
`App.jsx` (+ `AppAuthenticated.jsx`) içinde `pathRoute` (`window.location.pathname`'den) ile:
- `/` → anonim kullanıcıya **`PublicHome`** (zengin public landing), girişliye uygulama.
- `/giris` → sadece Apple/Google login ekranı (`noindex,follow`).
- `/app` → uygulama alanı; anonimse login ekranı (`noindex,follow`).
- SEO sayfaları (`getSeoPageByPath`) auth gate'ten ÖNCE `SeoLandingPage` ile render — auth beklemez.
- **Login ekranı artık ana sayfayı bastırmaz.** Ana sayfa SEO içeriği `<noscript>` içinde DEĞİL; `#root` içine gerçek DOM olarak gömülür (`scripts/render-home-seo.mjs > renderHomeSeoStatic` → `vite.config.js` plugin). React mount olunca `PublicHome` yerini alır.
- **Canonical base = `https://www.tusoskop.com`** (www). Tek kaynak: `seoContent.js > SITE_URL`. index.html, sitemap, robots, statik prerender ve React meta hepsi www.
- Slug: `tusoskop-fiyatlandirma` → **`/fiyatlandirma`** (301 redirect: vercel.json + firebase.json). Yeni: **`/hakkimizda`**.
- **iOS notu (cherry-pick):** iOS'ta anonim `/` artık `PublicHome` render eder. iOS açılışında doğrudan login isteniyorsa `ios-appstore-v1`'de `/` → `/giris` veya `Capacitor.isNativePlatform()` kontrolü gerekir.
- Uzun vadeli mimari karşılaştırması: `SEO_MIGRATION_PLAN.md` (Astro vs Next vs mevcut Vite).

### Tek doğruluk kaynağı: `src/seo/subjectData.js`
- 11 dersin gerçek soru sayıları + her dersten **soru bankamızdan alınmış gerçek örnek soru** (id, konu, q, options, correct, exp).
- `TOTAL_QUESTIONS` = branş sayımlarının toplamı (şu an 7077). `_manifest.json` `subjectCounts` ile aynı tutulmalı.
- **"X+" pazarlama kuralı** (`questionCountLabel`): gerçek sayıyı **bir alt yüzlüğe** yuvarlar, asla abartmaz. `7077 → 7.000+`, `7200 → 7.100+`. Sayı arttıkça etiket otomatik büyür ama her zaman gerçeğin altında kalır.

### TUS Araçları — Puan Hesaplama ve Kontenjan Tablosu
- **`/tus-puan-hesaplama`**: `src/seo/tusScoring.js` tek matematik kaynağı — `TUS_SCORE_ANCHORS` (net→puan çapa tablosu, kullanıcı onaylı), `computeNet`, `estimateTusScore` (lineer interpolasyon), `netForScore` (ters interpolasyon), `applyScoreDeduction` (%5 kesinti, `TUS_DEDUCTION_RATE = 0.05`), `computeBlank`/`isSectionOverflow` (120 soru validasyonu). React (`TusScoreCalculator`) ve statik prerender (`renderScoreTool` in `generate-seo-pages.mjs`) **aynı mantığı iki dilde (JS/inline JS) birebir uygular** — biri değişirse diğeri de güncellenmeli.
- **`/tus-kontenjan-tablosu`**: `src/seo/kontenjanData.js` — dönem bazlı kontenjan/taban puan/yerleşen verisi (başarı sırası kasıtlı olarak yok). **Her yeni TUS döneminde bu dosya elle güncellenmeli** (`KONTENJAN_DATA` dizisi + `KONTENJAN_DONEM_LABEL`). `tabanPuan: null` → kontenjan dolmadı, tabloda "—" gösterilir. Sıralanabilir/aranabilir tablo React (`KontenjanTable`) ve statik (`renderKontenjanTable`) olarak iki katmanda var.

### İşlenen 6 pazarlama fikri
1. **Soru sayısı vurgusu** — "7.000+ TUS tarzı soru, 11 dersten ve istediğin konudan seç" (hero, meta, stat kartları).
2. **Branş bazlı 11 SEO sayfası** — `/tus-{ders}-sorulari` (örn. `/tus-anatomi-sorulari`). Her birinde dersin gerçek soru sayısı + örnek soru kartı (şık + doğru cevap + açıklama). "tus {ders} soruları" aramalarını hedefler.
3. **Akıllı tekrar (FSRS)** — "yanlışını tam unutmadan önce karşına çıkarırız".
4. **Ücretsiz limit** — "günde 30 soru ücretsiz" (`FREE_LIMITS` ile uyumlu).
5. **Haftalık lig / sıralama** rekabeti.
6. **AI çalışma planı**.

### Üç render katmanı (hepsi aynı veriden beslenir)
| Katman | Dosya | Görev |
|--------|-------|-------|
| React (canlı) | `src/components/seo/PublicSeoPages.jsx` | `PublicHome` + `SeoLandingPage`, örnek soru kartı, branş indeksi, footer |
| Statik prerender | `scripts/generate-seo-pages.mjs` | `public/{slug}/index.html` + `sitemap.xml` + `robots.txt` üretir (build'de çalışır) |
| Ana sayfa statik fallback | `scripts/render-home-seo.mjs` → `vite.config.js` | `renderHomeSeoStatic()` ile ana sayfa içeriği `#root` içine **gerçek DOM** olarak gömülür (noscript DEĞİL). curl/JS'siz tarayıcı/AI botları okur; React mount olunca `PublicHome` yerini alır |

- SEO sayfaları `seoContent.js`'teki `seoPages = [...contentSeoPages, ...subjectSeoPages]` dizisinden gelir. Routing `getSeoPageByPath` ile; yeni slug eklemek otomatik olarak routing + sitemap + prerender'a girer.
- **FAQ JSON-LD ↔ sayfa hizalaması (önemli):** Şemaya konan FAQ, sayfada görünen FAQ ile **birebir aynı** olmalı (Google kuralı). `SeoLandingPage` ve üretici `slice(0,6)` ile görünen seti hem render'a hem şemaya verir; FAQ boşsa (legal sayfalar) FAQPage düğümü hiç eklenmez.
- Footer'da branş linkleri kompakt: kısa ders adları (Anatomi, Biyokimya…), `flex-wrap` tek satır.

### Meta (Facebook) Pixel — dönüşüm izleme (main)

`src/lib/metaPixel.js` — Clarity (`src/lib/clarity.js`) ile aynı desen: pixel ID **yalnızca** `.env`'den (`VITE_META_PIXEL_ID`), `fbq` base snippet'i `initMetaPixel()` ile JS'ten yüklenir (index.html'e inline snippet **yok**). Pixel ID ya da `fbq` yoksa (ad-blocker) tüm event'ler sessizce atlanır, uygulama çökmez.

- **Başlatma:** `src/main.jsx` → `runAfterFirstPaint` içinde `initMetaPixel()` (Clarity'nin yanında). İlk PageView burada atılır.
- **PageView:** react-router yok; `App.jsx`'te `usePageTracking(view)` her `view` state değişiminde PageView atar. Mount'taki ilk effect guard'lı (init zaten attı + StrictMode çift tetik koruması).
- **CompleteRegistration:** `src/services/userService.js` → `ensureUserDocument` **yalnızca yeni hesap dalında** (`!snap.exists()`), `setDoc` sonrası. Her girişte değil. `method` = provider'dan türetilir (google/apple/email).
- **Purchase:** `src/components/premium/PaytrCheckoutModal.jsx` → backend-onaylı; PayTR callback → Firestore `users/{uid}` aktivasyonu → `onSnapshot` başarı anında (`trackClarityEvent("paytr_payment_success")` ile aynı yer). `value` = gerçek `plan.totalPrice` (89,90 / 209,70 / 359,40), `orderId` = `merchantOid` (dedup). `purchaseTrackedRef` ile tek tetik.
- **StartTrial YOK:** Üründe abonelik denemesi kavramı yok (free katman + PayTR Plus). Bilerek eklenmedi.
- **Env:** `VITE_META_PIXEL_ID` (`.env.example`'da belgeli, boşsa pixel devre dışı). Events Manager → **Web** veri kaynağı (Uygulama değil — `fbq` WKWebView içinde web olarak çalışır).

## Sık Yapılan İşlemler

### iOS'a değişiklik göndermek
```bash
git pull origin ios-appstore-v1
npm install
npm run build
npx cap sync ios
# Xcode: Product → Clean Build Folder (⇧⌘K) → Run
```

### Test çalıştırmak
```bash
npm run test
npm run validate:questions
```

### Her iki branche aynı commit eklemek
```bash
# main'e commit at
git checkout main
git commit -m "..."
git push origin main

# ios branchına cherry-pick
COMMIT=$(git rev-parse HEAD)
git checkout ios-appstore-v1
git cherry-pick $COMMIT
git push origin ios-appstore-v1
```

## Meta Reklam Mikro Deneme Funnel'ı (`/coz/:campaignSlug`)

Meta Traffic reklamlarından gelen kullanıcı için **login-öncesi 3 soruluk mini deneme**. Amaç: reklam ile login duvarı arasındaki soğuk geçişi kaldırmak. (commit: `8ac2146`)

> **Asıl nihai Meta Ads stratejisi/mimarisi için:** `META_ADS_MEDIA_PLAN.md` (Temmuz→Eylül 2026 planı — C1/C2/C3/C4 kampanya mimarisi, 10 kreatif fikri, bütçe, sinyal merdiveni QuizComplete→CompleteRegistration→Purchase, 9 haftalık takvim, guardrail'ler). Her yeni kampanya/bütçe/hedefleme kararı bu plana göre değerlendirilmeli. `META_ADS_CAMPAIGN_LOG.md` ise bu planın kronolojik uygulama günlüğüdür — ikisi birlikte okunmalı.

### Mimari
- `src/main.jsx` → `src/AppRoot.jsx`: `/coz/` path'i **ağır App ağacından izole** (auth/QuestionsProvider yüklenmez), lazy `PublicQuizFunnel`. Firebase SDK sadece "Web'de devam et" login'inde dinamik import → en hızlı ilk render.
- Bileşenler: `src/components/funnel/` → `PublicQuizFunnel.jsx` (orchestrator) + `QuizQuestionCard.jsx` + `QuizResultScreen.jsx` + `QuizContinueModal.jsx`.
- Kampanya + sorular **statik bundle**: `src/data/publicQuizCampaigns.js`. Firestore public read YOK (ana banka güvende). `correctIndex` 0-tabanlı (ana bankadaki `correct` ile aynı).
- Session: `src/utils/publicQuizSession.js` (sessionStorage, slug'a göre namespaced, yenilemede resume). Sonuç `localStorage` `tusoskop_quiz_result`.
- Analytics: `src/lib/publicQuizAnalytics.js` — Firebase Analytics + **mevcut** `src/lib/metaPixel.js`'i yeniden kullanır (`ensureMetaPixel`→`initMetaPixel`). Kendi pixel bootstrap'ı KURMA.
- App Store linki: `src/utils/appStoreCampaignLink.js` (`buildClientAppStoreUrl`) — `VITE_APP_STORE_PROVIDER_TOKEN` env'inden `pt`, `ct`=kampanyanın `appleCampaignToken`.
- Firestore oturum özeti: `/api/quiz-session.js` + `lib/quiz/logQuizSession.js` (admin-SDK, `logCampaignClick` deseni). Client Firestore write YOK, **rules değişmez**.
- Web-devam attribution: mevcut `acquisition` mekanizması (utm → `acquisitionAttribution.js` → `userService`). Mevcut Google/Apple auth kullanılır; yeni auth kurma.

### Yeni ders için kampanya eklemek
`src/data/publicQuizCampaigns.js` → `PUBLIC_QUIZ_CAMPAIGNS` dizisine yeni obje ekle:
```js
{ slug: "farmakoloji-01", campaignCode: "mq_far_01", title: "3 Soruluk Farmakoloji Mini Denemesi",
  subject: "Farmakoloji", active: true, appleCampaignToken: "mq_far_01",
  questions: [ /* 3 soru: {id, subject, topic, difficulty, questionText, options[5], correctIndex, explanation} */ ] }
```
- Soruları **ana bankadan** seç (uydurma): `node -e` ile ilgili `src/data/questionChunks/<ders>.js`'ten `id,q,options,correct,exp` çek. `correct`→`correctIndex` (0-tabanlı, birebir).
- Slug taksonomisi: `mq_<ders3harf>_<no>` (mq=Meta Quiz). Route otomatik: `/coz/<slug>` (rewrite'lar `vercel.json`+`firebase.json`'da `/coz/**` ile hazır, ekleme gerekmez).
- Deploy sonrası test: `https://www.tusoskop.com/coz/<slug>`.

### Instagram kreatifi (reklam görseli)
- **1. sorunun metni reklam görseliyle BİREBİR aynı olmalı** (mesaj eşleşmesi = dönüşüm için kritik). Doğru cevabı gösterme (teaser).
- Format 4:5 dikey (1080×1350), koyu lacivert (#070c18) + emerald (#10b981), soru büyük.
- Üretim: SVG yaz → HTML `<img>` wrapper → headless Chrome ile PNG: `chrome --headless=new --force-device-scale-factor=2 --window-size=1080,1350 --screenshot=<abs>.png file:///<abs>.html`. (rsvg/imagemagick metin render'ı kötü, Chrome kullan. Instagram SVG kabul etmez, PNG şart.)

### Reklam & takip
- Meta Ads hesabı (Tusoskop): `2734371800349546` (TRY, min ~46.81 TL/gün). App Store campaign link: `pt=128988812`, `ct=<campaignCode>`.
- Reklam URL formatı: `https://www.tusoskop.com/coz/<slug>?campaign_code=<code>&utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}&placement={{placement}}`
- Firebase Analytics event'leri: `quiz_landing_view, quiz_start, question_answered, quiz_complete, result_view, appstore_click, web_continue_click, signup_start`. Meta Pixel: `ViewContent, QuizStart, QuizComplete, AppStoreClick, WebContinueClick, CompleteRegistration`. Meta kampanyasını sayfa-içi `QuizComplete`/`AppStoreClick`'e optimize et (iOS ATT körleştirmez).
- ENV (Vercel): `VITE_META_PIXEL_ID` (var), `VITE_APP_STORE_PROVIDER_TOKEN=128988812`, `VITE_APP_STORE_BASE_URL` (opsiyonel). Hepsi build-time → değişince redeploy gerekir.
- Bilinen sınır (Phase-2): çözülen cevaplar henüz hesaba içe aktarılmıyor (skor+attribution bağlanıyor, cevaplar `localStorage`'da bekliyor); MVP'de `correctIndex` client'ta.

### Patoloji-01 kampanyası — kurulum ve öğrenilenler (Temmuz 2026)

> **Ayrıntılı, kronolojik oturum günlüğü:** `META_ADS_CAMPAIGN_LOG.md` — tüm kampanya/ad set/kreatif ID'leri, yapılan bug fix'lerin tam açıklaması, analiz bulguları ve **devam eden K4 "Tuzak Farmakoloji" red sorunu** için oraya bak. Aşağıdaki liste sadece özettir.

- **Meta Pixel/dataset**: "Tusoskop", ID `1327796822800702` (Events Manager → Eylemler → Özel Dönüşümler'de yönetiliyor).
- **Custom Conversion'lar oluşturuldu**: `QuizStart` (URL içeriği: `/coz/patoloji-01`). `QuizComplete` ve `AppStoreClick` için de aynı yöntemle eklenebilir (Events Manager'da event dropdown'ında görünmesi için event'in en az bir kez, yakın zamanda fire olmuş olması gerekiyor).
- **`CompleteRegistration` custom conversion'ı henüz eklenemedi** — pixel'deki tek `CompleteRegistration` funnel'dan değil, uygulamanın genel kayıt akışından ve kampanya öncesinden geliyor. Eklemek için: `/coz/patoloji-01` üzerinden gerçek bir Google/Apple girişi tamamlanması lazım (dikkat: bu gerçek bir Tusoskop hesabı oluşturur, test için kullanılmamış bir Google/Apple hesabıyla yapılmalı).
- **Kampanya**: `52560159975763` ("Trafik | Patoloji-01 → /coz", OUTCOME_TRAFFIC, CBO ₺160/gün). Hesap **LINK_CLICKS faturalamaya henüz uygun değil** (yeni işletme kısıtlaması, birkaç hafta sonra açılabilir) → billing_event=IMPRESSIONS + optimization_goal=LANDING_PAGE_VIEWS kullanılıyor, hesaptaki diğer trafik kampanyaları da aynı şekilde.
- **Ad set'ler**: `52560160072763` ("Patoloji-01 | TR 18-30", geniş Reels+Stories+Feed, şu an PAUSED) ve `52560700074363` ("Patoloji-01 | TR 18-30 | Sadece Feed Testi", ACTIVE — `facebook_positions:["feed"]` + `instagram_positions:["stream"]` ile Reels/Stories/Instream dışlanmış).
- **Bulgu — placement kalitesi**: Karma trafikte (Reels+Stories ağırlıklı, tıklamaların %71'i) ViewContent→QuizStart oranı sadece %13-20 iken, **sadece Feed'e daraltılınca oran %29-33'e çıkıyor** (iki ayrı ölçümde, büyüyen örneklemle tutarlı). Sebep: Reels/Stories kullanıcısı hızlı kaydırma modunda, çok soruyu okuyup cevaplamıyor; ayrıca reklam görselinin kendisi soruyu zaten gösterdiği için merak unsuru azalmış olabilir. Feed trafiği cost-per-link-click açısından daha pahalı (₺1,30 vs ₺0,83) ama kalite farkı bunu telafi ediyor gibi duruyor. Örneklem büyüdükçe tekrar değerlendirilmeli.
- **Bug fix'leri (bu dönemde yapıldı)**:
  - `AppStoreClick` hiç fire olmuyordu — App Store'a hard navigasyon pixel isteğini kesiyordu. Çözüm: `handleAppStoreClick` artık `preventDefault` + ~250ms gecikmeli `window.location.href` kullanıyor (`PublicQuizFunnel.jsx`).
  - In-app tarayıcı (Instagram/Facebook WebView) Google OAuth'u engelliyor (Google'ın kendi politikası, `signInWithPopup` sessizce başarısız oluyor) → hiç `CompleteRegistration` gelmiyordu. `src/utils/device.js` → `isInAppBrowser()` eklendi; `QuizContinueModal.jsx` in-app tarayıcıda "Tarayıcıda Aç" uyarı banner'ı + "Linki Kopyala" gösteriyor.
  - "Linki Kopyala" ile in-app tarayıcıdan gerçek Safari/Chrome'a geçilince `sessionStorage` taşınmadığından skor kayboluyordu. `publicQuizSession.js` → `buildResumeUrl`/`parseResumeToken` ile skor+tamamlanma zamanı linke (`?qr=` param) gömülüyor, yeni tarayıcıda local oturum yoksa buradan restore ediliyor.
- **Meta Ads MCP güvenilirlik notu**: `ads_get_dataset_stats` bazen (özellikle `event_total_counts` agregasyonunda) tutarsız/eski sayılar döndürebiliyor. Kritik kararlardan önce kullanıcıdan Events Manager ekran görüntüsü almak (Genel Bakış → Toplam Olaylar) daha güvenilir.

## Kullanıcı Notları

- Demo mod çalışıyor, Google ile giriş iOS'ta düzeltildi (commit: 644d1db)
- SplashScreen uyarısı (otomatik gizleniyor) — kritik değil
- `xpc_user_sessions` hatası → Simulator kısıtlaması, gerçek cihazda çıkmaz
- Free kullanıcı limitleri: `src/config/limits.js` → `FREE_LIMITS`
- Premium kontrol: `src/utils/premiumUtils.js` → `isUserPremium(userData)`
