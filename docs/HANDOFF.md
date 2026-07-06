# HANDOFF — Projeye Sıfırdan Başlayan İçin Durum Özeti

> Amaç: Bu dosyayı okuyan herhangi bir geliştirici veya AI modeli, başka hiçbir bağlam olmadan
> projenin ne olduğunu, neyin nerede durduğunu ve sırada ne olduğunu anlayabilmeli.
> Güncellik: 2026-07-06, `main` @ `6027bdd`. Bir bölümü değiştiren PR bu dosyayı da günceller.

## 1. Ürün nedir?

Tusoskop, Türkiye'de TUS (Tıpta Uzmanlık Sınavı) hazırlığı için soru çözme + akıllı tekrar (FSRS) uygulamasıdır. Web (PWA, www.tusoskop.com, Vercel + Firebase Hosting) ve iOS (Capacitor, App Store id6776331691) olarak yayında. Tek hekim-kurucu geliştiriyor; sınırlı zaman/bütçe. Gelir: "Plus" süreli erişim (30/90/180 gün; 89,90/209,70/359,40 TL) — PayTR iFrame ile yalnızca web'den, otomatik yenileme YOK.

## 2. Teknik iskelet (nerede ne var?)

- **Frontend:** React 19 + Vite + Tailwind 4. Router YOK — `window.location.pathname` + view state (`src/App.jsx` hafif public kabuk, `src/AppAuthenticated.jsx` lazy yüklenen asıl uygulama, `src/AppRoot.jsx` `/coz` izolasyonu).
- **Backend:** Firebase (Auth: yalnızca Google+Apple; Firestore; Cloud Functions `functions/`). Ek olarak Vercel serverless `api/` (quiz-session, campaign-redirect) Admin SDK ile yazar.
- **Soru bankası:** `src/data/questionChunks/*.js` + `_manifest.json`. **7077 soru, 11 ders**, 150 konu. Statik bundle — Firestore'da soru yok. Sabit denemeler: `src/data/exams.js` (10 adet, 200'er soru, `setVersion`'lı).
- **FSRS:** `src/utils/smartReviewScheduler.js` (saf mantık, testli) + `src/services/smartReviewService.js` (Firestore sync). Kurallar CLAUDE.md'de — FSRS tek zamanlama otoritesi.
- **Limitler:** `src/config/limits.js` (`FREE_LIMITS`: 30 soru/gün, 2 konu testi/gün, 1 deneme/ay, 10 tekrar/gün). Artırım sunucuda: `functions/index.js > incrementUsage` (transaction'lı). Premium kontrol: `src/utils/premiumUtils.js > isUserPremium`.
- **Ödeme:** `functions/paytr.js` — fiyat tablosu SUNUCUDA (`PAYTR_PLANS`), hash doğrulamalı callback, idempotent aktivasyon → `users/{uid}` plan alanları. İstemci: `PaytrCheckoutModal.jsx` (onSnapshot ile başarı tespiti). Secret'lar Firebase Secret Manager'da.
- **Güvenlik:** `firestore.rules` — premium alanları owner update'te diff ile kilitli; `admins/{uid}` koleksiyonu yetki kaynağı; usage istemciden yazılamaz. Denetim raporu: `reports/firebase-security-audit.md` (kritik bulgu yok; öneriler büyük ölçüde uygulanmış).
- **Analitik:** GA4 (dynamic import), Meta Pixel (`src/lib/metaPixel.js`; PageView/CompleteRegistration/Purchase), Clarity, backend `publicQuizSessions` + `campaignClicks`. **CAPI ve Sentry YOK.**
- **AI:** `generateDailyStudyPlan` (premium-only, Gemini 2.5 Flash, günlük cache `aiRecommendations/{date}`, JSON şema doğrulamalı, hata halinde deterministik fallback plan).
- **CI:** `.github/workflows/ci.yml` — lint, vitest (39 test dosyası), soru validasyonu, build, Playwright smoke. `test:rules` scripti VAR ama CI'da YOK. `daily-story.yml` günde 3 kez Instagram carousel atar.
- **Branch'ler:** `main` (web) + `ios-appstore-v1` (iOS-özel; bu klonda görünmüyor — cherry-pick ile senkron, CLAUDE.md "Sık Yapılan İşlemler").

## 3. Funnel bugün nasıl çalışıyor?

Meta reklamı → `/coz/{slug}` (login'siz 3 soru, tek aktif kampanya: patoloji) → sonuç ekranı → App Store linki (pt/ct'li) VEYA "Web'de devam" → Google/Apple login → dashboard. **Bilinen kırık:** `/coz`'da çözülen cevaplar hesaba TAŞINMIYOR (localStorage `tusoskop_quiz_result`'ta bekliyor). SEO tarafı: PublicHome + 11 branş sayfası + `/tus-puan-hesaplama` + `/tus-kontenjan-tablosu` (statik prerender, `scripts/generate-seo-pages.mjs`).

## 4. Plan seti (bu klasördeki dosyalar nasıl kullanılır?)

| Dosya | Ne için |
|---|---|
| `MASTER_PLAN_2026_2028.md` | Puanlı durum analizi, konumlandırma, 18-24 ay dönem planı, funnel tasarımı, moat, monetizasyon, red team, "yarın sabah ilk 5 görev" |
| `90_DAY_EXECUTION_PLAN.md` | Hafta hafta görevler (Etki/Güven/Efor, tamamlanma kriteri, fail koşulu). **Buradan çalışılır.** |
| `METRICS_AND_EVENTS.md` | Event taxonomy tek doğruluk kaynağı; sistem görev ayrımı (GA4 ürün, Pixel reklam, backend gelir) |
| `TECH_DEBT_REGISTER.md` | TD-01..20 borç listesi, severity'li |
| `GROWTH_EXPERIMENTS.md` | Deney formatı + backlog; her deneyde vazgeçme kriteri |
| `PRODUCT_PRINCIPLES.md` / `DO_NOT_BUILD.md` | Karar filtreleri — PR'lar buna karşı test edilir |
| `DECISION_LOG.md` | Verilmiş/açık kararlar (D-001..) |

**Kilit tanımlar:** NSM = Weekly Committed Reviewers (haftada ≥3 gün due tekrar tamamlayan kullanıcı). Aktivasyon = 72 saatte ≥20 soru + 7 günde ≥1 tekrar oturumu. Retention = W4'te ≥1 tekrar oturumu. Öncelik zinciri: güvenilirlik → ölçüm → aktivasyon → retention → monetizasyon → ölçeklenme.

## 5. Şu an sırada ne var? (2026-07-06 itibarıyla)

90 günlük planın 1. haftası: (1) Sentry kurulumu, (2) `test:rules` CI'ya, sonra taxonomy Tier-1 eventleri, timezone düzeltmesi (TD-04), `/coz` cevap taşıma (E-01), onboarding, Mini TUS (Hafta 7-9). Mini TUS **henüz kodda yok** — sıfırdan yazılacak (spec: MASTER_PLAN §4 Aşama 5 + 90g H7).

## 6. Dokunurken bilinmesi gereken tuzaklar

1. **Fiyat/premium asla istemciden yazılmaz** — `PAYTR_PLANS` sunucu tablosu ve rules diff koruması bunu zorlar; yeni özellik bu deseni bozamaz.
2. **`premiumUntilToDate` helper'ı `functions/paytr.js` içinde tanımlı kalmalı** (geçmişte ReferenceError yaşandı — CLAUDE.md).
3. Gün anahtarları (`todayKey`) şu an **UTC** — TR'de 03:00 sınırı. Düzeltme planlı (TD-04); düzeltirken istemci+sunucu birlikte değişmeli.
4. Soru eklerken: `_manifest.json` sayıları güncellenmeli, `npm run quality:questions` çalıştırılmalı; `TOTAL_QUESTIONS` (`src/seo/subjectData.js`) manifest ile aynı tutulmalı; pazarlama etiketi otomatik "bir alt yüzlük" kuralıyla üretilir.
5. `/tus-puan-hesaplama` mantığı iki yerde birebir yaşar: `src/seo/tusScoring.js` (React) ve `scripts/generate-seo-pages.mjs` (statik) — biri değişirse diğeri de.
6. FAQ JSON-LD sayfada görünen FAQ ile birebir aynı olmalı (Google kuralı; üretici `slice(0,6)` ikisini de besler).
7. iOS'a değişiklik göndermek: main'e commit → `ios-appstore-v1`'e cherry-pick → `npm run build && npx cap sync ios` → Xcode. iOS'ta **PayTR/harici ödeme linki gösterme** (Apple 3.1.1; DO_NOT_BUILD).
8. Leaderboard yolu lig ekiyle: `weeklyLeaderboard/{weekId}_{league}` — suffix'siz yazım listede görünmez.
9. `scripts/seedFakeLeaderboard.mjs` sahte kullanıcı ekler — KULLANMA; üretim temizliği planlı (TD-16).
10. Testler: `npm run test` (vitest), `npm run test:rules` (emülatör ister), `npm run test:e2e` (build ister). Soru işleri: `npm run quality:questions`.

## 7. Bilinmeyenler / doğrulanamayanlar

- Gerçek kullanıcı/gelir/trafik sayıları repoda yok — tüm oran hedefleri taban ölçümü yapılana kadar [VARSAYIM].
- `ios-appstore-v1` içeriği bu ortamdan incelenemedi; iOS'taki premium ekranının bugünkü durumu bilinmiyor (TD-17/18).
- `docs/CURRENT_STATE.md` hiç var olmadı; "302 test" ve "Mini TUS üzerinde çalışılıyor" iddialarının repoda karşılığı yok (MASTER_PLAN §0).
