# Altı Aylık Uygulama Planı — 60 Sprint (2026-07-07 → 2027-01-02)

> 180 gün, **60 adet 3 günlük sprint**. Kaynak: `MASTER_PLAN_2026_2028.md`, `90_DAY_EXECUTION_PLAN.md`,
> `TECH_DEBT_REGISTER.md`, `METRICS_AND_EVENTS.md`. Öncelik zinciri her fazda korunur:
> **güvenilirlik → ölçüm → aktivasyon → retention → monetizasyon → ölçeklenme.**
>
> **Kurucu kısıtı:** yoğun çalışma ama **aynı anda en fazla 2 iş akışı**. Her sprintte ≤3 görev,
> görevler en fazla 2 workstream'e ait. Sprint başına gerçekçi kapasite ~1.5-2 odak-gün.
>
> **[VARSAYIM]** işaretleri: gerçek kullanıcı/gelir/trafik verisi repoda yok; oran hedefleri taban
> ölçülene kadar varsayımdır. `2027 TUS 1. dönem` takvimi ÖSYM'ye bağlı; tarih değişirse Faz 3-4 kayar.
>
> **Not — kaynak dosya çelişkisi:** Görevi veren brief, `HANDOFF.md` ve `TECH_DEBT_REGISTER.md`'nin
> "GitHub 429" hatası içerdiğini bildirmişti. Repo doğrulaması: her iki dosya da geçerli gerçek içerik
> taşıyordu (429 izi yok). Yine de bu sprint setinde ikisi de genişletilmiş şablona yükseltildi.

## Faz Haritası

| Faz | Ay | Sprintler | Tema | Öncelik katmanı |
|-----|----|-----------|------|-----------------|
| 1 | Tem | S01-S10 | Güvenilirlik + Ölçüm temeli | güvenilirlik, ölçüm |
| 2 | Ağu | S11-S20 | Funnel bütünlüğü + Aktivasyon + İçerik | aktivasyon, ölçüm |
| 3 | Eyl | S21-S30 | Mini TUS + Kalibrasyon | aktivasyon |
| 4 | Eki | S31-S40 | Retention motoru (kuyruk, e-posta, push) | retention |
| 5 | Kas | S41-S50 | Monetizasyon (değer-önce paywall, paketler, win-back) | monetizasyon |
| 6 | Ara | S51-S60 | Moat derinleştirme + Ölçeklenme + Uyumluluk | ölçeklenme |

Workstream etiketleri: **A** = Güvenilirlik/Altyapı, **B** = Ölçüm/Analitik, **C** = Aktivasyon/Funnel, **D** = Retention, **E** = Monetizasyon, **F** = İçerik/Kalite, **G** = Moat/Veri, **H** = Ölçeklenme/Uyumluluk.

---

# FAZ 1 — Güvenilirlik + Ölçüm Temeli (S01-S10, Temmuz)

## Sprint 01 — 2026-07-07 → 2026-07-09  · [A]
- **Ana amaç:** Teknik durumu belgelemek ve rules regresyon kapısını CI'ya bağlamak (bu PR).
- **Görevler:** (1) `HANDOFF.md` + `TECH_DEBT_REGISTER.md` genişletilmiş şablona yükselt; (2) `SIX_MONTH_EXECUTION_PLAN.md` oluştur; (3) `test:rules`'ı `ci.yml`'e ekle (Java + firebase-tools + emulator).
- **Dosyalar:** `docs/HANDOFF.md`, `docs/TECH_DEBT_REGISTER.md`, `docs/SIX_MONTH_EXECUTION_PLAN.md`, `.github/workflows/ci.yml`.
- **Bağımlılık:** Yok.
- **Tamamlanma:** Belgeler eksiksiz; CI'da rules testi PR'da çalışıyor ve yeşil.
- **Testler:** `lint`, `test`, `test:rules`, `validate:questions`, `build`.
- **Metrik:** CI süresi <25 dk; rules testi PR'da görünür.
- **Rollback:** CI adımı flaky olursa `continue-on-error` yerine adımı geri al; belgeler geri alınmaz.
- **Dokunma:** Ürün kodu, `firestore.rules` içeriği, Sentry.

## Sprint 02 — 2026-07-10 → 2026-07-12  · [A]
- **Ana amaç:** Üretim hatalarını görünür kılmak (web) — TD-01.
- **Görevler:** (1) Sentry (veya GlitchTip) web SDK'sını `main.jsx` + `ErrorBoundary`'ye bağla; (2) `window.onerror`/`unhandledrejection` yakalama; (3) release/env etiketleme, PII maskeleme.
- **Dosyalar:** `src/main.jsx`, `src/components/ErrorBoundary.jsx`, `src/lib/` (yeni `errorReporting.js`), `.env.example`.
- **Bağımlılık:** S01 (CI yeşil).
- **Tamamlanma:** Bilinçli test hatası web'de issue açıyor; PII sızmıyor.
- **Testler:** `lint`, `test`, `build`.
- **Metrik:** Sentry crash-free sessions tabanı ölçülüyor.
- **Rollback:** DSN env boşsa SDK no-op (feature-flag); tek env değişkeniyle kapat.
- **Dokunma:** Functions tarafı (S03), analytics wrapper.

## Sprint 03 — 2026-07-13 → 2026-07-15  · [A]
- **Ana amaç:** Cloud Functions hatalarını görünür kılmak — TD-01.
- **Görevler:** (1) Functions'a Sentry Node entegrasyonu (`incrementUsage`, `paytrCallback`, `createPaytrToken`, `generateDailyStudyPlan`); (2) yakalanan hataları anlamlı context ile ilet; (3) secret/PII redaksiyonu.
- **Dosyalar:** `functions/index.js`, `functions/paytr.js`, `functions/package.json`.
- **Bağımlılık:** S02.
- **Tamamlanma:** Fonksiyonlarda fırlatılan hata Sentry'de; ödeme akışında kart/secret sızmıyor.
- **Testler:** `lint`, `test`; manuel emulator ile fonksiyon smoke.
- **Metrik:** Functions error rate tabanı.
- **Rollback:** Sentry init try/catch ile sarılı; init başarısızsa fonksiyon davranışı değişmez.
- **Dokunma:** Ödeme mantığı, fiyat tablosu.

## Sprint 04 — 2026-07-16 → 2026-07-18  · [B]
- **Ana amaç:** Analytics taxonomy sapmasını önleyen merkezî wrapper — TD-16.
- **Görevler:** (1) `src/lib/analytics.js` — GA4 + Pixel tek çağrı, tek isimlendirme; (2) mevcut dağınık `logEvent`/`fbq` çağrılarını sarmalayıcıya taşı; (3) event adı allowlist'i (taxonomy dışı ad DEV'de uyarır).
- **Dosyalar:** yeni `src/lib/analytics.js`, `src/lib/metaPixel.js`, `src/lib/publicQuizAnalytics.js`, çağıran bileşenler.
- **Bağımlılık:** `METRICS_AND_EVENTS.md`.
- **Tamamlanma:** Yeni event eklemek tek dosyada tek satır; çift sayım yok.
- **Testler:** `lint`, `test` (wrapper unit testi), `build`.
- **Metrik:** GA4 DebugView'da event adları taxonomy ile birebir.
- **Rollback:** Wrapper ince katman; sorun olursa doğrudan çağrılara geçici dönüş.
- **Dokunma:** Yeni event üretimi (S05).

## Sprint 05 — 2026-07-19 → 2026-07-21  · [B]
- **Ana amaç:** Tier-1 event zincirini yayına almak — funnel görünürlüğü.
- **Görevler:** (1) `sign_up`, `first_question_answered`, `first_review_completed` eventleri; (2) GA4 `purchase` (TD-20) — Pixel Purchase yanına; (3) `paywall_view` parametreli.
- **Dosyalar:** `src/services/userService.js`, `src/hooks/useStudyState.js`, `src/services/smartReviewService.js`, `src/components/premium/PaytrCheckoutModal.jsx`, `LimitReachedModal.jsx`.
- **Bağımlılık:** S04.
- **Tamamlanma:** Zincir GA4 DebugView'da uçtan uca; `purchase` hem GA4 hem Pixel'de (dedup `merchantOid`).
- **Testler:** `lint`, `test`, `build`.
- **Metrik:** `sign_up` ve `purchase` günlük akıyor.
- **Rollback:** Event ekleme davranışsız; sorun olursa çağrıyı kaldır.
- **Dokunma:** `activation_completed` (S06 — hesaplama gerekli).

## Sprint 06 — 2026-07-22 → 2026-07-24  · [B]
- **Ana amaç:** Aktivasyonu tanımlı ve ölçülür kılmak.
- **Görevler:** (1) `activation_completed` hesap mantığı (72s içinde ≥20 soru + 7g içinde ≥1 tekrar); (2) kullanıcı doc'una `activatedAt` yaz (idempotent); (3) tek seferlik event guard.
- **Dosyalar:** `src/services/userService.js`, yeni `src/utils/activation.js`, `firestore.rules` (yalnızca gerekiyorsa yeni alan; test kırılırsa).
- **Bağımlılık:** S05.
- **Tamamlanma:** Aktivasyon oranı GA4'te görülüyor; çift sayım yok.
- **Testler:** `lint`, `test` (activation util testi), `test:rules` (alan eklendiyse), `build`.
- **Metrik:** `activation_completed / sign_up` tabanı.
- **Rollback:** Sadece ölçüm; alan yazımı sorun çıkarırsa client-only hesaba dön.
- **Dokunma:** Onboarding UI (Faz 2).

## Sprint 07 — 2026-07-25 → 2026-07-27  · [A]
- **Ana amaç:** Gün sınırını Europe/Istanbul'a çevirmek (istemci) — TD-04.
- **Görevler:** (1) `src/utils/` ortak `istanbulDayKey()` yardımcı; (2) `streakService.js` ve `usageLimitService.js` yerel gün/ay anahtarlarını güncelle; (3) geçiş penceresi testleri (00:00-03:00 TR).
- **Dosyalar:** `src/services/streakService.js`, `src/services/usageLimitService.js`, yeni `src/utils/dayKey.js`.
- **Bağımlılık:** Yok (sunucu tarafı S08 ile eşlenecek).
- **Tamamlanma:** 00:30 TR'de çözülen soru doğru güne sayılıyor (test).
- **Testler:** `lint`, `test` (dayKey util + sınır testleri), `build`.
- **Metrik:** Gece-yarısı usage anomalisi kayboluyor.
- **Rollback:** `istanbulDayKey` tek dosyada; feature-flag ile UTC'ye dönüş. **İstemci+sunucu aynı gün anahtarını kullanmalı — S08'e kadar geçici uyumsuzluk kabul, izlenir.**
- **Dokunma:** Sunucu `todayKey` (S08).

## Sprint 08 — 2026-07-28 → 2026-07-30  · [A]
- **Ana amaç:** Sunucu tarafı gün sınırını hizalamak — TD-04 kapanışı.
- **Görevler:** (1) `functions/index.js` `todayKey`/`monthKey` → Europe/Istanbul; (2) istemci/sunucu tutarlılık testi; (3) çift sayım riskine karşı geçiş gözlemi.
- **Dosyalar:** `functions/index.js`.
- **Bağımlılık:** S07.
- **Tamamlanma:** Limit sıfırlama ve usage sayımı TR gününe göre; istemci ile aynı anahtar.
- **Testler:** `lint`, `test`, functions emulator smoke.
- **Metrik:** Limit sıfırlama saati şikâyeti = 0.
- **Rollback:** Env flag ile UTC'ye geri dön (çift sayım görülürse).
- **Dokunma:** AI plan cache anahtarı (ayrı kontrol; premium-only, düşük risk).

## Sprint 09 — 2026-07-31 → 2026-08-02  · [A]
- **Ana amaç:** Leaderboard skorunu istemci yazımından çıkarmak — TD-03.
- **Görevler:** (1) Skor yazımını callable'a taşı (sunucu doğrular); (2) `firestore.rules` `weeklyLeaderboard/.../users/{uid}` owner write kapat; (3) optimistic UI koru.
- **Dosyalar:** `functions/index.js` (yeni callable), `src/services/leaderboardService.js`, `firestore.rules`, `scripts/firestore-rules-emulator-test.mjs` (yeni deny testi).
- **Bağımlılık:** S01 (rules CI kapısı).
- **Tamamlanma:** İstemci doğrudan skor yazamıyor (rules testi kanıtlar); lig UX bozulmuyor.
- **Testler:** `lint`, `test`, `test:rules` (yeni deny senaryosu), `build`.
- **Metrik:** Anomali skor sayısı = 0.
- **Rollback:** Callable gecikirse optimistic UI; rules geri alınmaz (güvenlik).
- **Dokunma:** Lig görselleri, sahte veri (S10).

## Sprint 10 — 2026-08-03 → 2026-08-05  · [A/F]
- **Ana amaç:** Sahte lig verisini temizlemek + soru hata bildirimi başlatmak — TD-14, TD-11.
- **Görevler:** (1) Üretimden bilinen sahte uid'leri temizle, `seedFakeLeaderboard.mjs` deprecate; (2) soru içi "Hata bildir" → `questionReports` (create-only rule); (3) admin listesi + rules testi.
- **Dosyalar:** `scripts/seedFakeLeaderboard.mjs`, `src/components/StudyScreen.jsx`, yeni `src/services/questionReportService.js`, `firestore.rules`, admin bileşeni, emulator test.
- **Bağımlılık:** S09 (rules deseni).
- **Tamamlanma:** Ligde sahte uid yok; rapor 3 dokunuşta gidiyor; create-only rule testte doğrulanıyor.
- **Testler:** `lint`, `test`, `test:rules`, `build`.
- **Metrik:** `question_report_submitted` hacmi; lig güven sinyali.
- **Rollback:** Rapor UI feature-flag; rules create-only kalır.
- **Dokunma:** Rapor triage otomasyonu (elle triage yeterli).

---

# FAZ 2 — Funnel Bütünlüğü + Aktivasyon + İçerik (S11-S20, Ağustos)

## Sprint 11 — 2026-08-06 → 2026-08-08  · [C]
- **Ana amaç:** `/coz` anonim cevaplarını kayıt sonrası hesaba taşımak (bölüm 1) — TD-12/E-01.
- **Görevler:** (1) `tusoskop_quiz_result` → `questionHistory` içe aktarma; (2) idempotent import (tek sefer); (3) `quiz_import_completed` eventi.
- **Dosyalar:** `src/components/funnel/*`, `src/services/questionHistoryService.js`, `src/AppAuthenticated.jsx`, `src/lib/analytics.js`.
- **Bağımlılık:** S05 (eventler).
- **Tamamlanma:** `/coz`u bitirip kayıt olan kullanıcının cevapları hesabında.
- **Testler:** `lint`, `test` (import util), `build`, `test:e2e` (funnel yolu).
- **Metrik:** `quiz_import_completed`; `/coz`-kaynaklı D1 dönüş.
- **Rollback:** Import başarısızsa sessiz atla; akış bozulmaz.
- **Dokunma:** FSRS seed (S12).

## Sprint 12 — 2026-08-09 → 2026-08-11  · [C]
- **Ana amaç:** İçe aktarılan yanlışları FSRS kartı olarak seed etmek.
- **Görevler:** (1) Yanlış cevapları `smartReviews` başlangıç durumuyla oluştur; (2) çift seed koruması; (3) dashboard'da "getirdiğin sonuç" kartı.
- **Dosyalar:** `src/services/smartReviewService.js`, `src/utils/smartReviewScheduler.js` (yalnızca gerekirse), `src/components/Dashboard.jsx`.
- **Bağımlılık:** S11.
- **Tamamlanma:** İçe aktarılan yanlışlar ertesi gün tekrar kuyruğunda.
- **Testler:** `lint`, `test` (seed util), `build`.
- **Metrik:** Seed sonrası ilk tekrar oturumu oranı.
- **Rollback:** Seed opsiyonel; kapatılırsa import yine çalışır.
- **Dokunma:** Onboarding akışı (S13).

## Sprint 13 — 2026-08-12 → 2026-08-14  · [C]
- **Ana amaç:** Kayıt sonrası onboarding v1 — aktivasyon tasarımı.
- **Görevler:** (1) 3 adım: TUS dönemi → hedef/kaygı branşı → "ilk görevin"; (2) `onboarding_*` eventleri; (3) atlanabilir (skip).
- **Dosyalar:** yeni `src/components/onboarding/*`, `src/AppAuthenticated.jsx`, `src/services/userService.js`, `firestore.rules` (yeni alanlar gerekiyorsa).
- **Bağımlılık:** S06 (aktivasyon ölçümü).
- **Tamamlanma:** `onboarding_completed` ölçülüyor; skip mümkün.
- **Testler:** `lint`, `test`, `test:rules` (yeni alan), `build`, `test:e2e`.
- **Metrik:** Onboarding tamamlama ≥%70 [VARSAYIM].
- **Rollback:** Onboarding route flag'li; kapatılırsa eski dashboard.
- **Dokunma:** Mini TUS (Faz 3).

## Sprint 14 — 2026-08-15 → 2026-08-17  · [C]
- **Ana amaç:** Onboarding'i sağlamlaştırmak + `/coz` sonuçtan onboarding'e köprü.
- **Görevler:** (1) TUS tarihini kullanıcı doc'una yaz (adaptif planın ön koşulu); (2) `/coz` sonuç ekranından kayıt→onboarding derin bağlantısı; (3) onboarding drop-off ölçümü.
- **Dosyalar:** `src/components/onboarding/*`, `src/components/funnel/QuizResultScreen.jsx`, `userService.js`.
- **Bağımlılık:** S13.
- **Tamamlanma:** Kayıt tarihi kalıcı; funnel→onboarding kesintisiz.
- **Testler:** `lint`, `test`, `build`, `test:e2e`.
- **Metrik:** Onboarding adım-başı drop-off.
- **Rollback:** Köprü flag'li.
- **Dokunma:** Audit (S15).

## Sprint 15 — 2026-08-18 → 2026-08-20  · [F]
- **Ana amaç:** 7.077 soruluk güncel kalite auditi — TD-09.
- **Görevler:** (1) `npm run quality:questions` (tam banka); (2) `reports/` güncelle; (3) kritik/orta bulguları triage'a al.
- **Dosyalar:** `reports/*`, (soru dosyaları yalnızca kritik bulguda, uzman onayıyla).
- **Bağımlılık:** Yok.
- **Tamamlanma:** Audit 7077 soruyla; kritik bulgu = 0 veya kayıtlı plan.
- **Testler:** `validate:questions`, `audit:questions`, `review:questions`.
- **Metrik:** Açık kritik/orta bulgu sayısı.
- **Rollback:** Rapor üretimi; soru değişikliği yok (uzman onayı gerektirir).
- **Dokunma:** Soru içeriğini toplu düzeltme.

## Sprint 16 — 2026-08-21 → 2026-08-23  · [F]
- **Ana amaç:** Soru versiyonlama altyapısı — TD-10.
- **Görevler:** (1) Soru şemasına `rev`+`revisedAt`; (2) `validate:questions`'a `rev` kuralı; (3) `questionHistory`/FSRS'in `rev` bilmesi (geri uyumlu, `|| 1`).
- **Dosyalar:** `src/data/questionChunks/*` (şema), `scripts/validate-question-bank.mjs`, `src/services/questionHistoryService.js`, `smartReviewService.js`.
- **Bağımlılık:** S15.
- **Tamamlanma:** Yeni/düzeltilen soruda `rev` artıyor; validasyon geçiyor.
- **Testler:** `validate:questions`, `test`, `build`.
- **Metrik:** Versiyonlanan soru oranı.
- **Rollback:** `rev` opsiyonel (`|| 1`); geri uyumlu.
- **Dokunma:** Toplu içerik değişikliği.

## Sprint 17 — 2026-08-24 → 2026-08-26  · [F]
- **Ana amaç:** Topic taksonomisi validasyonu — MASTER_PLAN §5.5.
- **Görevler:** (1) `TRACKER_TOPICS` (150 konu) tek doğruluk kaynağı; (2) her sorunun `topic`'i listeye validasyonla bağlan; (3) sapmalar rapora.
- **Dosyalar:** `src/data/TopicTrackerData.js`, `scripts/validate-question-bank.mjs`, `reports/*`.
- **Bağımlılık:** S16.
- **Tamamlanma:** Taksonomi dışı topic validasyonda uyarı/hata.
- **Testler:** `validate:questions`, `test`.
- **Metrik:** Taksonomi dışı topic sayısı.
- **Rollback:** Önce uyarı (non-blocking), stabilse blocking.
- **Dokunma:** Konu adı toplu değiştirme.

## Sprint 18 — 2026-08-27 → 2026-08-29  · [B]
- **Ana amaç:** Attribution ve kampanya verisi kaybını kapatmak — TD-12.
- **Görevler:** (1) `acquisition` şemasına `fbclid`/`gclid` ekle (rules `hasValidAcquisitionShape` genişlet); (2) tıklama ID'lerini kayıt akışında taşı; (3) `campaign_click` ↔ `sign_up` bağlama.
- **Dosyalar:** `src/utils/acquisitionAttribution.js`, `src/services/userService.js`, `firestore.rules`, emulator test.
- **Bağımlılık:** S05.
- **Tamamlanma:** `fbclid` kayıt doc'una güvenli yazılıyor; rules testi geçiyor.
- **Testler:** `lint`, `test`, `test:rules`, `build`.
- **Metrik:** Attribution'lı kayıt oranı.
- **Rollback:** Yeni alanlar opsiyonel; rules geri uyumlu.
- **Dokunma:** CAPI (Faz 3+).

## Sprint 19 — 2026-08-30 → 2026-09-01  · [B]
- **Ana amaç:** Haftalık kurucu dashboard'u v1 (8 sayı) — MASTER_PLAN.
- **Görevler:** (1) GA4 explore/rapor + backend gelir sorgusu; (2) NSM, aktivasyon, W1/W4, dönüşüm, gelir, crash-free tek sayfada; (3) haftalık ritüel dokümante.
- **Dosyalar:** `docs/` (dashboard tanımı), gerekirse küçük `scripts/` rapor betiği (Admin SDK, yerel — üretim credential YOK).
- **Bağımlılık:** S06, S05, S18.
- **Tamamlanma:** 8 sayı tek yerden okunuyor.
- **Testler:** Betik varsa `node` smoke (emulator/mock).
- **Metrik:** Dashboard haftalık güncelleniyor.
- **Rollback:** Betik opsiyonel; manuel GA4 yeterli.
- **Dokunma:** Otomatik e-posta raporu (Faz 4).

## Sprint 20 — 2026-09-02 → 2026-09-04  · [A/B]
- **Ana amaç:** Faz 2 konsolidasyonu + Mini TUS'a hazırlık.
- **Görevler:** (1) Faz 1-2 event/aktivasyon sağlığını denetle (çift sayım, boşluk); (2) `examBlueprints`/`tusScoring` ön okuma, Mini TUS spec taslağı; (3) tech-debt durum güncellemesi.
- **Dosyalar:** `docs/TECH_DEBT_REGISTER.md`, `docs/DECISION_LOG.md`, (spec notu).
- **Bağımlılık:** S11-S19.
- **Tamamlanma:** Eventlerde >%20 boşluk yok; Mini TUS spec hazır.
- **Testler:** `lint`, `test`, `test:rules`, `build`.
- **Metrik:** Event bütünlüğü; aktivasyon oranı ilk okuma.
- **Rollback:** —
- **Dokunma:** Mini TUS kodu (S21'de başlar).

---

# FAZ 3 — Mini TUS + Kalibrasyon (S21-S30, Eylül)

## Sprint 21 — 2026-09-05 → 2026-09-07  · [C]
- **Ana amaç:** Mini TUS blueprint (soru seçimi) — MASTER_PLAN §4 Aşama 5.
- **Görevler:** (1) `examBlueprints` dağılımından sabit 20 soru seçici; (2) determinizm (aynı kullanıcı aynı set) + versiyon; (3) birim testleri.
- **Dosyalar:** yeni `src/data/miniTusBlueprint.js`, `src/utils/`.
- **Bağımlılık:** S20.
- **Tamamlanma:** 20 soruluk set üretiliyor, dağılım TUS formatına yakın.
- **Testler:** `lint`, `test` (blueprint testleri), `validate:questions`.
- **Metrik:** —
- **Rollback:** Yeni modül; UI'ya bağlanana dek etkisiz.
- **Dokunma:** Sonuç ekranı (S23).

## Sprint 22 — 2026-09-08 → 2026-09-10  · [C/A]
- **Ana amaç:** Mini TUS veri modeli + güvenlik kuralları — TD-06 ile hizalı.
- **Görevler:** (1) `miniTusResults` koleksiyon şeması; (2) rules: owner create, immutable, sunucu-doğrulanabilir alanlar; (3) emulator deny/allow testleri.
- **Dosyalar:** `firestore.rules`, `scripts/firestore-rules-emulator-test.mjs`, yeni `src/services/miniTusService.js`.
- **Bağımlılık:** S21.
- **Tamamlanma:** Rules testi Mini TUS sonucu için geçiyor; sahte skor engelli.
- **Testler:** `lint`, `test`, `test:rules`, `build`.
- **Metrik:** —
- **Rollback:** Koleksiyon yeni; rules eklemesi izole.
- **Dokunma:** Kalibrasyon matematiği (S24).

## Sprint 23 — 2026-09-11 → 2026-09-13  · [C]
- **Ana amaç:** 20 soruluk çözüm ekranı (UI).
- **Görevler:** (1) Mini TUS soru akışı + ilerleme çubuğu; (2) resume/kesinti dayanıklılığı; (3) `mini_tus_start`/`question_answered` eventleri.
- **Dosyalar:** yeni `src/components/miniTus/*`, `src/AppAuthenticated.jsx`, `src/lib/analytics.js`.
- **Bağımlılık:** S21, S22.
- **Tamamlanma:** Kullanıcı 20 soruyu uçtan uca çözüyor; kesintide kaybolmuyor.
- **Testler:** `lint`, `test`, `build`, `test:e2e`.
- **Metrik:** Başlayan→tamamlayan (taban).
- **Rollback:** Route flag'li.
- **Dokunma:** Puan hesabı (S24).

## Sprint 24 — 2026-09-14 → 2026-09-16  · [C]
- **Ana amaç:** Tahmini puan aralığı (kalibrasyon v1).
- **Görevler:** (1) `tusScoring.js` çapa tablosuyla net→tahmini T aralığı; (2) aralık (nokta değil) + "ilk kullanıcılar arasında" şeffaf etiketi; (3) `mini_tus_complete` (score, aralık).
- **Dosyalar:** `src/seo/tusScoring.js` (yeniden kullan), `src/components/miniTus/*`.
- **Bağımlılık:** S23.
- **Tamamlanma:** Sonuçta tahmini aralık gösteriliyor; kesinlik iddiası yok.
- **Testler:** `lint`, `test` (skorlama testleri), `build`.
- **Metrik:** Sonuç ekranı görüntüleme.
- **Rollback:** Aralığı genişlet/etiketi büyüt; şikâyette geri çek.
- **Dokunma:** Yüzdelik (veri güvenilirliği S27).

## Sprint 25 — 2026-09-17 → 2026-09-19  · [C]
- **Ana amaç:** Zayıf 3 konu çıktısı.
- **Görevler:** (1) Mini TUS cevaplarından branş/konu bazlı doğruluk; (2) en zayıf 3 konu + "bugün buradan başla" CTA; (3) `weakest_subjects` parametresi.
- **Dosyalar:** `src/components/miniTus/*`, `src/utils/`.
- **Bağımlılık:** S24.
- **Tamamlanma:** Zayıf 3 konu gösteriliyor ve çalışmaya bağlanıyor.
- **Testler:** `lint`, `test`, `build`.
- **Metrik:** Zayıf-konu CTA tıklama.
- **Rollback:** Bölüm gizlenebilir.
- **Dokunma:** Birleşik kuyruk (Faz 4).

## Sprint 26 — 2026-09-20 → 2026-09-22  · [B]
- **Ana amaç:** Mini TUS analytics eventlerini tamamlamak.
- **Görevler:** (1) `mini_tus_cta_click`, `result_view`, `share_click`; (2) funnel'ı GA4'te uçtan uca; (3) taxonomy dokümanını güncelle.
- **Dosyalar:** `src/lib/analytics.js`, `src/components/miniTus/*`, `docs/METRICS_AND_EVENTS.md`.
- **Bağımlılık:** S23-S25.
- **Tamamlanma:** Tüm `mini_tus_*` eventleri akıyor.
- **Testler:** `lint`, `test`, `build`.
- **Metrik:** Mini TUS funnel dönüşümleri.
- **Rollback:** —
- **Dokunma:** —

## Sprint 27 — 2026-09-23 → 2026-09-25  · [G]
- **Ana amaç:** Kalibrasyon veri güvenilirliği.
- **Görevler:** (1) `results` + `miniTusResults`'tan anonim net dağılımı; (2) minimum örneklem eşiği (altında "tahmini aralık, az veri" etiketi); (3) aykırı değer/sahte veri filtresi (TD-06 ile).
- **Dosyalar:** yeni `functions/` toplayıcı veya `scripts/` analiz, `src/components/miniTus/*`.
- **Bağımlılık:** S22, S24.
- **Tamamlanma:** Yüzdelik yalnızca eşik aşıldığında; altında şeffaf aralık.
- **Testler:** `lint`, `test`, `test:rules`.
- **Metrik:** Örneklem büyüklüğü; şikâyet sinyali.
- **Rollback:** Yüzdelik gösterimini kapat, yalnızca T aralığı bırak.
- **Dokunma:** Kamuya açık Endeks (Faz 6).

## Sprint 28 — 2026-09-26 → 2026-09-28  · [C]
- **Ana amaç:** `/coz` ve SEO'dan Mini TUS'a bağlantı — MASTER_PLAN §4.
- **Görevler:** (1) `/coz` sonuç ekranına Mini TUS CTA; (2) PublicHome + branş SEO sayfalarından giriş; (3) `mini_tus_cta_click` kaynak kırılımı.
- **Dosyalar:** `src/components/funnel/QuizResultScreen.jsx`, `src/components/seo/PublicSeoPages.jsx`, `src/components/Dashboard.jsx`.
- **Bağımlılık:** S23-S26.
- **Tamamlanma:** Trafik Mini TUS'a bağlanıyor.
- **Testler:** `lint`, `test`, `build`, `test:e2e`.
- **Metrik:** Sonuç→Mini TUS geçişi ≥%20 [VARSAYIM].
- **Rollback:** CTA gizlenebilir.
- **Dokunma:** Yeni kampanya (backlog E-05).

## Sprint 29 — 2026-09-29 → 2026-10-01  · [A]
- **Ana amaç:** Mini TUS E2E + kritik yol testleri — TD-08.
- **Görevler:** (1) Playwright: kayıt→Mini TUS→sonuç; (2) limit→paywall; (3) `/coz` uçtan uca.
- **Dosyalar:** `e2e/*.spec.js`, `playwright.config.js`.
- **Bağımlılık:** S23-S28.
- **Tamamlanma:** 3 kritik yol CI'da yeşil.
- **Testler:** `test:e2e`, `test:e2e:full`.
- **Metrik:** E2E kapsam artışı.
- **Rollback:** Flaky testi `test.fixme` yerine stabilize et; skip YASAK.
- **Dokunma:** —

## Sprint 30 — 2026-10-02 → 2026-10-04  · [A]
- **Ana amaç:** Mini TUS production release + Faz 3 retrospektifi.
- **Görevler:** (1) Yayın (web) + iOS cherry-pick planı; (2) Sentry/GA4 ile ilk 48s izleme; (3) `DECISION_LOG` (D-008 Mini TUS soru sayısı).
- **Dosyalar:** `docs/DECISION_LOG.md`, release notları.
- **Bağımlılık:** S29.
- **Tamamlanma:** Mini TUS canlı; hata sıçraması yok; karar kayıtlı.
- **Testler:** Tüm CI + smoke.
- **Metrik:** Tamamlama ≥%60; tamamlayan→D1 ≥%40 [VARSAYIM].
- **Rollback:** Tamamlama <%40 → 12 soruya kısalt (E-02); feature-flag ile hızlı geri çekme.
- **Dokunma:** Retention işleri (Faz 4).

---

# FAZ 4 — Retention Motoru (S31-S40, Ekim)

## Sprint 31 — 2026-10-05 → 2026-10-07  · [D]
- **Ana amaç:** FSRS + zayıf konu birleşik günlük kuyruk v1.
- **Görevler:** (1) Konu yeterlilik skoru (son 30g doğruluk × güven); (2) due kartlar + zayıf konu taze soru harmanı (~%60/%40); (3) tek "bugünkü kuyruk" ekranı.
- **Dosyalar:** `src/services/smartReviewService.js`, yeni `src/utils/dailyQueue.js`, `src/components/StudyCollectionScreen.jsx`.
- **Bağımlılık:** S12, S25.
- **Tamamlanma:** Tek başla-butonlu 15-20 dk kuyruk çalışıyor.
- **Testler:** `lint`, `test` (queue util), `build`.
- **Metrik:** Kuyruk başlatma/tamamlama.
- **Rollback:** Harman oranı flag'li; sadece due'ya dön.
- **Dokunma:** Görselleştirme (S32).

## Sprint 32 — 2026-10-08 → 2026-10-10  · [D]
- **Ana amaç:** Hafıza/yeterlilik görselleştirmesi.
- **Görevler:** (1) Kart stabilite bantları görseli; (2) branş yeterlilik haritası; (3) dashboard entegrasyonu.
- **Dosyalar:** `src/components/PerformanceChartCard.jsx`, `TopicTrackerView.jsx`, `Dashboard.jsx`.
- **Bağımlılık:** S31.
- **Tamamlanma:** Kullanıcı hafıza durumunu görüyor.
- **Testler:** `lint`, `test`, `build`.
- **Metrik:** Görsel etkileşim; tekrar oturumu artışı.
- **Rollback:** Kart gizlenebilir.
- **Dokunma:** E-posta (S33).

## Sprint 33 — 2026-10-11 → 2026-10-13  · [D]
- **Ana amaç:** E-posta altyapısı (Resend vb.) — retention kanalı.
- **Görevler:** (1) Transactional e-posta gönderici (Functions, secret'lı); (2) opt-in/opt-out + KVKK metni; (3) test gönderimi.
- **Dosyalar:** yeni `functions/email.js`, `functions/index.js`, `.env.example`, kullanıcı tercih alanı.
- **Bağımlılık:** S03 (Functions altyapısı).
- **Tamamlanma:** Test e-postası gidiyor; opt-out çalışıyor.
- **Testler:** `lint`, `test`, functions smoke.
- **Metrik:** Gönderim başarı oranı.
- **Rollback:** Secret yoksa no-op; gönderim kapalı.
- **Dokunma:** Haftalık rapor içeriği (S34).

## Sprint 34 — 2026-10-14 → 2026-10-16  · [D]
- **Ana amaç:** Haftalık kişisel rapor e-postası.
- **Görevler:** (1) Zamanlanmış Function (haftalık); (2) içerik: çözülen, unutulmak üzere olanlar, lig; (3) `email_open/click` izleme.
- **Dosyalar:** `functions/email.js`, yeni scheduled function, `functions/index.js`.
- **Bağımlılık:** S33, S19.
- **Tamamlanma:** Opt-in kullanıcıya haftalık rapor.
- **Testler:** `lint`, `test`, functions emulator.
- **Metrik:** Açılma; e-posta kohortu W4 retention (E-11).
- **Rollback:** Zamanlayıcı kapatılabilir.
- **Dokunma:** Push (S35).

## Sprint 35 — 2026-10-17 → 2026-10-19  · [D]
- **Ana amaç:** iOS push izin akışı — değer-önce.
- **Görevler:** (1) FCM/APNs kurulumu (ios branch); (2) izin isteği yalnızca değer görüldükten sonra; (3) token kaydı.
- **Dosyalar:** ios branch native + `src/` izin akışı [VARSAYIM: ios branch bu ortamda yok], `functions/`.
- **Bağımlılık:** S33 tercih modeli.
- **Tamamlanma:** İzin veren cihazda token kayıtlı.
- **Testler:** `lint`, `test`, `build`; cihaz smoke (manuel).
- **Metrik:** Push opt-in ≥%50 [VARSAYIM].
- **Rollback:** İzin akışı flag'li.
- **Dokunma:** Bildirim gönderimi (S36).

## Sprint 36 — 2026-10-20 → 2026-10-22  · [D]
- **Ana amaç:** Tek "due tekrar" bildirimi.
- **Görevler:** (1) Zamanlanmış push: "N kartın due, 10 dk"; (2) günde tek bildirim kuralı; (3) `notification_open` + kaynak.
- **Dosyalar:** `functions/` (scheduled), `src/lib/analytics.js`.
- **Bağımlılık:** S35.
- **Tamamlanma:** Due kullanıcıya günde en fazla 1 bildirim.
- **Testler:** `lint`, `test`, functions emulator.
- **Metrik:** push→oturum ≥%15 [VARSAYIM].
- **Rollback:** Zamanlayıcı kapatılabilir.
- **Dokunma:** İkinci bildirim türü (DO_NOT_BUILD).

## Sprint 37 — 2026-10-23 → 2026-10-25  · [D]
- **Ana amaç:** Due yığılması ("borç") yönetimi.
- **Görevler:** (1) 20+ due'da "bugün en kritik 10" modu; (2) yığılma göstergesi + rahatlatıcı kopya; (3) FSRS otoritesini bozmadan önceliklendirme.
- **Dosyalar:** `src/utils/dailyQueue.js`, `src/components/StudyCollectionScreen.jsx`.
- **Bağımlılık:** S31.
- **Tamamlanma:** Yüksek due'da kullanıcı bunalmıyor; schedule bozulmuyor.
- **Testler:** `lint`, `test`, `build`.
- **Metrik:** Yüksek-due kullanıcıların tamamlama oranı.
- **Rollback:** Eşik flag'li.
- **Dokunma:** FSRS zamanlama mantığı (değişmez — PRODUCT_PRINCIPLES #3).

## Sprint 38 — 2026-10-26 → 2026-10-28  · [D]
- **Ana amaç:** "Kendi rekorunla yarış" lig modu (sahte veri yerine) — D-011.
- **Görevler:** (1) <50 gerçek aktif kohortta bireysel rekor modu; (2) sahte kullanıcı bağımlılığını tamamen kaldır; (3) mod geçiş mantığı.
- **Dosyalar:** `src/services/leaderboardService.js`, `src/components/leaderboard/*`.
- **Bağımlılık:** S10 (temizlik), S09 (güvenlik).
- **Tamamlanma:** Boş lig yerine anlamlı bireysel hedef.
- **Testler:** `lint`, `test`, `build`.
- **Metrik:** Lig ekranı etkileşimi.
- **Rollback:** Mod flag'li.
- **Dokunma:** Sahte veri ekleme (YASAK).

## Sprint 39 — 2026-10-29 → 2026-10-31  · [D/B]
- **Ana amaç:** Retention optimizasyonu — ölçüm ve ince ayar.
- **Görevler:** (1) W1/W4 tekrar retention kohort raporu; (2) push/e-posta kopya deneyi (E-08); (3) en zayıf drop noktasına tek müdahale.
- **Dosyalar:** analiz betiği, `functions/email.js`, push kopya.
- **Bağımlılık:** S34, S36.
- **Tamamlanma:** Retention eğrisi görülüyor; 1 deney canlı.
- **Testler:** `lint`, `test`.
- **Metrik:** W4 tekrar retention +5 puan [VARSAYIM].
- **Rollback:** Deney vazgeçme kriterine bağlı (GROWTH_EXPERIMENTS).
- **Dokunma:** Monetizasyon (Faz 5).

## Sprint 40 — 2026-11-01 → 2026-11-03  · [A/D]
- **Ana amaç:** Faz 4 konsolidasyonu + NSM doğrulaması.
- **Görevler:** (1) NSM (Weekly Committed Reviewers) hesap doğrulama; (2) bildirim yorgunluğu/opt-out denetimi; (3) tech-debt + karar güncellemesi (D-010).
- **Dosyalar:** `docs/DECISION_LOG.md`, `docs/TECH_DEBT_REGISTER.md`.
- **Bağımlılık:** S31-S39.
- **Tamamlanma:** NSM 4 hafta trendi okunuyor; opt-out <%10.
- **Testler:** Tüm CI.
- **Metrik:** NSM haftalık artış.
- **Rollback:** —
- **Dokunma:** —

---

# FAZ 5 — Monetizasyon (S41-S50, Kasım)

## Sprint 41 — 2026-11-04 → 2026-11-06  · [E]
- **Ana amaç:** Kişisel değer gösteren paywall — E-04.
- **Görevler:** (1) `LimitReachedModal`'ı kullanıcının haftalık soru/tekrar sayıları + 3 somut vaatle yeniden yaz; (2) `paywall_view` zenginleştir; (3) iki sürümü kodda tut (geri dönüş).
- **Dosyalar:** `src/components/premium/LimitReachedModal.jsx`, `PremiumInfoScreen.jsx`, `src/lib/analytics.js`.
- **Bağımlılık:** S05 (`paywall_view`), S32 (kullanıcı verisi).
- **Tamamlanma:** Limit anında kişisel özet görünüyor.
- **Testler:** `lint`, `test`, `build`.
- **Metrik:** `paywall_view→plan_selected`.
- **Rollback:** Eski modala anında dön.
- **Dokunma:** Fiyat/paket (S43).

## Sprint 42 — 2026-11-07 → 2026-11-09  · [E/B]
- **Ana amaç:** Ödeme funnel görünürlüğü.
- **Görevler:** (1) `plan_selected`→`paytr_token_requested`→`iframe_opened`→`purchase`/`payment_failed` eventleri; (2) intent `failed` snapshot'ından `payment_failed`; (3) funnel raporu.
- **Dosyalar:** `src/components/premium/PaytrCheckoutModal.jsx`, `PremiumInfoScreen.jsx`, `src/services/paytrService.js`, `src/lib/analytics.js`.
- **Bağımlılık:** S41.
- **Tamamlanma:** Ödeme funnel'ı GA4'te uçtan uca.
- **Testler:** `lint`, `test`, `build`.
- **Metrik:** Adım-başı ödeme drop-off.
- **Rollback:** Event ekleme davranışsız.
- **Dokunma:** Ödeme mantığı/fiyat tablosu (sunucu, değişmez).

## Sprint 43 — 2026-11-10 → 2026-11-12  · [E]
- **Ana amaç:** 12 aylık paket — E-09.
- **Görevler:** (1) `plusPlans.js` + `functions/paytr.js` `PAYTR_PLANS` senkron yeni plan (`plus_12m`); (2) fiyat yalnızca sunucuda; (3) UI'da "en avantajlı" konumu.
- **Dosyalar:** `src/config/plusPlans.js`, `functions/paytr.js`, `PremiumInfoScreen.jsx`.
- **Bağımlılık:** S42.
- **Tamamlanma:** 12 aylık plan satın alınabiliyor; sunucu tablosu tek fiyat otoritesi.
- **Testler:** `lint`, `test`, `test:rules`, functions smoke, `build`.
- **Metrik:** 12 aylık plan satış payı.
- **Rollback:** Planı UI'dan gizle; sunucu tablosunda tutma/çıkarma senkron.
- **Dokunma:** İstemciden fiyat gönderme (YASAK — PRODUCT_PRINCIPLES #5).

## Sprint 44 — 2026-11-13 → 2026-11-15  · [E]
- **Ana amaç:** iOS IAP vs satın alma yüzeyini gizleme kararı — D-007, TD-18.
- **Görevler:** (1) iOS DAU/web DAU + dönüşüm verisini derle; (2) karar: IAP mı gizleme mi; (3) karar sonucu uygulama (iOS'ta ödeme yüzeyi durumunu netleştir).
- **Dosyalar:** `docs/DECISION_LOG.md`, ios branch [VARSAYIM] premium ekran gating.
- **Bağımlılık:** S42 veri.
- **Tamamlanma:** D-007 kapandı; iOS'ta Apple 3.1.1 uyumu net.
- **Testler:** `lint`, `test`, `build`; iOS smoke (manuel).
- **Metrik:** iOS dönüşüm / uyum riski.
- **Rollback:** Varsayılan güvenli: iOS'ta satın alma yüzeyini gizle.
- **Dokunma:** iOS'ta harici ödeme linki (YASAK).

## Sprint 45 — 2026-11-16 → 2026-11-18  · [E]
- **Ana amaç:** Aktivasyon sonrası "Plus haftası" deneyi — E-10.
- **Görevler:** (1) Aktivasyonu tamamlayana sunucudan 7g Plus (`premiumSource:"trial"`); (2) idempotent, tek sefer; (3) trial→ödeme izleme.
- **Dosyalar:** `functions/index.js` (callable/tetikleyici), `firestore.rules` (gerekirse), `src/`.
- **Bağımlılık:** S06 (aktivasyon).
- **Tamamlanma:** Aktive kullanıcı 7g Plus alıyor; kötüye kullanım engelli.
- **Testler:** `lint`, `test`, `test:rules`, functions smoke.
- **Metrik:** Trial→ödeme ≥%8; <%3 ise kaldır.
- **Rollback:** Tetikleyiciyi kapat; verilen trial'lar doğal biter.
- **Dokunma:** Kalıcı bedava katman genişletme.

## Sprint 46 — 2026-11-19 → 2026-11-21  · [E]
- **Ana amaç:** Premium bitiş + win-back modeli.
- **Görevler:** (1) `premium_expired_view` eventi; (2) süre bitişini tespit eden sunucu mantığı; (3) win-back kohort tanımı.
- **Dosyalar:** `functions/`, `src/utils/premiumUtils.js`, `src/lib/analytics.js`.
- **Bağımlılık:** S33 (e-posta), S42.
- **Tamamlanma:** Süresi biten kullanıcı tespit ediliyor ve etiketleniyor.
- **Testler:** `lint`, `test`, `test:rules`.
- **Metrik:** Bitiş sonrası dönüş oranı.
- **Rollback:** —
- **Dokunma:** İletişim içeriği (S47).

## Sprint 47 — 2026-11-22 → 2026-11-24  · [E/D]
- **Ana amaç:** D-7 / D+7 / D+30 win-back iletişimi.
- **Görevler:** (1) D-7 "süren bitiyor"; (2) D+7 "kartların birikti: N due"; (3) D+30 tek seferlik %20 kod.
- **Dosyalar:** `functions/email.js` (scheduled), kod/kupon mantığı, `src/lib/analytics.js`.
- **Bağımlılık:** S46, S34.
- **Tamamlanma:** Üç aşamalı dizi gidiyor; kupon tek kullanımlık.
- **Testler:** `lint`, `test`, functions emulator.
- **Metrik:** Win-back dönüş >%8; `winback_email_click`.
- **Rollback:** Dizi kapatılabilir; kupon iptal.
- **Dokunma:** Sürekli indirim (DO_NOT_BUILD).

## Sprint 48 — 2026-11-25 → 2026-11-27  · [E]
- **Ana amaç:** Plus değer önerisinin anlaşılır sunumu.
- **Görevler:** (1) "Sınırsız soru" yerine 3 somut vaat (sınırsız tekrar, AI plan, tüm denemeler+analiz); (2) fiyat sayfasında kullanıcının kendi sayıları; (3) kopya netleştirme.
- **Dosyalar:** `src/components/premium/PremiumInfoScreen.jsx`, `DashboardMembershipHero.jsx`.
- **Bağımlılık:** S41.
- **Tamamlanma:** Premium değeri somut ve kişisel.
- **Testler:** `lint`, `test`, `build`.
- **Metrik:** Fiyat sayfası→`plan_selected`.
- **Rollback:** Kopya geri alınabilir.
- **Dokunma:** Fiyat rakamı (S49 deneyi).

## Sprint 49 — 2026-11-28 → 2026-11-30  · [E]
- **Ana amaç:** Fiyat/paket deneyi — E-09.
- **Görevler:** (1) 12 aylık fiyat noktası ölçümü (599 vs 649 [VARSAYIM]); (2) ardışık (before/after) ölçüm; (3) sonuç `DECISION_LOG`.
- **Dosyalar:** `functions/paytr.js` (fiyat), `src/config/plusPlans.js`, `docs/DECISION_LOG.md`.
- **Bağımlılık:** S43.
- **Tamamlanma:** Fiyat noktası kararı verildi.
- **Testler:** `lint`, `test`, `test:rules`, functions smoke.
- **Metrik:** 12 aylık plan satış payı; <%10/8 hafta ise fiyat/konum değiştir.
- **Rollback:** Fiyatı eski noktaya döndür (sunucu+istemci senkron).
- **Dokunma:** Karanlık desen / sahte aciliyet (YASAK).

## Sprint 50 — 2026-12-01 → 2026-12-03  · [A/E]
- **Ana amaç:** Faz 5 konsolidasyonu + gelir görünürlüğü.
- **Görevler:** (1) Gelir mutabakatı (backend ground truth vs GA4/Pixel sinyal); (2) monetizasyon funnel sağlığı; (3) tech-debt/karar güncellemesi.
- **Dosyalar:** `docs/DECISION_LOG.md`, `docs/TECH_DEBT_REGISTER.md`, `docs/METRICS_AND_EVENTS.md`.
- **Bağımlılık:** S41-S49.
- **Tamamlanma:** Gelir tek kaynaktan raporlanıyor; funnel sağlıklı.
- **Testler:** Tüm CI.
- **Metrik:** Aktif Plus × fiyat (MRR eşdeğeri) trendi.
- **Rollback:** —
- **Dokunma:** Ölçeklenme (Faz 6).

---

# FAZ 6 — Moat Derinleştirme + Ölçeklenme + Uyumluluk (S51-S60, Aralık)

## Sprint 51 — 2026-12-04 → 2026-12-06  · [G]
- **Ana amaç:** FSRS + konu yeterlilik modelini birleştirme (v2).
- **Görevler:** (1) Birleşik yeterlilik+hafıza skoru modeli; (2) kuyruk harmanını modele bağla; (3) doğrulama testleri.
- **Dosyalar:** `src/utils/dailyQueue.js`, `smartReviewScheduler.js` (dikkatle), yeni `src/utils/proficiency.js`.
- **Bağımlılık:** S31.
- **Tamamlanma:** Kuyruk birleşik modelden besleniyor; FSRS otoritesi korunuyor.
- **Testler:** `lint`, `test`, `build`.
- **Metrik:** Kuyruk tamamlama; doğruluk trendi.
- **Rollback:** Model flag'li; eski harmana dön.
- **Dokunma:** FSRS çekirdek zamanlama sabitleri (PRODUCT_PRINCIPLES #3).

## Sprint 52 — 2026-12-07 → 2026-12-09  · [G]
- **Ana amaç:** TUS tarihine adaptif deterministik plan.
- **Görevler:** (1) Sınav tarihinden geriye konu kapsama planı; (2) son 4 hafta "tekrar+deneme" modu; (3) hangi konu/soru sayısı deterministik koddan.
- **Dosyalar:** yeni `src/utils/adaptivePlan.js`, `src/services/aiStudyPlanService.js`, `Dashboard.jsx`.
- **Bağımlılık:** S14 (TUS tarihi), S51.
- **Tamamlanma:** Tarihe göre günlük yoğunluk deterministik ayarlanıyor.
- **Testler:** `lint`, `test` (plan util), `build`.
- **Metrik:** Plan takip oranı.
- **Rollback:** Adaptif plan flag'li; sabit plana dön.
- **Dokunma:** AI'ın tıbbi içerik üretmesi (YASAK).

## Sprint 53 — 2026-12-10 → 2026-12-12  · [G]
- **Ana amaç:** Gemini topic allowlist + güvenli fallback — MASTER_PLAN §5.9.
- **Görevler:** (1) Plan çıktısındaki konu adları `TRACKER_TOPICS` ile eşleşmezse fallback; (2) `validateStudyPlanJson`'a allowlist kapısı; (3) halüsinasyon guard testi.
- **Dosyalar:** `functions/services/generateAiStudyPlan.js`, `functions/utils/validateStudyPlanJson.js`, `functions/services/buildFallbackDailyStudyPlan.js`.
- **Bağımlılık:** S17 (taksonomi).
- **Tamamlanma:** Taksonomi dışı AI çıktısı fallback'e düşüyor.
- **Testler:** `lint`, `test`, functions smoke.
- **Metrik:** Fallback oranı; hatalı konu = 0.
- **Rollback:** Allowlist gevşetilebilir (uyarı modu).
- **Dokunma:** AI ile soru üretimi (YASAK).

## Sprint 54 — 2026-12-13 → 2026-12-15  · [G]
- **Ana amaç:** Anonim "Tusoskop Endeksi" iç beta.
- **Görevler:** (1) Anonim toplu veriden dönemsel hazırlık raporu (yalnızca iç); (2) k-anonimlik/eşik koruması; (3) iç doğrulama.
- **Dosyalar:** yeni `functions/` toplayıcı veya `scripts/`, iç rapor.
- **Bağımlılık:** S27 (kalibrasyon veri).
- **Tamamlanma:** İç beta raporu üretiliyor; bireysel veri sızmıyor.
- **Testler:** `lint`, `test`, `test:rules`.
- **Metrik:** Rapor tutarlılığı.
- **Rollback:** Yalnızca iç; kamuya açılmaz (Faz 6 sonrası karar).
- **Dokunma:** Kamuya yayın (henüz).

## Sprint 55 — 2026-12-16 → 2026-12-18  · [H]
- **Ana amaç:** Firestore maliyet optimizasyonu — TD (ölçeklenme).
- **Görevler:** (1) Okuma-yoğun yolları (leaderboard `read: true`, admin `users` list) profil; (2) önbellek/sayfalama; (3) maliyet/aktif kullanıcı ölç.
- **Dosyalar:** `src/services/leaderboardService.js`, `src/services/adminService.js`, gerekirse callable önbellek.
- **Bağımlılık:** S09, S38.
- **Tamamlanma:** En pahalı okuma yolu önbellekli/sayfalı.
- **Testler:** `lint`, `test`, `test:rules`, `build`.
- **Metrik:** Okuma/aktif kullanıcı; aylık fatura trendi.
- **Rollback:** Önbellek katmanı flag'li.
- **Dokunma:** Rules güvenlik gevşetme (YASAK).

## Sprint 56 — 2026-12-19 → 2026-12-21  · [H]
- **Ana amaç:** Soru chunk performansı — TD-19.
- **Görevler:** (1) Ders bazlı dynamic import ölç; (2) ilk yük/bundle analizi; (3) lazy yükleme (gerekliyse).
- **Dosyalar:** `src/data/questions.js`, `questionChunks/*` import noktaları, `vite.config.js`.
- **Bağımlılık:** Yok.
- **Tamamlanma:** İlk yük bundle'ında soru bankası ağırlığı azaldı (ölçülü).
- **Testler:** `lint`, `test`, `build` (+ bundle analiz), `test:e2e`.
- **Metrik:** İlk yük süresi / bundle boyutu.
- **Rollback:** Statik import'a dön (davranış aynı).
- **Dokunma:** Soru içeriği.

## Sprint 57 — 2026-12-22 → 2026-12-24  · [H]
- **Ana amaç:** Incident + veri kurtarma belgeleri.
- **Görevler:** (1) `docs/INCIDENT_RUNBOOK.md` (ödeme, auth, veri); (2) Firestore yedek/geri yükleme prosedürü; (3) Sentry alarm eşiği.
- **Dosyalar:** yeni `docs/INCIDENT_RUNBOOK.md`, `docs/HANDOFF.md` (link).
- **Bağımlılık:** S02-S03 (Sentry).
- **Tamamlanma:** Tek kurucu bir olayı adım adım çözebilecek runbook'a sahip.
- **Testler:** Belge; yedek prosedürü kuru-çalıştırma (mock).
- **Metrik:** —
- **Rollback:** —
- **Dokunma:** Üretim verisiyle canlı deneme (YASAK — mock/staging).

## Sprint 58 — 2026-12-25 → 2026-12-27  · [H]
- **Ana amaç:** KVKK, gizlilik ve analytics consent incelemesi.
- **Görevler:** (1) Consent akışı (GA4/Pixel/Clarity) gözden geçir; (2) gizlilik metni + veri saklama; (3) e-posta/push opt-out doğrulaması.
- **Dosyalar:** `src/content/legalPages.js`, consent bileşeni, `src/lib/*` (koşullu init).
- **Bağımlılık:** S33 (e-posta), S04 (analytics).
- **Tamamlanma:** Consent'siz izleme yapılmıyor; opt-out'lar çalışıyor.
- **Testler:** `lint`, `test`, `build`, `test:e2e`.
- **Metrik:** Consent oranı; uyum riski.
- **Rollback:** Consent katmanı flag'li ama varsayılan güvenli (izleme kapalı).
- **Dokunma:** İzinsiz veri toplama (YASAK).

## Sprint 59 — 2026-12-28 → 2026-12-30  · [A/H]
- **Ana amaç:** Tam regresyon.
- **Görevler:** (1) Tüm CI + genişletilmiş E2E; (2) rules test kapsamı denetimi; (3) soru kalite tam tur.
- **Dosyalar:** `e2e/*`, CI, `reports/*`.
- **Bağımlılık:** S01-S58.
- **Tamamlanma:** Tüm kapılar yeşil; kritik yol regresyonsuz.
- **Testler:** `lint`, `test`, `test:rules`, `validate:questions`, `build`, `test:e2e:full`.
- **Metrik:** CI yeşil oranı; açık kritik bug = 0.
- **Rollback:** Kırılan alan izole edilip düzeltilir; skip YASAK.
- **Dokunma:** Yeni özellik (dondurma).

## Sprint 60 — 2026-12-31 → 2027-01-02  · [A/H]
- **Ana amaç:** Altı aylık retrospektif + sonraki 6 ay tohumu.
- **Görevler:** (1) NSM/aktivasyon/retention/gelir 6 ay trendi; (2) `DECISION_LOG` + `TECH_DEBT_REGISTER` kapanış; (3) sonraki plan taslağı (Astro/Next kararı yalnızca CWV zorlarsa).
- **Dosyalar:** `docs/DECISION_LOG.md`, `docs/TECH_DEBT_REGISTER.md`, yeni `docs/RETRO_2026H2.md`.
- **Bağımlılık:** Tümü.
- **Tamamlanma:** 6 ay ölçülü değerlendirildi; sonraki faz önceliklendi.
- **Testler:** Tüm CI.
- **Metrik:** NSM yıla göre; organik kayıt payı.
- **Rollback:** —
- **Dokunma:** Mimari rewrite (DO_NOT_BUILD — veri zorlamadıkça).

---

## Sprint Boyu Uyarılar (tüm sprintler için geçerli)

- **Aynı anda ≤2 workstream, ≤3 görev.** Bir sprint kayarsa sonraki sprint kapsamı daraltılır, ikinci iş akışı açılmaz.
- **Öncelik zinciri bozulamaz:** üst katmanda kırmızı alarm (ör. üretim hata sıçraması) varken alt katman işine geçilmez.
- **`firestore.rules` yalnızca testin ortaya çıkardığı zorunlu hata veya planlı güvenlik işi (S09, S10, S18, S22) için değişir; her değişiklik `test:rules`'a yeni senaryo ekler.**
- **Üretim credential / secret / kullanıcı verisi hiçbir çıktıya yazılmaz.** Betikler yerelde mock/emulator ile çalışır.
- **Her sprint sonunda:** ilgili testler + tech-debt durum güncellemesi; geri alınabilirlik (flag/env) korunur.
