# Metrik ve Event Taxonomy'si

> Tek doğruluk kaynağı bu dosyadır. Yeni event eklemek = önce buraya satır eklemek, sonra kod.
> İsimlendirme: `snake_case`, fiil geçmiş zaman (`question_answered`), nesne+eylem sırası.
> Uygulama noktası: tüm istemci eventleri **tek sarmalayıcıdan** geçer (`src/lib/analytics.js`
> — Hafta 2'de yazılacak; GA4 + gerekirse Pixel eşlemesini tek yerden yapar).

## Sistem Görev Ayrımı (çelişkili ölçümü önleme mimarisi)

| Sistem | Tek görevi | ASLA kullanma |
|---|---|---|
| **Firebase Analytics (GA4)** | Ürün funnel'ı ve davranış: tüm `Tier-1/2` eventler, oranlar, retention kohortları. **Ürün kararları yalnızca GA4 sayılarıyla verilir.** | Reklam optimizasyonu, gelir muhasebesi |
| **Meta Pixel (+ ileride CAPI)** | Yalnızca Meta kampanya optimizasyonu ve eşleştirme: `ViewContent, QuizStart, QuizComplete, CompleteRegistration, Purchase, AppStoreClick`. Sayıları GA4 ile kıyaslanmaz — farklı görev. | Ürün metriği okumak |
| **Microsoft Clarity** | Nitel teşhis: rage-click, dead-click, oturum kaydı. Sayı üretmez, "neden" sorusuna bakılır. | Nicel raporlama |
| **App Store (pt/ct linkleri)** | iOS yükleme attribution'ı (`campaignCode`=ct). | Web funnel'ı |
| **Backend (Firestore: `publicQuizSessions`, `campaignClicks`, `premiumPurchaseIntents`, yeni `miniTusResults`)** | Ground truth: gelir, ödeme durumu, funnel oturum özetleri. Ay sonu "gerçek" sayılar buradan; GA4/Pixel'e karşı mutabakat ayda bir. | Gerçek zamanlı dashboard |

**Kurallar:** (1) Gelir sayısı yalnızca backend'den raporlanır; GA4 `purchase` ve Pixel `Purchase` *sinyaldir*, muhasebe değildir. (2) Aynı kavrama iki isim verilmez: Pixel standart adları Meta tarafında kalır, GA4 adları burada tanımlanır; eşleme tablosu aşağıda. (3) Her event `funnel_source` taşır: `coz | seo | store | direct | push | email`.

## Tier-1 Eventler (bunlar kırıksa hiçbir karar verilemez)

| Event | Ne zaman | Zorunlu parametreler | Sistem |
|---|---|---|---|
| `sign_up` | Firebase Auth ilk hesap oluşturma (yeni doc dalı, `ensureUserDocument`) | `method (google|apple)`, `funnel_source`, `campaign_code?` | GA4 (+Pixel `CompleteRegistration` — mevcut) |
| `first_question_answered` | Hesabın ilk cevabı | `subject`, `correct`, `source (onboarding|topic|coz_import)` | GA4 |
| `first_review_completed` | İlk due FSRS oturumunun bitişi | `card_count`, `days_since_signup` | GA4 |
| `activation_completed` | ≥20 soru (72s içinde) VE ≥1 tekrar (7g içinde) koşulu sağlandığında bir kez | `days_to_activate`, `funnel_source` | GA4 |
| `paywall_view` | Limit modali/premium ekranı açılışı | `trigger (daily_question|review|exam|topic_test|menu)`, `week_questions`, `due_cards` | GA4 |
| `purchase` | **Yalnızca** PayTR callback onayı sonrası onSnapshot anında | `plan_id`, `value`, `currency`, `order_id (merchantOid)` | GA4 + Pixel `Purchase` (mevcut, `purchaseTrackedRef` dedup korunur) |

## Kategori Kataloğu

### Acquisition
`page_view` (otomatik + `usePageTracking`), `campaign_click` (backend `campaignClicks` — mevcut), `store_redirect` (`/indir`), `appstore_click` (mevcut). Param: `utm_*`, `campaign_code`, `placement`, **`fbclid` (YENİ — `acquisition` şemasına eklenecek; şu an kaybediliyor)**.

### Quiz (/coz — mevcut isimler korunur)
`quiz_landing_view`, `quiz_start`, `question_answered`, `quiz_complete`, `result_view`, `web_continue_click`, `signup_start`, **YENİ:** `quiz_import_completed` (cevapların hesaba taşınması; `imported_wrong_count`).

### Mini TUS (YENİ)
`mini_tus_cta_click`, `mini_tus_start`, `mini_tus_question_answered (index, subject, correct)`, `mini_tus_complete (score, duration_ms)`, `mini_tus_result_view (estimated_t_low, estimated_t_high, weakest_subject)`, `mini_tus_share_click`.

### Authentication
`sign_up` (Tier-1), `login (method)`, `logout`, `auth_error (code)`.

### Onboarding (YENİ)
`onboarding_start`, `onboarding_step_completed (step: exam_date|target|first_task)`, `onboarding_completed`, `onboarding_skipped (step)`.

### FSRS / Tekrar
`review_session_start (source, due_count)`, `review_card_graded (grade, is_early, is_same_day)`, `review_session_complete (cards, correct_rate)`, `first_review_completed` (Tier-1), `review_queue_empty_view`.

### Subscription
`paywall_view` (Tier-1), `plan_selected (plan_id)`, `paytr_token_requested`, `paytr_iframe_opened`, `payment_failed (reason)` (intent `failed` snapshot'ından), `purchase` (Tier-1), `premium_expired_view` (süre bitmiş kullanıcının ilk oturumu), `winback_email_click` (Dönem 3+).

### Retention
`streak_extended (length)`, `streak_broken (length)`, `leaderboard_view`, `notification_open (type)` (Dönem 3+), `email_open/click` (sağlayıcı tarafında), `daily_plan_view`, `daily_plan_task_completed`.

### Referral (Dönem 4+, şimdilik rezerve)
`referral_link_created`, `referral_signup`, `referral_reward_granted`.

### Error & Reliability
Sentry birincil kaynak. GA4'e yalnızca kullanıcı-görünür kesintiler: `app_error_boundary (component)`, `payment_error`, `sync_error (service)`. Sentry release health (crash-free rate) haftalık kontrol.

## GA4 ↔ Pixel Eşleme Tablosu

| Kavram | GA4 | Pixel |
|---|---|---|
| Funnel landing | `quiz_landing_view` | `ViewContent` |
| Quiz başlama/bitirme | `quiz_start` / `quiz_complete` | `QuizStart` / `QuizComplete` (custom) |
| Kayıt | `sign_up` | `CompleteRegistration` |
| Ödeme | `purchase` | `Purchase` (eventID=merchantOid) |
| Store tıklaması | `appstore_click` | `AppStoreClick` (custom) |

## CAPI Planı (Dönem 2-3)

Pixel tarayıcı tarafında ad-blocker/ATT ile kayıp yaşar. Çözüm: `Purchase` ve `CompleteRegistration` **sunucudan** Meta Conversions API'ye de gönderilir — doğal yerler: PayTR callback'i (`functions/paytr.js`, aktivasyon transaction'ı sonrası) ve `ensureUserDocument`'ı tetikleyen akış için hafif bir callable. Dedup: `event_id` = `merchantOid` / `uid+signup`. Pixel tarafında aynı `eventID` parametresi set edilir. **CAPI yalnızca bu 2 event için kurulur** — tüm eventleri taşımak tek kurucu için bakım yükü.

## Haftalık Bakılacak 8 Sayı (dashboard tanımı)

1. NSM: Weekly Committed Reviewers (≥3 gün tekrar)
2. Yeni kayıt (kaynak kırılımlı)
3. Aktivasyon oranı
4. W1 / W4 tekrar retention
5. `/coz` landing→kayıt dönüşümü (kampanya bazlı)
6. `paywall_view→purchase`
7. Aktif Plus sayısı + o hafta gelir (backend)
8. Sentry crash-free rate + açık `questionReports`
