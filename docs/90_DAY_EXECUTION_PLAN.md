# 90 Günlük Uygulama Planı (2026-07-07 → 2026-10-04)

> Kurucu kısıtı: tek kişi, sınırlı saat. **Aynı anda en fazla 2 iş akışı:**
> **WS-A: Güvenilirlik + Ölçüm** ve **WS-B: Aktivasyon Funnel'ı**. Retention (push/e-posta) 61. günden önce BAŞLAMAZ.
> Skorlar: Etki/Güven/Efor 1-5 (Efor 5 = en ağır). Kaynak plan: `docs/MASTER_PLAN_2026_2028.md`.

## Hafta 1 (7-13 Tem) — Görünürlük

| | Görev 1.1 | Görev 1.2 |
|---|---|---|
| Görev | Sentry kur (web `ErrorBoundary` + `window.onerror` + functions) | `test:rules`'ı CI'ya ekle (`ci.yml`'e emulator adımı) |
| Gerekçe | Üretim hataları bugün tamamen görünmez (repoda hata izleme yok) | Script var (`package.json test:rules`) ama CI'da çalışmıyor; rules regresyonu sessiz geçer |
| Etki / Güven / Efor | 5 / 5 / 2 | 4 / 5 / 1 |
| Bağımlılık | Yok | Java + firebase-tools CI kurulumu |
| Tamamlanma kriteri | Bilinçli test hatası Sentry'de issue açıyor (web+fn) | PR'da rules testi kırmızı/yeşil görünüyor |
| Metrik | `error_rate` (Sentry) haftalık taban | CI süresi <25 dk kalıyor |
| Başarısızlık koşulu | 3 gün içinde kurulamazsa alternatif (GlitchTip/self-host) değerlendir, haftayı taşırma | Emulator CI'da flaky ise nightly'e al, PR'dan çıkar |

## Hafta 2 (14-20 Tem) — Event taxonomy v1

| | Görev 2.1 | Görev 2.2 |
|---|---|---|
| Görev | `METRICS_AND_EVENTS.md` Tier-1 eventlerini koda ekle: `sign_up`, `first_question_answered`, `first_review_completed`, `activation_completed`, `paywall_view`, GA4 `purchase` | Merkezî `src/lib/analytics.js` sarmalayıcı (GA4+Pixel tek çağrı, tek isimlendirme) |
| Gerekçe | Aktivasyon bugün tanımsız ve ölçümsüz; tüm sonraki kararlar buna bağlı | 4 ayrı ölçüm sistemi elle çağrılıyor; taxonomy sapması kaçınılmaz |
| Etki / Güven / Efor | 5 / 5 / 3 | 4 / 4 / 2 |
| Bağımlılık | Taxonomy dokümanı (hazır) | 2.1 ile birlikte |
| Tamamlanma kriteri | GA4 DebugView'da zincir uçtan uca akıyor | Yeni event eklemek tek dosyada tek satır |
| Metrik | `activation_completed` / `sign_up` oranı (taban) | — |
| Başarısızlık koşulu | 7 gün sonra eventlerde >%20 boşluk/çift sayım varsa hafta 3'te düzeltmeye dön | — |

## Hafta 3 (21-27 Tem) — Zaman dilimi + hata bildirimi

| | Görev 3.1 | Görev 3.2 |
|---|---|---|
| Görev | Gün sınırını Europe/Istanbul yap: `streakService.js`, `usageLimitService.js`, `functions/index.js` (`todayKey`) | Soru içi "Hata bildir" → Firestore `questionReports` (create-only rule) + admin listesi |
| Gerekçe | `toISOString()` UTC → TR'de gün 03:00'te dönüyor; gece çalışan öğrencide streak/limit tutarsız | Kullanıcıdan kalite sinyali alınmıyor; 755 açık audit bulgusu önceliklendirilemiyor |
| Etki / Güven / Efor | 3 / 5 / 2 | 4 / 5 / 2 |
| Bağımlılık | Sunucu+istemci aynı anda değişmeli (çift yazım penceresine dikkat) | Rules PR + `test:rules` (H1) |
| Tamamlanma kriteri | 00:30 TR'de çözülen soru aynı güne sayılıyor (test) | Rapor 3 dokunuşta gönderiliyor; haftalık triage takvimi kuruldu |
| Metrik | Streak kırılma şikâyeti / gece-yarısı usage anomalisi | `question_report_submitted` hacmi; rapor→düzeltme süresi |
| Başarısızlık koşulu | Geçiş çift sayıma yol açarsa feature-flag ile geri al | Spam >%50 ise rate-limit ekle |

## Hafta 4 (28 Tem-3 Ağu) — Funnel'ın kırık ortası

| | Görev 4.1 (büyük) |
|---|---|
| Görev | `/coz` cevaplarını kayıt sonrası hesaba taşı: `tusoskop_quiz_result` → `questionHistory` + yanlışlar FSRS kartı olarak seed + dashboard'da "getirdiğin sonuç" kartı |
| Gerekçe | Funnel'dan gelen kullanıcının emeği çöpe gidiyor (CLAUDE.md'de bilinen sınır); ilk oturumda FSRS değeri somutlaşıyor |
| Etki / Güven / Efor | 5 / 4 / 3 |
| Bağımlılık | H2 eventleri (etkiyi ölçmek için), `smartReviewService` API'si |
| Tamamlanma kriteri | `/coz`u bitirip kayıt olan kullanıcının yanlışları ertesi gün tekrar kuyruğunda |
| Metrik | `quiz_import_completed`; `/coz`-kaynaklı kayıtların D1 dönüşü |
| Başarısızlık koşulu | 4 haftada `/coz`-kaynaklı aktivasyonda anlamlı fark yoksa (taban ±%5) yatırımı durdur, Mini TUS'a odaklan |

## Hafta 5-6 (4-17 Ağu) — Onboarding v1

| | Görev 5.1 | Görev 5.2 |
|---|---|---|
| Görev | Kayıt sonrası 3 adım: TUS dönemi seçimi → hedef/kaygı branşı → "bugünkü ilk görevin" ekranı | Sahte leaderboard verisini üretimden kaldır; `seedFakeLeaderboard.mjs`'i deprecate et |
| Gerekçe | Yeni kullanıcı boş dashboard'a düşüyor; aktivasyon tasarlanmamış | Güven riski (Red Team #4); gerçek kullanıcı sayısı arttıkça gereksiz |
| Etki / Güven / Efor | 5 / 4 / 3 | 2 / 5 / 1 |
| Bağımlılık | H2 eventleri | Üretim Firestore erişimi |
| Tamamlanma kriteri | `onboarding_completed` ölçülüyor; atlama (skip) mümkün | Ligde bilinen sahte uid kalmadı |
| Metrik | Onboarding tamamlama ≥%70; D0 ≥10 soru çözen oranı | — |
| Başarısızlık koşulu | Tamamlama <%40 ise adım sayısını 1'e düşür | — |

## Hafta 7-9 (18 Ağu-7 Eyl) — Mini TUS v1 (dönemin ana işi)

| | Görev 7.1 |
|---|---|
| Görev | Mini TUS: `examBlueprints` dağılımından sabit 20 soru; sonuçta `tusScoring.js` çapa tablosuyla **tahmini puan aralığı** + zayıf 3 konu; yüzdelik yalnızca "ilk kullanıcılar arasında" etiketiyle (veri: `results` + yeni `miniTusResults`) |
| Gerekçe | Funnel'ın vaadi bu; "neredeyim?" sorusu 2 numaralı kullanıcı problemi; kalibrasyon verisi moat'un tohumu |
| Etki / Güven / Efor | 5 / 3 / 4 |
| Bağımlılık | Onboarding (H5), taxonomy (H2), `tusScoring.js` (mevcut) |
| Tamamlanma kriteri | Kayıtlı kullanıcı Mini TUS'u uçtan uca tamamlıyor; sonuç dashboard'a işleniyor; tüm `mini_tus_*` eventleri akıyor |
| Metrik | Başlayan→tamamlayan ≥%60; tamamlayan→D1 ≥%40 |
| Başarısızlık koşulu | Tamamlama <%40 → 12 soruya kısalt; yüzdelik güven şikâyeti gelirse aralığı genişlet/etiketi büyüt |

## Hafta 10 (8-14 Eyl) — Funnel bağlantıları + 2. kampanya

| | Görev 10.1 | Görev 10.2 |
|---|---|---|
| Görev | `/coz` sonuç ekranına Mini TUS CTA'sı; PublicHome + branş SEO sayfalarına Mini TUS girişi | 2 yeni `/coz` kampanyası (dahiliye, farmakoloji) — mevcut şablon + kreatif süreciyle |
| Gerekçe | Mini TUS'a trafik bağlanmazsa ölçülemez | Tek kampanya ile kanal öğrenimi olmaz; şablon hazır (CLAUDE.md rehberi) |
| Etki / Güven / Efor | 4 / 4 / 2 | 3 / 4 / 2 |
| Bağımlılık | H7-9 | Meta reklam bütçesi (küçük, günlük min ~47 TL) |
| Tamamlanma kriteri | `mini_tus_cta_click` akıyor | 2 kampanya canlı, ayrı `campaign_code` |
| Metrik | Sonuç→Mini TUS geçişi ≥%20 | Kampanya bazlı landing→kayıt maliyeti |
| Başarısızlık koşulu | <%8 geçiş → CTA metni/konumu deneyi | CPC/kayıt 1. kampanyanın 2 katıysa durdur |

## Hafta 11-12 (15-28 Eyl) — Değer-önce paywall + leaderboard güvenliği

| | Görev 11.1 | Görev 11.2 |
|---|---|---|
| Görev | `LimitReachedModal`'ı kişisel değer özetiyle yeniden yaz (kullanıcının haftalık soru/tekrar sayıları + 3 somut Plus vaadi); `paywall_view` parametreli | Haftalık lig skor yazımını callable'a taşı (istemci doğrudan `weeklyLeaderboard` yazamasın) |
| Gerekçe | Paywall bugün jenerik; monetizasyon değere bağlanmalı | Skor istemciden yazılabiliyor — hile bir tweet uzağında |
| Etki / Güven / Efor | 4 / 3 / 2 | 3 / 5 / 3 |
| Bağımlılık | H2 (`paywall_view`) | Rules değişikliği + `test:rules` |
| Tamamlanma kriteri | Limit anında kişisel özet görünüyor | Rules'ta owner write kapalı; skorlar callable'dan |
| Metrik | `paywall_view→plan_selected` oranı (taban vs yeni) | Anomali skor sayısı = 0 |
| Başarısızlık koşulu | Dönüşüm düşerse eski modala anında dön (iki sürüm de kodda kalsın) | Callable gecikmesi lig UX'ini bozarsa optimistic UI ekle |

## Hafta 13 (29 Eyl-4 Eki) — Konsolidasyon ve karar haftası

- Kod dondurma; Sentry/GA4/kampanya verisiyle 90 gün retrospektifi.
- `DECISION_LOG.md`'ye işlenecek kararlar: Mini TUS soru sayısı, review limiti 10→20 denemesi (bkz. GROWTH_EXPERIMENTS E-03), Dönem 3 push/e-posta sırası, iOS IAP ön araştırması.
- Audit'i güncelle: `npm run quality:questions` (7077 soruyla) → yeni review kuyruğunu triage et.
- Başarı tanımı (90 gün sonu): aktivasyon oranı ölçülüyor ve ≥%25 [VARSAYIM taban]; `/coz`→kayıt→D1 zinciri uçtan uca veri üretiyor; Mini TUS canlı; üretim hataları görünür.
