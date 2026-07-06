# HANDOFF — Tusoskop Devir-Teslim Belgesi

> **Amaç:** Bu dosyayı okuyan, repository'yi daha önce hiç görmemiş bir geliştirici veya AI modeli;
> başka hiçbir bağlam olmadan ürünün ne olduğunu, neyin nerede durduğunu, nasıl çalıştırılıp
> yayınlandığını ve sırada ne olduğunu anlayabilmeli.
>
> **Güncellik:** 2026-07-06, `main` @ `6027bdd`. Kanıt = repo doğrulaması. **[VARSAYIM]** = repoda
> doğrulanamadı, açıkça varsayıldı.
>
> **Not:** Görevi veren brief bu dosyanın "GitHub 429 hatası" içerdiğini bildirmişti; repo
> doğrulamasında dosya geçerli içerik taşıyordu (429 izi yok). Bu sürüm yine de tam şablona genişletildi.

---

## 1. Ürün amacı

Tusoskop, Türkiye'de **TUS (Tıpta Uzmanlık Sınavı)** hazırlığı yapan tıp öğrencileri ve hekimler için bir **soru çözme + akıllı tekrar (FSRS)** platformudur. Dershanenin *yerine* değil, *yanına* konumlanır: kişiselleştirme, analiz, hızlı ürün geliştirme ve iyi UX üzerinden rekabet eder — içerik hacmiyle değil. Web (PWA) ve iOS (App Store) olarak yayında. Tek hekim-kurucu tarafından, sınırlı zaman/bütçeyle geliştirilir.

**Temel vaat:** "Ne çözdüğünü unutmadan önce sana geri getiren ve TUS gününe kadar neye çalışacağını söyleyen kişisel TUS koçu." (Ayrıntı: `docs/MASTER_PLAN_2026_2028.md`.)

## 2. Teknoloji yığını

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19 + Vite 8 + TailwindCSS 4 |
| Grafik | chart.js + react-chartjs-2 |
| Backend | Firebase: Auth, Firestore, Cloud Functions (v2, Node) |
| Serverless (web) | Vercel `api/` (Admin SDK) |
| Native | Capacitor 8 (iOS); SPM (CocoaPods yok) |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`), yalnızca sunucuda, premium-only |
| Ödeme | PayTR iFrame API (Shopify kaldırıldı) |
| Analitik | Firebase Analytics (GA4), Meta Pixel, Microsoft Clarity |
| Test | Vitest (birim), Playwright (E2E), Firestore emulator (rules) |
| CI | GitHub Actions (`.github/workflows/ci.yml`, `daily-story.yml`) |
| Hosting | Vercel (birincil, www.tusoskop.com) + Firebase Hosting (redirect/rewrite tanımlı) |

Bağımlılıklar: `package.json` (kök, frontend) ve `functions/package.json` (Functions). Router **yok** — routing `window.location.pathname` + view state ile.

## 3. Ana klasör ve dosya haritası

```
src/
  App.jsx                 Hafif public kabuk (firebase import ETMEZ); SEO + anonim /
  AppAuthenticated.jsx    Asıl uygulama (lazy); firebase + Firestore + tüm ekranlar (959 satır)
  AppRoot.jsx             /coz funnel'ını ağır app'ten izole eden kök
  main.jsx                Giriş; analytics init (runAfterFirstPaint)
  firebase.js             Web SDK config + auth (Google/Apple, native köprü)
  components/
    Dashboard.jsx         "Tekrara Başla", akıllı tekrar planı
    StudyScreen.jsx       Soru çözme ekranı
    ExamScreen.jsx        Deneme çözme (836 satır)
    StudyCollectionScreen.jsx  Tekrar kuyruğu (getDueSmartReviews)
    funnel/               /coz mikro deneme (PublicQuizFunnel, QuizQuestionCard, ...)
    premium/              PaytrCheckoutModal, PremiumInfoScreen, LimitReachedModal
    seo/                  PublicHome + SeoLandingPage
    leaderboard/, admin/, auth/, legal/, layout/, study/
  services/               Firestore CRUD (smartReview, studyCollection, paytr, user, ...)
  utils/                  smartReviewScheduler.js (FSRS), premiumUtils, acquisition, ...
  data/                   questionChunks/*, exams.js, publicQuizCampaigns.js, TopicTrackerData.js
  seo/                    subjectData.js, seoContent.js, tusScoring.js, kontenjanData.js
  config/                 limits.js, plusPlans.js, support.js
  constants/              reviewContext.js
  lib/                    metaPixel.js, clarity.js, publicQuizAnalytics.js, firebaseConfig.js
  hooks/                  useStudyState.js, useAppAuthBootstrap.js
functions/
  index.js                Function export'ları (5 adet)
  paytr.js                PayTR token + callback + PAYTR_PLANS fiyat tablosu
  services/               AI plan üretimi, kullanıcı özeti, fallback plan
  prompts/, utils/, socialPublisher.js, instagramGraphApi.js
api/                      Vercel serverless: quiz-session.js, campaign-redirect.js
lib/                      quiz/, campaign/ (Vercel api destek kodu, Admin SDK)
scripts/                  generate-seo-pages, validate/audit/review-question-bank, emulator test, ...
e2e/                      smoke.spec.js (Playwright)
docs/                     Bu belge + strateji seti (aşağıda)
reports/                  Soru kalite auditi + güvenlik denetimi çıktıları
firestore.rules           Güvenlik kuralları
firebase.json, vercel.json  Hosting/redirect/rewrite
```

**Strateji dokümanları:** `MASTER_PLAN_2026_2028.md`, `SIX_MONTH_EXECUTION_PLAN.md`, `90_DAY_EXECUTION_PLAN.md`, `METRICS_AND_EVENTS.md`, `TECH_DEBT_REGISTER.md`, `GROWTH_EXPERIMENTS.md`, `PRODUCT_PRINCIPLES.md`, `DO_NOT_BUILD.md`, `DECISION_LOG.md`, `QUESTION_BANK_QUALITY_WORKFLOW.md`.

## 4. Local geliştirme komutları

```bash
npm install                 # bağımlılıklar
npm run dev                 # Vite dev server (localhost:5173/5174)
npm run lint                # ESLint
npm run test                # Vitest (39 test dosyası)
npm run test:rules          # Firestore rules — emulator (Java gerekir; firebase-tools)
npm run validate:questions  # Soru bankası format kapısı
npm run audit:questions     # Kalite heuristik raporu → reports/
npm run review:questions    # Manuel kontrol kuyruğu → reports/
npm run quality:questions   # validate + audit + review
npm run build               # SEO prerender + vite build (dist/)
npm run test:e2e            # Playwright (build gerektirir; test:e2e:full ikisini yapar)
```

Chromium ortamda kurulu (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`); `playwright install` çalıştırma.

## 5. Deployment yapısı

- **Web:** Vercel birincil host (www.tusoskop.com). `vercel.json` www yönlendirmesi (`tusoskop.com → www`), `/indir` → App Store, `/fiyatlandirma` redirect, `/coz/**` ve `/basla` rewrite. `/giris`,`/app` için `X-Robots-Tag: noindex`. Build: `npm run build` → `dist/`.
- **Firebase Hosting:** `firebase.json` benzer redirect/rewrite (paralel/yedek yapı). `dist/` yayınlanır.
- **Cloud Functions:** `functions/` codebase; `firebase deploy --only functions`. Secret'lar Secret Manager'da (aşağıda).
- **iOS:** `git pull ios-appstore-v1` → `npm run build` → `npx cap sync ios` → Xcode → cihaz. main'e commit → `ios-appstore-v1`'e cherry-pick akışı (CLAUDE.md).
- **CI:** her PR'da lint + vitest + **rules test (emulator)** + soru validasyonu + build + Playwright smoke. `daily-story.yml` günde 3× Instagram carousel (Python + IG Graph API, secret'lı).

## 6. Firebase Auth

- Sağlayıcılar: **Google ve Apple** (e-posta/şifre YOK). `src/firebase.js`.
- Native (iOS): `window.Capacitor.Plugins.GoogleAuth` / `@capacitor-firebase/authentication` köprüsü; `signInWithNativeGoogle` (yalnızca `ios-appstore-v1`). `isNativePlatform()` web build'i kırmadan global üzerinden kontrol eder.
- Hafif oturum işareti: `localStorage["tusoskop_session"]` — `App.jsx` bunu okuyup uygulamayı doğrudan yükler (Firebase Auth SDK'sı `/` ve SEO route'larında hiç yüklenmez).
- Yeni hesap: `userService.js > ensureUserDocument` — yalnızca yeni hesap dalında `sign_up`/`CompleteRegistration` atar.

## 7. Firestore koleksiyonları

| Yol | İçerik | İstemci yazımı |
|-----|--------|----------------|
| `users/{uid}` | Profil, plan, premium alanları, streak, targetScore, acquisition | Evet (premium alanları HARİÇ) |
| `users/{uid}/usage/{id}` | Günlük/aylık kullanım sayaçları | **Hayır** (yalnızca `incrementUsage` CF) |
| `users/{uid}/smartReviews/{questionId}` | FSRS kart durumu | Evet (owner) |
| `users/{uid}/wrongQuestions`, `favoriteQuestions` | Analitik/metadata (scheduler DEĞİL) | Evet (owner) |
| `users/{uid}/questionHistory/{questionId}` | Çözüm geçmişi (path id == questionId) | Evet (owner, id eşleşmeli) |
| `users/{uid}/fsrsAddEvents`, `fsrsDailyStats` | FSRS analitik | create/update (owner) |
| `users/{uid}/aiRecommendations/{date}` | AI günlük plan cache | **Hayır** (yalnızca CF) |
| `results/{id}`, `studySessions/{id}` | Deneme/oturum sonuçları (immutable) | create (kendi userId) |
| `premiumPurchaseIntents/{merchantOid}` | Ödeme niyeti | create (katı allowlist); read/update admin |
| `admins/{uid}` | Yetki kaynağı (`active==true`) | **Hayır** (yalnızca Console) |
| `adminLogs/{id}` | Aktivasyon/işlem logu | create admin, immutable |
| `leaderboardProfiles/{uid}`, `normalizedNicknames/{n}` | Lig profili + nickname benzersizlik | owner/transaction |
| `weeklyLeaderboard/{weekId}_{league}/users/{uid}` | Haftalık skor (temel/klinik lig) | **owner create/update — TD-03 risk** |
| `socialContentQueue`, `socialLogs`, `campaignClicks` | Sosyal medya + kampanya (backend) | admin/backend |

## 8. Firestore rules (özet)

`firestore.rules` — `rules_version='2'`, sonda global allow yok (default deny). Yardımcılar: `isSignedIn`, `isAdmin` (admins koleksiyonu + active), `isOwner`. **Premium alanları** (`plan, premiumStatus, premiumUntil, premiumSource, lifetimePremium, grantedBy/At, adminNote` + `role, isAdmin, admin`) owner update'te `diff().affectedKeys()` ile kilitli — kullanıcı kendini premium/admin yapamaz. `premiumPurchaseIntents` create'te katı key allowlist + `status=='started'` zorunlu. Usage alt koleksiyonu istemciye kapalı. **Rules regresyonu artık CI'da `test:rules` ile korunuyor** (`scripts/firestore-rules-emulator-test.mjs`, REST tabanlı, credential gerektirmez). Denetim: `reports/firebase-security-audit.md` (kritik bulgu yok).

## 9. FSRS sistemi

`src/utils/smartReviewScheduler.js` (saf mantık, testli, 396 satır) + `src/services/smartReviewService.js` (Firestore sync).
- **FSRS = tek zamanlama otoritesi.** `wrongQuestions`/`favoriteQuestions` artık scheduler değil, analitik.
- `applyReview(reviewState, grade, now, reviewContext)` master router: `isDue` → normal FSRS; `isSameDay` (elapsed<1) → sadece `lastPracticeAt`; erken → `applyEarlyReview` (delta × earlyWeight).
- Erken tekrar: `progressRatio = elapsedDays/scheduledDays`; <0.5+doğru → dueAt korunur; <0.75+yanlış → `softLapseCount`; ≥0.75+yanlış → gerçek `lapseCount`.
- Yeni alanlar (geri uyumlu, `|| 0`): `softLapseCount, lastPracticeAt, sameDayReviewCount, softReviewCount, lastReviewContext`.
- Review context sabitleri: `src/constants/reviewContext.js`.
- Dashboard: `smartDue>0` → direkt FSRS review; `=0` → çalışma alanı.

## 10. Quiz ve deneme akışları

- **Soru bankası:** `src/data/questionChunks/*.js` + `_manifest.json`. **7077 soru, 11 ders, 150 konu.** Statik bundle — Firestore'da soru yok.
- **Sabit denemeler:** `src/data/exams.js` — 10 adet 200'lük deneme (Kamp/Bahar/Tekrar), `setVersion`'lı, herkeste aynı set/sıra. `src/data/fixedExams/*QuestionIds.js`.
- **Konu testleri:** dinamik üretilir. `examBlueprints.js` dağılım.
- **Mini TUS:** **henüz kodda YOK** (planlı — SIX_MONTH Faz 3). 20 soru + tahmini puan aralığı + yüzdelik hedefleniyor.
- Skorlama matematiği: `src/seo/tusScoring.js` (React) ve `scripts/generate-seo-pages.mjs` (statik) — **ikisi birebir aynı, biri değişirse diğeri de**.

## 11. `/coz` funnel'ı

Meta reklamı → `/coz/{slug}` (login'siz 3 soru) → sonuç → App Store (pt/ct linkli) VEYA "Web'de devam" → login.
- İzole bundle (`AppRoot.jsx`), Firebase SDK yalnızca "Web'de devam"da dinamik import.
- Kampanyalar statik: `src/data/publicQuizCampaigns.js` (`correctIndex` 0-tabanlı). Şu an **1 aktif kampanya** (patoloji).
- Session: `src/utils/publicQuizSession.js` (sessionStorage, slug-namespaced, resume). Sonuç: `localStorage["tusoskop_quiz_result"]`.
- Analytics: `src/lib/publicQuizAnalytics.js` (GA4 + mevcut Pixel'i yeniden kullanır).
- Backend özet: `api/quiz-session.js` + `lib/quiz/logQuizSession.js` (Admin SDK, client Firestore write YOK).
- **Bilinen kırık (TD):** çözülen cevaplar kayıt sonrası hesaba TAŞINMIYOR — localStorage'da bekliyor (SIX_MONTH S11-S12).

## 12. Ödeme ve premium sistemi

- **PayTR iFrame** (Shopify kaldırıldı). Akış: `PremiumInfoScreen` → `requestPaytrToken` → CF `createPaytrToken` (intent kaydı + PayTR token) → `PaytrCheckoutModal` iframe → kullanıcı öder → PayTR sunucudan `paytrCallback` (hash doğrulama) → `users/{uid}` aktivasyon → modal `onSnapshot` başarı → reload.
- **Fiyat tek otoritesi SUNUCUDA:** `functions/paytr.js > PAYTR_PLANS` (plus_1m 89,90 / plus_3m 209,70 / plus_6m 359,40 TL). İstemci yalnızca `planId` yollar. Aktivasyon idempotent, `premiumUntil` uzatmalı (`max(now, mevcut)`).
- Free/Plus limitleri: `src/config/limits.js` (`FREE_LIMITS`: 30 soru/gün, 2 konu testi, 1 deneme/ay, 10 tekrar/gün). Sunucu artırımı: `functions/index.js > incrementUsage` (transaction).
- Premium kontrol: `src/utils/premiumUtils.js > isUserPremium`; sunucu tarafı `isPremiumServer` (`functions/index.js`).
- `premiumUntilToDate` helper **`functions/paytr.js` içinde tanımlı olmalı** (geçmişte ReferenceError yaşandı).

## 13. Analytics

Dört sistem, ayrı görevler (detay: `docs/METRICS_AND_EVENTS.md`):
- **GA4** (Firebase Analytics, dynamic import): ürün funnel'ı, kararlar buradan.
- **Meta Pixel** (`src/lib/metaPixel.js`, yalnızca `VITE_META_PIXEL_ID`): PageView, CompleteRegistration (yeni hesap dalı), Purchase (backend-onaylı, `merchantOid` dedup). CAPI **yok**.
- **Clarity** (`src/lib/clarity.js`): nitel teşhis.
- **Backend** (`publicQuizSessions`, `campaignClicks`, `premiumPurchaseIntents`): gelir ground truth.
- Merkezî `src/lib/analytics.js` wrapper **henüz yok** (planlı S04) — bugün çağrılar dağınık, taxonomy sapma riski.

## 14. iOS ve web farklılıkları

- iOS'a özel kod `ios-appstore-v1` branch'inde (**bu klonda görünmüyor** [VARSAYIM: drift bilinmiyor]).
- Native Google/Apple auth yalnızca ios branch. Google Sign-In iOS Simulator'da çalışmaz (gerçek cihaz).
- Anonim `/` web'de `PublicHome`; iOS'ta doğrudan login isteniyorsa `Capacitor.isNativePlatform()` kontrolü gerekir (açık iş).
- `fbq` WKWebView'da "web" veri kaynağı olarak çalışır.
- **iOS'ta PayTR/harici ödeme linki gösterilmemeli** (Apple 3.1.1) — bkz. TD-18, DECISION_LOG D-007.

## 15. Soru bankası kalite sistemi

Üç kapı (`docs/QUESTION_BANK_QUALITY_WORKFLOW.md`): `validate:questions` (bloklayıcı format), `audit:questions` (heuristik rapor), `review:questions` (manuel kuyruk). CI'da format kapısı çalışır. Kararlar: `fix / false_positive / needs_physician / accepted_as_is`. **Otomatik audit tıbbi doğruluk iddia etmez; cevap/açıklama uzman onayına bırakılır.** Merge kapısı: validate hatası veya açık kritik bulgu = merge yok. **Uyarı:** audit son olarak 5687 soruyla üretilmiş (banka 7077) — bayat (TD-09).

## 16. Bilinen kritik sorunlar

`docs/TECH_DEBT_REGISTER.md` tam liste. En kritik olanlar:
1. **Üretim hata izleme yok** (Sentry yok) — TD-01.
2. Leaderboard skoru istemciden yazılabilir (hile) — TD-03.
3. Gün sınırı UTC → TR'de 00:00-03:00 tutarsızlık (streak/limit) — TD-04.
4. `/coz` cevapları kayıt sonrası kayboluyor — TD (funnel).
5. iOS ödeme/Apple 3.1.1 belirsizliği — TD-18.
6. CAPI yok, attribution'da tıklama ID'leri kaybediliyor — TD-12/13.
7. Functions testleri yok — TD-07.
8. Sahte leaderboard seed verisi (güven riski) — TD-16.

## 17. Aktif kararlar

`docs/DECISION_LOG.md`. Açık olanlar: D-007 iOS IAP/gizleme (Faz 5), D-008 Mini TUS soru sayısı, D-009 tekrar limiti 10→20, D-010 push mü e-posta mı önce, D-011 boş lig çözümü, D-012 Android. Verilmiş: PayTR (D-001), FSRS otoritesi (D-002), SEO framework değil-Vite (D-003), NSM=Weekly Committed Reviewers (D-006).

## 18. İlk beş sonraki görev (kesin sıra)

Sprint 1 (bu iş) tamamlandığında sıradaki 5:
1. **Sentry kur (web)** — S02, TD-01.
2. **Sentry kur (Functions)** — S03.
3. **Merkezî `analytics.js` wrapper** — S04, taxonomy sapmasını önle.
4. **Tier-1 eventleri yayına al** (`sign_up`, `first_question_answered`, `first_review_completed`, GA4 `purchase`) — S05.
5. **`activation_completed` ölçümü** — S06.

(Sprint 1'in kendisi: HANDOFF/TECH_DEBT düzelt, SIX_MONTH oluştur, `test:rules` CI'ya — **bu PR**.)

## 19. Secret ve production verisiyle güvenlik uyarıları

- **Secret'lar Firebase Secret Manager'da:** `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT`, `GEMINI_API_KEY`. `PAYTR_MERCHANT_ID` gizli değil (env override). PayTR test modu `PAYTR_TEST_MODE=1` (canlıda "0").
- **Vercel env:** `FIREBASE_SERVICE_ACCOUNT_JSON` (Admin SDK, tek satır — repoya ASLA commit edilmez), `APPLE_CAMPAIGN_PT`, `VITE_*` (Pixel/Clarity/App Store token'ları).
- **`.gitignore`:** `.env*`, `*-firebase-adminsdk-*.json`, `serviceAccountKey*.json`, `*.log` — servis hesabı private key'leri asla commit edilmez.
- **Firebase web config** (`src/firebase.js`) publictir — Firebase web SDK için normal, secret değil.
- **Kurallar (bu ve sonraki modeller için):** üretim credential'ı kullanma; secret/private key/kullanıcı verisini çıktıya (log, PR, commit, chat) yazma; betikleri yerelde emulator/mock ile çalıştır; ödeme tutarını asla istemciden alma; rules güvenlik gevşetmesi yapma. Model kimliği (`claude-fable-5`) commit/PR/koda yazılmaz.

---

## 20. Doğrulanamayanlar / varsayımlar

- Gerçek kullanıcı/gelir/trafik sayıları repoda yok → tüm oran hedefleri [VARSAYIM].
- `ios-appstore-v1` içeriği bu ortamdan incelenemedi → iOS premium ekranı/drift bilinmiyor.
- `docs/CURRENT_STATE.md` hiç var olmadı; "302 test" ve "Mini TUS üzerinde çalışılıyor" iddialarının repoda karşılığı yok (yalnızca plan).
- 2027 TUS takvimi ÖSYM'ye bağlı → tarih değişirse plan fazları kayar.
