# Test Sonuçları — Baseline (Hiçbir Değişiklik UYGULANMADI)

_Çalıştırma tarihi: 2026-05-27_

## 1. Çalıştırılan Komutlar

| Komut | Durum | Süre | Not |
|-------|-------|------|-----|
| `npm run validate:questions` | ✅ Geçti | ~1.6s | 5687 soru, 11 ders, 0 hata |
| `npm run audit:questions` | ✅ Geçti | ~50s | 826 finding (0 kritik schema, 755 medium, 71 low — bu rapor için Pediatri batch tarafından üst-tutarlanmıştır) |
| `npm run test` | ⚠️ Kısmen başarısız | ~33s | 32 dosyadan 2'si fail, 296 testten 5'i fail — **soru havuzuyla ilgisiz** |
| `npm run build` | ✅ Geçti | ~1.04s | dist üretildi, chunk size uyarısı (normal, büyük havuz) |

## 2. validate:questions Detayı

```
Question bank validation passed: 5687 questions across 11 subjects.
```

Tüm yapısal kontroller geçti:
- id integer + benzersiz
- ders alanı subjects.js ile birebir eşleşiyor
- manifest subjectCounts ↔ actual count
- options dizi length ≥ 2 (gerçekte hepsi 5)
- correct integer + aralık içinde
- q/exp non-empty string
- diff 1-5 aralığında

## 3. test Detayı

```
Test Files  2 failed | 32 passed (34)
Tests       5 failed | 291 passed (296)
Duration    33.10s
```

### Başarısız testler (soru havuzuyla İLGİSİZ)

1. `src/hooks/useQuestionHistory.test.jsx` — Firestore onSnapshot mock testleri (timeout)
2. `src/services/studyCollectionService.localStorage.test.js` — localStorage JSON parse testleri (timeout/null)

**Bu testler hot-cache + mock setup kaynaklı, soru bankası değişimine bağımlı değil.** Bu audit turunda **soru bankasında HİÇBİR DEĞİŞİKLİK YAPILMADI**, dolayısıyla bu başarısızlıklar audit aksiyonunun sonucu değil — baseline durumudur.

**Aksiyon:** Bu testler ayrı bir issue/PR kapsamında ele alınmalıdır (mock kurulumu iyileştirme).

## 4. build Detayı

✓ built in 1.04s

Chunk size uyarısı (büyük dosyalar):
- `pediatri.js` chunk: 610 kB (191 kB gzip)
- `dahiliye.js` chunk: 715 kB (234 kB gzip)
- Diğer ders chunk'ları 280-500 kB aralığında

Bu chunk boyutları **soru havuzunun zenginliği** nedeniyle normaldir. Bir ders chunk'ı tek sayfa görünümünde yüklenmediğinden runtime performansı etkilemez.

## 5. Soru Havuzu Bütünlüğü (audit:questions Özeti)

`reports/question-bank-quality-audit.json` (tam tarama, audit script):

| Metrik | Değer |
|--------|------:|
| Toplam soru | 5687 |
| Kritik yapısal hata | 0 |
| Orta seviye bulgu | 755 |
| Düşük seviye bulgu | 71 |
| Toplam | 826 (audit script) |

**Bu turda yapılan derin tarama:** Pediatri 5500-5687 batch'inde **93 sistematik wrong-answer şüphesi** ekstra tespit edildi (`master_audit_summary.md` ve `medical_truth_report.md`'de detay).

## 6. Manifest / Count Uyumsuzluğu

`manifest.subjectCounts` ↔ chunk gerçek soru sayısı: **TAM EŞLEŞME (11/11 ders)** ✅

```
Fizyoloji = 528 / 528
Patoloji = 413 / 413
Farmakoloji = 494 / 494
Mikrobiyoloji = 510 / 510
Dahiliye = 678 / 678
Pediatri = 716 / 716
Kadın Hastalıkları ve Doğum = 506 / 506
Küçük Stajlar = 475 / 475
Biyokimya = 440 / 440
Genel Cerrahi = 530 / 530
Anatomi = 397 / 397
```

## 7. Fixed Exam ID Doğrulaması

10 fixed exam (toplam 2000 ID kullanımı):
- Tüm ID'ler havuzda mevcut ✅
- Pediatri 5500-5687 batch ile **0 çakışma** ✅
- setVersion bump gereksinimi: YOK

## 8. Duplicate ID Kontrolü

5687 sorunun tamamı benzersiz ID kullanıyor ✅

## 9. correct Aralığı Kontrolü

Tüm sorularda `correct ∈ [0, 4]` ✅

## 10. options Length Kontrolü

Tüm sorularda `options.length === 5` ✅

## Kalan Riskler

1. **🚨 P0 Pediatri 5500-5687 batch correct-index sistemik hatası** — manuel medikal validatör onayı bekliyor. Build/test/validate açısından "geçerli" görünüyor çünkü yapısal olarak sağlam, sadece içerik anlamı ters. Uygulama yanlış cevap göstermeye **devam ediyor**.
2. **Diff kalibrasyon problemi** — diff=1,2 hiç yok. Uygulama düzeyinde "kolay" filtresi anlamsız.
3. **id 1037 ↔ id 969 near-duplicate** — kullanıcı %93 aynı soruyla iki kez karşılaşma riski.
4. **740 sorunun exp'i sistematik olarak kısa** — pedagojik değer düşük (ama yapısal sorun değil).
5. **2 başarısız test** soru havuzu dışı, ayrı PR'da ele alınmalı.

## Sonuç

`master_audit_summary.md` raporunda detaylandırılan bulgular hariç, soru bankası **production-grade yapısal sağlamlığa** sahip. Build & validate temiz geçiyor. Acil aksiyon **Pediatri batch düzeltmesi** (manuel medikal onay sonrası).
