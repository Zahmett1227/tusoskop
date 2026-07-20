# Karar Kaydı

> Format: ID, tarih, karar, gerekçe, alternatifler, geri alma koşulu. Geri dönüşü zor her karar
> buraya yazılmadan uygulanmaz (PRODUCT_PRINCIPLES #11). Geçmiş kararlar repo kanıtından geriye
> dönük derlendi; ileriye dönük açık kararlar "AÇIK" işaretli.

## Verilmiş kararlar (repo kanıtından derlenen)

| ID | Tarih | Karar | Gerekçe / Kanıt |
|----|-------|-------|------------------|
| D-001 | ~2026-05 | Shopify kaldırıldı, ödeme PayTR iFrame'e taşındı; fiyat tek otoritesi sunucu tablosu | CLAUDE.md + `functions/paytr.js`. Geri alma: PayTR operasyonel sorun çıkarırsa iyzico benzeri alternatif — istemci fiyat göndermeme ilkesi değişmez. |
| D-002 | ~2026-05 | FSRS tek zamanlama otoritesi; `wrongQuestions`/`favoriteQuestions` yalnızca analitik | CLAUDE.md, `smartReviewScheduler.js`. |
| D-003 | ~2026-06 | SEO için framework değişimi yerine mevcut Vite + statik prerender üç katmanı | `SEO_MIGRATION_PLAN.md` karşılaştırması; commit `d089df2` ve devamı. |
| D-004 | ~2026-06 | `/coz` funnel'ı ağır app'ten izole, sorular statik bundle'da, Firestore public read yok | commit `8ac2146`; ana bankanın korunması. |
| D-005 | ~2026-06 | Meta Pixel yalnızca env'den, backend-onaylı Purchase, StartTrial bilinçli yok | `src/lib/metaPixel.js`, CLAUDE.md. |
| D-006 | 2026-07-06 | 18-24 aylık plan kabul edildi: NSM = Weekly Committed Reviewers; öncelik zinciri güvenilirlik→ölçüm→aktivasyon→retention→monetizasyon→ölçeklenme; aynı anda ≤2 iş akışı | Bu plan seti (`MASTER_PLAN_2026_2028.md`). Geri alma: 90 gün retrospektifinde NSM ölçülemiyorsa metrik revize edilir. |

## Açık kararlar (sahibi: kurucu)

| ID | Son tarih | Karar sorusu | Seçenekler / öneri |
|----|-----------|--------------|---------------------|
| D-007 | Dönem 4 başı (2027 Şub) | iOS monetizasyonu: IAP mi, iOS'ta satın alma yüzeyinin tamamen gizlenmesi mi? | Öneri: iOS DAU/web DAU ve Plus dönüşüm verisiyle karar; o zamana dek iOS'ta ödeme görünmez (Apple 3.1.1). Veri yoksa varsayılan: gizle. |
| D-008 | 90g H13 (2026 Eki) | Mini TUS soru sayısı 20'de mi kalsın? | E-02 deney sonucuna göre (tamamlama <%40 → 12). |
| D-009 | 90g H13 | Free tekrar limiti 10→20 denemesi başlasın mı? | E-03; koruma metriği Plus dönüşümü. |
| D-010 | Dönem 3 başı (2026 Eki) | Geri çağırma kanalı sırası: önce push mu e-posta mı? | Öneri: önce e-posta (izin engeli yok, win-back'in de ön koşulu), 4-6 hafta sonra push. |
| D-011 | Dönem 3 | Sahte lig verisi temizliği sonrası boş lig sorunu nasıl çözülür? | Öneri: lig, haftalık ≥50 gerçek aktif kullanıcıya ulaşmayan kohortlarda "kendi rekorunla yarış" moduna düşer — sahte kullanıcı asla (DO_NOT_BUILD). |
| D-012 | Dönem 5 | Android'e çıkılacak mı? | DO_NOT_BUILD koşulu: Android web DAU > iOS DAU ve retention hedefte. |

## Karar şablonu (yeniler için)

```
| D-0XX | YYYY-MM-DD | Karar cümlesi | Gerekçe (veri/link). Alternatifler: A, B. Geri alma koşulu: ... |
```
