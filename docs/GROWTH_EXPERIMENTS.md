# Büyüme Deney Kaydı

> Format: her deneyin hipotezi, birincil metriği, minimum örneklem/süresi ve **vazgeçme kriteri** zorunlu.
> Aynı anda en fazla 2 aktif deney (tek kurucu; trafik düşükken paralel deney gürültü üretir).
> Sonuçlanan deney `DECISION_LOG.md`'ye karar olarak işlenir.

## Aktif / Sıradaki

### E-01 — /coz cevaplarının hesaba taşınması (90g H4)
- **Hipotez:** Funnel'da çözülen soruların kayıt sonrası hesaba aktarılması, `/coz`-kaynaklı kullanıcının D1 dönüşünü artırır (emek kaybı ortadan kalkar, FSRS ilk günden kişisel).
- **Birincil metrik:** `/coz`-kaynaklı kayıtların D1 dönüş oranı.
- **Ölçüm:** `quiz_import_completed` işaretli kohort vs önceki 4 haftalık taban.
- **Süre/örneklem:** 4 hafta veya ≥200 `/coz`-kaynaklı kayıt.
- **Vazgeçme:** Taban ±%5 içinde fark yoksa özellik kalır (zararı yok) ama bu yönde ek yatırım durur.

### E-02 — Mini TUS uzunluğu: 20 vs 12 soru
- **Hipotez:** 20 soru kalibrasyon güveni verir ama tamamlama oranını düşürür; 12 soru yeterli sinyalle daha yüksek tamamlama sağlar.
- **Birincil metrik:** `mini_tus_complete / mini_tus_start`; ikincil: D1 dönüş.
- **Sıra:** Önce 20 ile başla (v1 tek varyant); tamamlama <%40 ise 12'ye düşür (ardışık deney, A/B değil — trafik yetmez).
- **Vazgeçme:** 12 soruda da tamamlama <%40 ise sorun uzunluk değil değer vaadi — sonuç ekranını yeniden tasarla.

### E-03 — Free tekrar limiti 10 → 20
- **Hipotez:** Tekrar limiti FSRS alışkanlığını boğuyor; 20'ye çıkarmak W4 retention'ı artırır ve Plus dönüşümünü düşürmez (aha-anı yaşayan kullanıcı daha kolay öder).
- **Birincil metrik:** W4 tekrar retention; koruma metriği: `paywall_view→purchase`.
- **Ölçüm:** Değişiklik öncesi/sonrası 6'şar haftalık kohort kıyası.
- **Vazgeçme:** Dönüşüm göreli -%15'ten fazla düşerse 10'a geri dön.

### E-04 — Değer-önce paywall (90g H11)
- **Hipotez:** Limit modalında kullanıcının kendi haftalık istatistikleri + 3 somut vaat, jenerik "limit doldu" mesajından daha yüksek `plan_selected` üretir.
- **Birincil metrik:** `paywall_view→plan_selected`.
- **Vazgeçme:** 4 haftada fark yok/negatifse eski modala dön (iki sürüm kodda tutulur).

## Backlog (sıraya girecek)

| ID | Deney | Hipotez özeti | Birincil metrik | Vazgeçme kriteri |
|----|-------|---------------|-----------------|------------------|
| E-05 | /coz kampanya çeşitliliği (4 branş) | Branş bazlı mesaj eşleşmesi CPA'yı düşürür | Kampanya başına kayıt maliyeti | Yeni kampanya CPA'sı mevcutun 2 katıysa o branşı durdur |
| E-06 | Mini TUS'u kayıtsız başlat, 10. soruda kayıt iste | Kayıt duvarını değere yaklaştırmak dönüşümü artırır | Landing→tamamlanan kayıt | Yarıda bırakma >%50 ise önce-kayıt'a dön |
| E-07 | Sonuç ekranında yüzdelik aralık vs tek sayı | Aralık güven verir, paylaşım tek sayıyla artar | `mini_tus_share_click` + şikâyet sinyali | Clarity'de sonuç ekranı rage-click artarsa değiştir |
| E-08 | Push kopyası: due sayısı vs streak koruması (Dönem 3) | Kayıp korkusu (streak) daha yüksek açılım | `notification_open` | Opt-out oranı >%10/ay ise frekans/kopya değiştir |
| E-09 | 12 aylık plan fiyat noktası (599 vs 649 TL) | Ay-başı fiyat kırılımı uzun planı seçtirir | 12 aylık planın satış payı | 8 haftada satışların <%10'u ise fiyatı/konumu değiştir |
| E-10 | Aktivasyon sonrası 7 günlük "Plus haftası" | Değeri yaşamak ödemeyi artırır | Trial kohortunun 30 gün içinde satın alması ≥%8 | <%3 ise kaldır (bedava alışkanlığı riski) |
| E-11 | Haftalık e-posta raporu (Dönem 3) | Kişisel rapor W4 retention'ı artırır | E-posta kohortu W4 retention farkı | Açılma <%15 ise içerik değişmeden frekans denenmez, içerik yeniden yazılır |

## Deney Hijyeni

- Trafik gerçeği: düşük hacimde çoğu deney **ardışık (before/after)** yürür, A/B ancak haftalık ≥1000 ilgili event varsa.
- Her deney başlamadan taban (baseline) 2 hafta ölçülür; taban yoksa deney başlamaz.
- Sonuç ne olursa olsun `DECISION_LOG.md`'ye yazılır — "kaybedilen" deney de bilgidir.
