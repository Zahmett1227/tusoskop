# Tusoskop — Proje Hafızası

Türk TUS (Tıpta Uzmanlık Sınavı) sınav hazırlık uygulaması. React + Vite + Firebase + Capacitor iOS.

## Backend Tek Kaynak Kuralı (functions + firestore.rules) — KRİTİK

İki branch (`main` ve `ios-appstore-v2`) **tek Firebase projesine** deploy eder. Bu yüzden:

- `functions/` klasörü, `firestore.rules` ve `firebase.json`'ın **`firestore` + `functions` blokları** her iki branch'te **birebir aynı (birleşik süperset)** tutulur. Backend değişikliği hangi branch'te yapılırsa yapılsın diğerine aynen cherry-pick edilir. (`firebase.json`'ın `hosting` bloğu branch'e özgü kalabilir — canlı web hosting Vercel'de, Firebase Hosting kullanılmıyor; iOS uygulaması da firebase.json'ı hiç okumaz.)
- Birleşik `functions/index.js` **9 fonksiyon** export eder: `incrementUsage`, `registerAppleRefreshToken`, `deleteAccountAndData`, `verifyApplePurchase`, `tryPublishSocialContent`, `createPaytrToken`, `paytrCallback`, `onUserDocumentCreated`, `generateDailyStudyPlan`. Eksik export'lu kaynaktan deploy, eksik fonksiyonları **canlıdan siler** (web ödeme / iOS IAP kırılır).
- `allowedOrigins` Capacitor origin'lerini (`capacitor://localhost`, `ionic://localhost`, `https://localhost`) **içermek zorunda** — silinirse iOS callable'ları CORS'tan kırılır.
- `firestore.rules` birleşik sürümü, users create/update allowlist'lerinde `platform`/`appVersion`/`lastSeenAt` alanlarını içerir (iOS istemcisi bunları yazar; alanlar silinirse **iOS'ta yeni kullanıcı kaydı kırılır**) + istemciye kapalı `appleSubscriptions` bloğu.
- Deploy'da `--force` **asla** kullanılmaz. Doğru birleşik kaynaktan deploy'da CLI silme sorusu hiç sormamalı; sorarsa DUR — kaynak eksik demektir.
- `firebase.json`'daki predeploy hook'u (`scripts/check-backend-integrity.mjs`) export setini ve rules alanlarını doğrular, hata varsa deploy'u durdurur. Bu koruma bilerek eklendi; atlatmak yerine listeyi güncelle (yeni fonksiyon eklerken her iki branch'te birden).
- Deploy öncesi gerekli secret'lar (Secret Manager'da mevcut olmalı): `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT`, `META_CAPI_TOKEN`, `GEMINI_API_KEY`, `APPLE_SIGNIN_PRIVATE_KEY`.

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

## iOS Native Auth Stabilizasyonu (ios-appstore-v1)

iOS App Store öncesi Apple/Google/email girişlerinin **sonsuza asılı kalma** sorunu çözüldü.

### Kök neden & çözüm — Firebase Auth IndexedDB kilidi
`src/firebase.js`:
```js
export const auth = isNativePlatform()
  ? initializeAuth(app, { persistence: [browserLocalPersistence] })
  : getAuth(app);
```
- Firebase SDK v12, native WKWebView'de IndexedDB persistence başlatırken **tüm auth işlemlerini askıya alıyordu** → `signInWithCredential` / `signInWithEmailAndPassword` hiç resolve/reject olmuyordu.
- `initializeAuth` + `browserLocalPersistence` (localStorage) bunu giderir. Web'de `getAuth(app)` korunur.
- Dosyadaki yinelenen yerel `isNativePlatform()` silindi; `./utils/device`'tan import edilir.

### Timeout & teşhis
- `signInWithCredential` (Apple+Google) ve `signInWithEmailAndPassword`'a **12 sn timeout** (`Promise.race`) — ağ erişilemezse asılı kalmak yerine net hata.
- Teşhis `console.log`'ları `[Apple]` / `[Google]` / `[Email]` prefiksli (`nativeAuthService.js`, `firebase.js`).
- Native giriş hataları artık **`alert` ile `error.code` gösterir** (toast native'de kaçabiliyor). Apple cancel filtresi yalnızca bilinen iptal kodlarına (1001) daraltıldı.

### Yapılandırma
- `capacitor.config.json` → `FirebaseAuthentication.providers`: `["apple.com", "google.com"]`.
- `ios/App/App/Info.plist` → `NSAppTransportSecurity` / `NSAllowsArbitraryLoadsInWebContent: true` (WKWebView'in `identitytoolkit.googleapis.com` gibi dış HTTPS isteklerini ATS engellemesin).

## Klavye & Input (iOS)

- `capacitor.config.json` → `Keyboard.resize: "native"` — webview klavye açılınca üstüne küçülür; `min-h-dvh` layout'lar uyar, `--native-keyboard-height` ile ekstra padding **eklenmez** (`src/index.css`: `.native-ios.keyboard-visible body { padding-bottom: 0; }`).
- `src/index.css` → tüm `input/textarea/select`'e `touch-action: manipulation` + `-webkit-tap-highlight-color: transparent`. iOS'un double-tap-zoom beklemesinden kaynaklı **4-5 sn klavye açılma gecikmesi** giderildi.
- `src/components/auth/SignInOptions.jsx` → input'larda `onFocus` `scrollIntoView` **YOK**. Smooth scroll input'u kaydırıp dokunma hedefini şaşırtıyor, focus düşüyordu (3-dokunma sorunu). `resize: native` görünürlüğü zaten sağlıyor.

## Hesap Silme (Account Deletion)

App Store zorunluluğu — uygulama içinden erişilebilir.

- **Akış**: `AccountSettingsScreen.jsx` → `accountDeletionService.deleteCurrentAccountAndData()` → callable `deleteAccountAndData` (`functions/index.js`, `us-central1`).
- **Onay**: kullanıcı alana `SIL` yazar + `window.confirm`.
- **Cloud Function**: `users/`, `studyCollections/`, `examResults/`, `streaks/` recursive silinir; `results` / `studySessions` query-batch silinir; `premiumPurchaseIntents` anonimleştirilir; `admin.auth().deleteUser`.
- **"internal" hatası tuzağı**: Firebase, callable içindeki **ham (non-HttpsError) JS hatalarının** mesajını güvenlik gereği `"internal"` diye maskeler. Bu yüzden silme gövdesi `try/catch` ile sarıldı; ham hatalar `HttpsError("internal", gerçek mesaj)` olarak yeniden fırlatılır. İstemci `error.code/message/details` log'lar ve UI'da gösterir.
- ⚠️ **Her değişiklikten sonra deploy şart**:
  ```bash
  cd functions && npm install && cd ..
  firebase deploy --only functions
  ```
  Yoksa eski kod çalışır / maskelenmiş `internal` görülür.
- **Kapsam dışı (sonraya)**: Apple Sign-In token revoke — App Review reddederse ilk eklenecek.

## iOS Yapılandırma

- Bundle ID: `com.tusoskop.app`
- `GoogleService-Info.plist`: `ios/App/GoogleService-Info.plist` (Xcode projesine eklenmiş)
- SPM packages: `ios/App/CapApp-SPM/Package.swift`
- `@capacitor-firebase/authentication` SPM ile dahil

## Önemli Servisler

| Dosya | Görev |
|-------|-------|
| `src/services/smartReviewService.js` | FSRS review CRUD, Firestore sync |
| `src/services/studyCollectionService.js` | wrongQuestions, favoriteQuestions (artık scheduler değil) |
| `src/services/nativeAuthService.js` | iOS native auth (Apple + Google) — sadece ios-appstore-v1'de |
| `src/services/accountDeletionService.js` | Hesap silme callable sarmalayıcı (`deleteAccountAndData`) |
| `src/hooks/useStudyState.js` | Soru çözme state'i, `activeTopicName` → reviewContext olarak FSRS'ye iletilir |

## Dashboard Profil Menüsü (ios-appstore-v1)

`src/components/DashboardProfileMenu.jsx`

- 40×40px circular avatar butonu (Google fotoğrafı veya baş harfler)
- Tıklanınca dropdown: isim/e-posta, 5-renkli tema seçici, Destek linki, Geri bildirim, Çıkış
- Tema seçici direkt görünmez — avatara basınca açılır

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

### Cloud Functions deploy (hesap silme vb.)
```bash
cd functions && npm install && cd ..
firebase deploy --only functions
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
- iOS native auth kilidi (Apple/Google/email asılı kalma) `initializeAuth` + `browserLocalPersistence` ile çözüldü → bkz. "iOS Native Auth Stabilizasyonu"
- Hesap silme kod değişikliği sonrası `firebase deploy --only functions` yapılmazsa UI'da `internal` hatası görülür
- SplashScreen uyarısı (otomatik gizleniyor) — kritik değil
- `xpc_user_sessions` hatası → Simulator kısıtlaması, gerçek cihazda çıkmaz
- Free kullanıcı limitleri: `src/config/limits.js` → `FREE_LIMITS`
- Premium kontrol: `src/utils/premiumUtils.js` → `isUserPremium(userData)`
