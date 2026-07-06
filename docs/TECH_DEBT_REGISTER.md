# Teknik Borç ve Risk Kaydı

> Durum tarihi: 2026-07-06, `main` @ `6027bdd`. Severity: Kritik/Yüksek/Orta/Düşük.
> Olasılık ve etki 1-5. Efor: S (<½ gün) / M (1-3 gün) / L (>3 gün).
> Kapatılan maddeler silinmez, `[KAPANDI tarih]` işaretlenir.

## Açık Maddeler (öncelik sırasıyla)

| ID | Başlık | Kanıt | Severity | Olasılık | Kullanıcı etkisi | Efor | Çözüm |
|----|--------|-------|----------|----------|------------------|------|-------|
| TD-01 | Üretimde hata izleme yok | Repoda Sentry/GlitchTip vb. yok (grep 0) | **Kritik** | 5 | 4 — hatalar sessizce kullanıcı kaybettirir | S | Sentry web+functions (90g planı H1) |
| TD-02 | Firestore rules testi CI'da değil | `test:rules` scripti var, `ci.yml`'de yok | **Yüksek** | 3 | 5 — rules regresyonu veri sızıntısı/premium bypass olabilir | S | CI'ya emulator adımı |
| TD-03 | Leaderboard skoru istemciden yazılıyor | `firestore.rules` L310-314: owner create/update serbest | **Yüksek** | 4 | 3 — hile, lig güvenilirliği | M | Skor yazımını callable'a taşı; rules'ta owner write kapat |
| TD-04 | Gün sınırı UTC (streak, usage, AI plan cache) | `toISOString().slice(0,10)` — `streakService.js`, `usageLimitService.js`, `functions/index.js` | **Yüksek** | 5 (her gece yaşanıyor) | 3 — TR 00:00-03:00 arası yanlış gün; streak kırılması, limitin erken/geç sıfırlanması | M | Europe/Istanbul tabanlı `todayKey`; istemci+sunucu birlikte |
| TD-05 | Usage limiti callable düşünce local fallback'e emanet | `usageLimitService.js` catch → `getLocalUsage()`; güvenlik denetiminde "Orta" | Orta | 2 | 2 — limit bypass (cihaz başına) | M | Fail-closed veya artırım öncesi sunucu sayacını yeniden oku |
| TD-06 | `results`/`studySessions` create içerik doğrulamasız | rules L193-205: yalnızca `userId==auth.uid` | Orta | 3 | 2 — sahte skor, kalibrasyon verisini kirletir (Mini TUS'la kritikleşir) | M | Şema validasyonu rules'a; kalibrasyona giren veriye sunucu filtresi |
| TD-07 | Cloud Functions'ın hiç testi yok | `functions/` altında test dosyası yok | Orta | 3 | 4 — ödeme/limit kodu test korumasız | L | `paytr.js` hash+idempotency ve `incrementUsage` transaction'ına unit test |
| TD-08 | E2E kapsam tek smoke spec | `e2e/smoke.spec.js` | Orta | 3 | 3 | M | 3 kritik yol: kayıt→soru çözme, limit→paywall, /coz uçtan uca |
| TD-09 | Soru kalite audit'i bayat | Audit 5687 soruyla (2026-05-24), banka 7077 | Orta | 4 | 3 — son ~1390 soru denetimsiz | S | `quality:questions` çalıştır + CI'ya bayatlama uyarısı |
| TD-10 | Soru versiyonlama yok | Soru şemasında `rev` alanı yok | Orta | 3 | 2 — düzeltme geçmişi/FSRS ilişkisi izlenemez | M | `rev`+`revisedAt`; MASTER_PLAN §5.2 |
| TD-11 | Kullanıcı hata bildirimi kanalı yok | Soru ekranında rapor özelliği yok | Orta | 4 | 3 | M | `questionReports` koleksiyonu (90g H3) |
| TD-12 | Attribution'da tıklama ID'leri kayboluyor | rules `hasValidAcquisitionShape`: yalnızca source/medium/campaign | Orta | 4 | 2 — Meta eşleşme kalitesi düşük; CAPI verimi azalır | S | `fbclid`/`gclid` alanlarını şema+rules'a ekle |
| TD-13 | CAPI yok | grep 0 | Orta | 4 | 2 — iOS ATT/ad-blocker ölçüm kaybı | M | Yalnızca Purchase+CompleteRegistration (METRICS §CAPI) |
| TD-14 | Rules'ta ölü koleksiyonlar (`streaks`, `studyCollections`, `examResults`) | Güvenlik denetimi; istemci farklı path kullanıyor | Düşük | 2 | 1 — kafa karışıklığı, yanlış path riski | S | Kaldır veya gerçek path'e hizala |
| TD-15 | `AppAuthenticated.jsx` 959 satır, view-state routing | `wc -l`; react-router yok (bilinçli) | Düşük | 2 | 1 — geliştirme hızı yavaşlar | L | Acele yok; ekran ekledikçe parçala. Rewrite YASAK (DO_NOT_BUILD) |
| TD-16 | Sahte leaderboard seed scripti | `scripts/seedFakeLeaderboard.mjs` | Düşük (etik: Yüksek) | 2 | 4 — ifşada güven kaybı | S | Üretim verisini temizle, scripti arşivle (90g H5) |
| TD-17 | iOS branch'i (`ios-appstore-v1`) bu ortamda görünmüyor; main↔ios drift bilinmiyor | `git branch -a` yalnızca main + plan branch | Orta | 3 | 3 — cherry-pick süreci elle, drift birikir [VARSAYIM] | M | Branch envanteri çıkar; PublicHome/iOS açılış kararını (CLAUDE.md notu) kapat |
| TD-18 | Apple 3.1.1 uyumu belirsiz | PayTR web-only; iOS'ta premium ekranının durumu doğrulanamadı | **Yüksek** | 3 | 5 — App Store reddi/kanal kapanması | M | iOS build'inde satın alma yüzeyini denetle; IAP kararı (DECISION_LOG D-007) |
| TD-19 | Soru bankası tamamı ana bundle'a giriyor | `src/data/questionChunks/*` statik import [VARSAYIM: chunk lazy-load kanıtı görülmedi] | Orta | 3 | 3 — ilk yük süresi, mobil veri | M | Ders bazlı dynamic import; ölçüm: bundle analiz |
| TD-20 | GA4'te `purchase` eventi yok | `metaPixel.js`'te Pixel Purchase var; GA4 karşılığı yok | Orta | 5 | 2 — gelir funnel'ı GA4'te kör | S | METRICS Tier-1 |

## Mobil/Web Davranış Farkları (bilinen)

- Google Sign-In iOS Simulator'da çalışmaz (CLAUDE.md); native auth yalnızca ios branch'inde.
- Anonim `/` web'de PublicHome render eder; iOS'ta doğrudan login isteniyorsa `Capacitor.isNativePlatform()` kontrolü gerekir — CLAUDE.md'de açık iş olarak duruyor (TD-17 ile birlikte).
- `fbq` WKWebView'da "web" veri kaynağı olarak çalışır (bilinçli tasarım).

## Ölçeklenme Notları (şimdilik izle, yapma)

- Firestore okuma maliyeti: leaderboard `allow read: if true` — anonim botlar dahil herkes okuyabilir; trafik artarsa maliyet. Eşik: aylık fatura/aktif kullanıcı artınca önbellekli callable'a geç.
- `adminService.js` tüm `users` koleksiyonunu çekiyor (denetim raporu Düşük bulgusu) — 5-10k kullanıcıda admin paneli yavaşlar; sayfalama eklenir.
- Statik prerender + Vercel mevcut ölçek için yeterli; `SEO_MIGRATION_PLAN.md`'deki framework değişimi ancak Core Web Vitals verisi zorlarsa.
