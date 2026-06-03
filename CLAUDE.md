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
