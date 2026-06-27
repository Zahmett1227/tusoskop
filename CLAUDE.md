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

### Tek doğruluk kaynağı: `src/seo/subjectData.js`
- 11 dersin gerçek soru sayıları + her dersten **soru bankamızdan alınmış gerçek örnek soru** (id, konu, q, options, correct, exp).
- `TOTAL_QUESTIONS` = branş sayımlarının toplamı (şu an 7077). `_manifest.json` `subjectCounts` ile aynı tutulmalı.
- **"X+" pazarlama kuralı** (`questionCountLabel`): gerçek sayıyı **bir alt yüzlüğe** yuvarlar, asla abartmaz. `7077 → 7.000+`, `7200 → 7.100+`. Sayı arttıkça etiket otomatik büyür ama her zaman gerçeğin altında kalır.

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
| Noscript ana sayfa | `scripts/render-home-seo.mjs` | JS'siz tarayıcı + AI botları (GPTBot/ClaudeBot/Perplexity) için `index.html` içine gömülür |

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

## Kullanıcı Notları

- Demo mod çalışıyor, Google ile giriş iOS'ta düzeltildi (commit: 644d1db)
- SplashScreen uyarısı (otomatik gizleniyor) — kritik değil
- `xpc_user_sessions` hatası → Simulator kısıtlaması, gerçek cihazda çıkmaz
- Free kullanıcı limitleri: `src/config/limits.js` → `FREE_LIMITS`
- Premium kontrol: `src/utils/premiumUtils.js` → `isUserPremium(userData)`
