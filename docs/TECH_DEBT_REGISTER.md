# Teknik Borç ve Risk Kaydı

> Durum tarihi: 2026-07-06, `main` @ `6027bdd`. Kanıt = repo doğrulaması.
> **Skorlar:** Severity (Kritik/Yüksek/Orta/Düşük); Olasılık, Kullanıcı/Güvenlik/Gelir etkisi = 1-5
> (1 önemsiz, 5 kritik); Efor = S (<½ gün) / M (1-3 gün) / L (>3 gün).
> **Durum:** Açık / Devam / Kapandı / İzleniyor.
> Kapatılan madde silinmez, `Durum=Kapandı (tarih)` işaretlenir.
>
> **Not:** Görevi veren brief bu dosyanın "GitHub 429" hatası içerdiğini bildirmişti; repo
> doğrulamasında dosya geçerli içerik taşıyordu. Bu sürüm genişletilmiş kolon şablonuna yükseltildi
> ve her madde repo üzerinden yeniden doğrulandı.

## Alan sözlüğü

Her madde: **ID · Başlık · Kanıt · Severity · Olasılık · Kullanıcı etkisi · Güvenlik etkisi · Gelir etkisi · Çözüm · Efor · Bağımlılık · Rollback · Durum.**

---

### TD-01 — Üretimde hata izleme yok
- **Kanıt:** `grep -ri "sentry|glitchtip"` → 0 (yalnızca soru chunk'larında "capi/sentry" gibi kelime rastlantıları). `src/components/ErrorBoundary.jsx` var ama hiçbir servise raporlamıyor.
- **Severity:** Kritik · **Olasılık:** 5 · **Kullanıcı:** 4 · **Güvenlik:** 2 · **Gelir:** 4 (görünmez ödeme/aktivasyon hataları doğrudan gelir kaybı)
- **Çözüm:** Sentry web (`main.jsx`+`ErrorBoundary`+`window.onerror`) ve Functions; PII maskeleme. SIX_MONTH S02-S03.
- **Efor:** M · **Bağımlılık:** Yok · **Rollback:** DSN env boşsa no-op (feature-flag). · **Durum:** Açık

### TD-02 — Firestore rules testi CI'da çalışmıyor → **KAPANDI**
- **Kanıt:** `package.json` `test:rules` scripti vardı, `.github/workflows/ci.yml`'de adım yoktu. Bu PR ile eklendi (Java setup + firebase-tools + `npm run test:rules`); yerelde çalıştırıldı: `Firestore rules emulator tests passed` (exit 0).
- **Severity:** Yüksek · **Olasılık:** 3 · **Kullanıcı:** 2 · **Güvenlik:** 5 (rules regresyonu = premium bypass/veri sızıntısı) · **Gelir:** 3
- **Çözüm:** CI adımı eklendi. Yeni güvenlik işleri (S09/S10/S18/S22) her rules değişiminde yeni senaryo ekler.
- **Efor:** S · **Bağımlılık:** Yok · **Rollback:** Adım flaky olursa geri al (rules içeriği değişmedi). · **Durum:** Kapandı (2026-07-06)

### TD-03 — Leaderboard skoru istemciden yazılıyor
- **Kanıt:** `firestore.rules` L310-314 `weeklyLeaderboard/{weekId}/users/{uid}` → `allow create, update: if isOwner(uid)` (içerik doğrulaması yok). `src/services/leaderboardService.js` skoru doğrudan yazıyor.
- **Severity:** Yüksek · **Olasılık:** 4 · **Kullanıcı:** 3 (lig güveni) · **Güvenlik:** 4 · **Gelir:** 1
- **Çözüm:** Skor yazımını callable'a taşı (sunucu doğrular), rules'ta owner write kapat, `test:rules`'a deny senaryosu. SIX_MONTH S09.
- **Efor:** M · **Bağımlılık:** TD-02 (rules CI kapısı) · **Rollback:** Callable gecikirse optimistic UI; rules geri alınmaz. · **Durum:** Açık

### TD-04 — Europe/Istanbul gün sınırı (UTC kullanılıyor)
- **Kanıt:** `src/services/streakService.js` `new Date().toISOString().split("T")[0]`; `src/services/usageLimitService.js` `getTodayKey = () => new Date().toISOString().slice(0,10)`; `functions/index.js` `todayKey()`/`monthKey()` aynı. UTC+3'te gün 03:00'te döner.
- **Severity:** Yüksek · **Olasılık:** 5 (her gece) · **Kullanıcı:** 3 (streak kırılması, limit erken/geç sıfırlanması) · **Güvenlik:** 1 · **Gelir:** 2 (yanlış streak/limit → memnuniyetsizlik)
- **Çözüm:** Ortak `istanbulDayKey()`; istemci (S07) + sunucu (S08) birlikte.
- **Efor:** M · **Bağımlılık:** İstemci+sunucu senkron · **Rollback:** Tek yardımcıda flag ile UTC'ye dön (çift sayım görülürse). · **Durum:** Açık

### TD-05 — `/coz` cevapları kayıt sonrası kayboluyor
- **Kanıt:** `src/components/funnel/PublicQuizFunnel.jsx` sonucu `localStorage["tusoskop_quiz_result"]`'a yazıyor; kayıt sonrası hesaba aktaran kod yok (grep: import→questionHistory bağı yok). CLAUDE.md'de "bilinen sınır (Phase-2)".
- **Severity:** Yüksek · **Olasılık:** 5 (her funnel kaydı) · **Kullanıcı:** 3 (emek kaybı) · **Güvenlik:** 1 · **Gelir:** 3 (funnel→aktivasyon dönüşümü düşer, reklam ROI'si erir)
- **Çözüm:** İçe aktarma + FSRS seed. SIX_MONTH S11-S12.
- **Efor:** M · **Bağımlılık:** Tier-1 eventler (etki ölçümü) · **Rollback:** Import başarısızsa sessiz atla; akış bozulmaz. · **Durum:** Açık

### TD-06 — `results`/`studySessions`/Mini TUS veri doğrulama açığı
- **Kanıt:** `firestore.rules` L193-205 `results`/`studySessions` create yalnızca `userId==auth.uid` — skor/şema doğrulaması yok. Kalibrasyon (Mini TUS) bu veriye dayanacağı için kritikleşir.
- **Severity:** Orta · **Olasılık:** 3 · **Kullanıcı:** 2 · **Güvenlik:** 3 (sahte skor kalibrasyonu kirletir) · **Gelir:** 2
- **Çözüm:** Şema validasyonu rules'a; kalibrasyona giren veriye sunucu filtresi + aykırı değer temizliği. SIX_MONTH S22/S27.
- **Efor:** M · **Bağımlılık:** TD-02 · **Rollback:** Yeni rules kısıtı izole; sorun olursa gevşet. · **Durum:** Açık

### TD-07 — Cloud Functions testleri yok
- **Kanıt:** `functions/` altında test dosyası yok (`find functions -name "*.test.*"` → 0). `paytr.js` hash/idempotency ve `incrementUsage` transaction'ı test korumasız.
- **Severity:** Orta · **Olasılık:** 3 · **Kullanıcı:** 4 (ödeme/limit hatası) · **Güvenlik:** 3 · **Gelir:** 4 (ödeme kodu regresyonu)
- **Çözüm:** `paytr` hash+idempotency ve `incrementUsage` için unit/emulator testleri.
- **Efor:** L · **Bağımlılık:** TD-02 emulator altyapısı · **Rollback:** — (test ekleme) · **Durum:** Açık

### TD-08 — E2E kapsam tek smoke spec
- **Kanıt:** `e2e/smoke.spec.js` tek dosya; `playwright.config.js` var. Kritik yollar (kayıt→soru, limit→paywall, /coz) kapsanmıyor.
- **Severity:** Orta · **Olasılık:** 3 · **Kullanıcı:** 3 · **Güvenlik:** 1 · **Gelir:** 2
- **Çözüm:** 3 kritik yol Playwright. SIX_MONTH S29.
- **Efor:** M · **Bağımlılık:** Mini TUS (S23) kritik yol için · **Rollback:** Flaky testi stabilize et; skip YASAK. · **Durum:** Açık

### TD-09 — Soru kalite audit'i manifest'ten geri kalmış
- **Kanıt:** `reports/question-bank-quality-audit.md` "Toplam soru 5687" (2026-05-24); `_manifest.json` toplamı 7077. ~1390 soru denetimsiz. Ayrıca güvenlik denetimi 4114 soruyla üretilmiş (daha eski).
- **Severity:** Orta · **Olasılık:** 4 · **Kullanıcı:** 3 (yanlış soru güveni yakar) · **Güvenlik:** 1 · **Gelir:** 2
- **Çözüm:** `npm run quality:questions` (7077) + CI'ya bayatlama uyarısı (manifest vs audit farkı >500). SIX_MONTH S15.
- **Efor:** S · **Bağımlılık:** Yok · **Rollback:** Rapor üretimi; soru değişmez (uzman onayı gerekir). · **Durum:** Açık

### TD-10 — Soru versiyonlama yok
- **Kanıt:** Soru şemasında `rev`/`revisedAt` yok (questionChunks örnekleri: id,q,options,correct,exp,diff,topic). Düzeltme geçmişi ve FSRS ilişkisi izlenemiyor.
- **Severity:** Orta · **Olasılık:** 3 · **Kullanıcı:** 2 · **Güvenlik:** 1 · **Gelir:** 1
- **Çözüm:** `rev`+`revisedAt`; `validate:questions` kuralı; `questionHistory`/FSRS `rev` bilir. SIX_MONTH S16.
- **Efor:** M · **Bağımlılık:** TD-09 · **Rollback:** `rev || 1` geri uyumlu. · **Durum:** Açık

### TD-11 — Kullanıcı soru hata bildirim kanalı yok
- **Kanıt:** `StudyScreen.jsx`'teki `feedback`/`favoriteFeedback` cevap geri bildirimi (doğru/yanlış), hata raporu değil. `questionReports` koleksiyonu yok.
- **Severity:** Orta · **Olasılık:** 4 · **Kullanıcı:** 3 · **Güvenlik:** 1 · **Gelir:** 2 (kalite güveni → dönüşüm)
- **Çözüm:** Soru içi "Hata bildir" → `questionReports` (create-only rule) + admin triage. SIX_MONTH S10.
- **Efor:** M · **Bağımlılık:** TD-02 · **Rollback:** Rapor UI feature-flag. · **Durum:** Açık

### TD-12 — Attribution alanlarının kaybı (tıklama ID'leri)
- **Kanıt:** `firestore.rules` `hasValidAcquisitionShape` yalnızca `source/medium/campaign/firstSeenAt` tutuyor (`keys().hasOnly`); `fbclid`/`gclid` reddedilir. Reklam eşleşme kalitesi düşer.
- **Severity:** Orta · **Olasılık:** 4 · **Kullanıcı:** 1 · **Güvenlik:** 1 · **Gelir:** 3 (CAPI verimi + reklam optimizasyonu)
- **Çözüm:** Şema+rules'a `fbclid`/`gclid`; kayıt akışında taşı. SIX_MONTH S18.
- **Efor:** S · **Bağımlılık:** TD-02 · **Rollback:** Yeni alanlar opsiyonel, geri uyumlu. · **Durum:** Açık

### TD-13 — CAPI yok
- **Kanıt:** `grep -ri "capi|conversions api"` → yalnızca soru metni rastlantıları; sunucu-taraflı Meta event gönderimi yok. Pixel tarayıcıda (ATT/ad-blocker kaybı).
- **Severity:** Orta · **Olasılık:** 4 · **Kullanıcı:** 1 · **Güvenlik:** 1 · **Gelir:** 3
- **Çözüm:** Yalnızca Purchase + CompleteRegistration için CAPI (PayTR callback + signup), `event_id` dedup. METRICS_AND_EVENTS §CAPI.
- **Efor:** M · **Bağımlılık:** TD-12 · **Rollback:** CAPI çağrısı try/catch; Pixel yine çalışır. · **Durum:** Açık

### TD-14 — Rules'ta ölü/uyumsuz koleksiyonlar
- **Kanıt:** `firestore.rules` `streaks`, `studyCollections`, `examResults` match'leri var; istemci farklı path kullanıyor (streak `users/{uid}` üzerinde — `streakService.js`; sonuçlar `results`). Güvenlik denetimi Orta bulgu.
- **Severity:** Düşük · **Olasılık:** 2 · **Kullanıcı:** 1 · **Güvenlik:** 2 (yanlış path'e yazım riski) · **Gelir:** 1
- **Çözüm:** Kullanılmayan match'leri kaldır veya gerçek path'e hizala + dokümante.
- **Efor:** S · **Bağımlılık:** TD-02 · **Rollback:** Rules geri al. · **Durum:** Açık

### TD-15 — Analytics taxonomy sapması (merkezî wrapper yok)
- **Kanıt:** Event çağrıları dağınık: `src/lib/metaPixel.js`, `publicQuizAnalytics.js`, bileşenlerde ayrı `fbq`/`logEvent`. Tek `analytics.js` wrapper yok; GA4'te `purchase` hiç yok (yalnızca Pixel). Funnel event adları sadece CLAUDE.md'de.
- **Severity:** Orta · **Olasılık:** 4 · **Kullanıcı:** 1 · **Güvenlik:** 1 · **Gelir:** 3 (yanlış ölçüm = yanlış karar)
- **Çözüm:** `src/lib/analytics.js` sarmalayıcı + taxonomy allowlist. SIX_MONTH S04.
- **Efor:** M · **Bağımlılık:** METRICS_AND_EVENTS · **Rollback:** İnce katman; doğrudan çağrılara dönüş. · **Durum:** Açık

### TD-16 — Sahte leaderboard seed verisi
- **Kanıt:** `scripts/seedFakeLeaderboard.mjs` her lige 8'er sahte kullanıcı ekler. İfşa edilirse güven riski (Red Team #4).
- **Severity:** Düşük (teknik) / Yüksek (etik-itibar) · **Olasılık:** 2 · **Kullanıcı:** 4 (güven) · **Güvenlik:** 1 · **Gelir:** 2
- **Çözüm:** Üretim verisini temizle, scripti deprecate; "kendi rekorunla yarış" modu. SIX_MONTH S10/S38.
- **Efor:** S · **Bağımlılık:** Üretim Firestore erişimi (dikkatli) · **Rollback:** — (geri ekleme YASAK, DO_NOT_BUILD). · **Durum:** Açık

### TD-17 — iOS branch drift'i / envanter belirsizliği
- **Kanıt:** `git branch -a` → yalnızca `main` + plan branch'leri; `ios-appstore-v1` bu klonda yok. main↔ios farkı ölçülemiyor [VARSAYIM].
- **Severity:** Orta · **Olasılık:** 3 · **Kullanıcı:** 3 · **Güvenlik:** 2 · **Gelir:** 2
- **Çözüm:** Branch envanteri; iOS açılış (`Capacitor.isNativePlatform()`) kararını kapat.
- **Efor:** M · **Bağımlılık:** iOS branch erişimi · **Rollback:** — · **Durum:** İzleniyor

### TD-18 — iOS ödeme ve entitlement belirsizliği (Apple 3.1.1)
- **Kanıt:** PayTR web-only (`functions/paytr.js`, okUrl `tusoskop.com`); iOS'ta premium ekranının davranışı bu ortamdan doğrulanamadı. IAP izi yok.
- **Severity:** Yüksek · **Olasılık:** 3 · **Kullanıcı:** 3 · **Güvenlik:** 1 · **Gelir:** 5 (App Store reddi = iOS kanalı kapanır; iOS'ta ödeme yolu belirsiz = gelir kaybı)
- **Çözüm:** iOS'ta satın alma yüzeyini denetle; IAP vs gizleme kararı (D-007). SIX_MONTH S44.
- **Efor:** M · **Bağımlılık:** iOS DAU verisi · **Rollback:** Varsayılan güvenli: iOS'ta ödeme yüzeyini gizle. · **Durum:** Açık

### TD-19 — Soru bankası ilk yük ağırlığı
- **Kanıt:** `src/data/questions.js` chunk'ları statik import ediyor [VARSAYIM: dynamic import kanıtı görülmedi]; 7077 soru ana bundle'ı büyütebilir.
- **Severity:** Orta · **Olasılık:** 3 · **Kullanıcı:** 3 (mobil ilk yük) · **Güvenlik:** 1 · **Gelir:** 2
- **Çözüm:** Ders bazlı dynamic import + bundle analizi. SIX_MONTH S56.
- **Efor:** M · **Bağımlılık:** Yok · **Rollback:** Statik import'a dön (davranış aynı). · **Durum:** İzleniyor

### TD-20 — GA4'te `purchase` eventi yok
- **Kanıt:** `src/lib/metaPixel.js` `trackPurchase` var (Pixel); GA4 tarafında `purchase` çağrısı yok. Gelir funnel'ı GA4'te kör.
- **Severity:** Orta · **Olasılık:** 5 · **Kullanıcı:** 1 · **Güvenlik:** 1 · **Gelir:** 2 (gelir ürün funnel'ında görünmez)
- **Çözüm:** GA4 `purchase` (backend-onaylı anda, `merchantOid` dedup). SIX_MONTH S05.
- **Efor:** S · **Bağımlılık:** TD-15 wrapper · **Rollback:** Event ekleme davranışsız. · **Durum:** Açık

---

## Özet matris (öncelik sırası)

| ID | Başlık | Severity | Olasılık | Güvenlik | Gelir | Efor | Durum |
|----|--------|----------|----------|----------|-------|------|-------|
| TD-01 | Hata izleme yok | Kritik | 5 | 2 | 4 | M | Açık |
| TD-18 | iOS ödeme/Apple 3.1.1 | Yüksek | 3 | 1 | 5 | M | Açık |
| TD-03 | Leaderboard istemci yazımı | Yüksek | 4 | 4 | 1 | M | Açık |
| TD-04 | UTC gün sınırı | Yüksek | 5 | 1 | 2 | M | Açık |
| TD-05 | /coz cevap kaybı | Yüksek | 5 | 1 | 3 | M | Açık |
| TD-07 | Functions testi yok | Orta | 3 | 3 | 4 | L | Açık |
| TD-15 | Analytics taxonomy sapması | Orta | 4 | 1 | 3 | M | Açık |
| TD-13 | CAPI yok | Orta | 4 | 1 | 3 | M | Açık |
| TD-12 | Attribution kaybı | Orta | 4 | 1 | 3 | S | Açık |
| TD-06 | Veri doğrulama açığı | Orta | 3 | 3 | 2 | M | Açık |
| TD-09 | Audit bayat | Orta | 4 | 1 | 2 | S | Açık |
| TD-20 | GA4 purchase yok | Orta | 5 | 1 | 2 | S | Açık |
| TD-11 | Hata bildirim yok | Orta | 4 | 1 | 2 | M | Açık |
| TD-10 | Versiyonlama yok | Orta | 3 | 1 | 1 | M | Açık |
| TD-08 | E2E kapsam | Orta | 3 | 1 | 2 | M | Açık |
| TD-17 | iOS drift | Orta | 3 | 2 | 2 | M | İzleniyor |
| TD-19 | Bundle ağırlığı | Orta | 3 | 1 | 2 | M | İzleniyor |
| TD-14 | Ölü rules koleksiyonları | Düşük | 2 | 2 | 1 | S | Açık |
| TD-16 | Sahte leaderboard | Düşük* | 2 | 1 | 2 | S | Açık |
| TD-02 | Rules testi CI'da değil | Yüksek | — | 5 | 3 | S | **Kapandı (2026-07-06)** |

\* TD-16 teknik severity Düşük ama itibar/etik açıdan Yüksek.
