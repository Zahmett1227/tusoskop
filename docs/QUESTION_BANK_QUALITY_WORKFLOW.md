# Soru Bankası Kalite İş Akışı

Bu akışın amacı soru bankasına eklenen veya değiştirilen soruları üç kapıdan geçirmek:
format doğrulama, otomatik kalite denetimi ve manuel/uzman kontrolü.

## Komutlar

| Komut | Ne yapar |
|-------|----------|
| `npm run validate:questions` | Bloklayıcı format kapısı: id, ders, seçenekler, correct index ve manifest sayıları |
| `npm run audit:questions` | Heuristik kalite raporu üretir: `reports/question-bank-quality-audit.md/json` |
| `npm run review:questions` | Audit çıktısından manuel kontrol kuyruğu üretir: `reports/question-bank-review-queue.md/json` |
| `npm run quality:questions` | Üç adımı sırayla çalıştırır |

## Standart Süreç

1. Yeni soru eklemeden önce mevcut son id ve manifest sayısını kontrol et.
2. Soruları ilgili `src/data/questionChunks/*.js` dosyasına ekle.
3. `src/data/questionChunks/_manifest.json` içindeki ders sayısını güncelle.
4. `npm run quality:questions` çalıştır.
5. `reports/question-bank-review-queue.md` dosyasındaki öncelikli satırları incele.
6. Kritik bulgu varsa önce onu kapat; orta bulguları uzman kontrolüne taşı.
7. Düzeltme sonrası `npm run quality:questions` komutunu tekrar çalıştır.

## Manuel Kontrol Kararları

| Karar | Anlamı |
|-------|--------|
| `fix` | Soru, seçenek veya açıklama düzeltilmeli |
| `false_positive` | Otomatik audit yanılmış; soru olduğu gibi kalabilir |
| `needs_physician` | Tıbbi doğruluk için doktor/uzman onayı gerekir |
| `accepted_as_is` | Kontrol edildi, değişiklik gerekmiyor |

## Merge Kapıları

- `validate:questions` hata veriyorsa merge edilmez.
- Kritik audit bulguları açık kalıyorsa merge edilmez.
- Correct cevabı veya tıbbi açıklamayı etkileyen değişiklikler uzman onayı olmadan merge edilmez.
- Audit raporları soru içeriğini otomatik değiştirmez; sadece karar desteği üretir.

## Raporlar

- `reports/question-bank-quality-audit.md`: genel kalite özeti ve problem dağılımı.
- `reports/question-bank-quality-audit.json`: tam makine-okunur bulgu listesi.
- `reports/question-bank-review-queue.md`: manuel kontrol için öncelikli çalışma listesi.
- `reports/question-bank-review-queue.json`: aynı kuyruğun makine-okunur hali.

## Notlar

Otomatik audit tıbbi doğruluk iddiası taşımaz. Özellikle açıklama-cevap uyumu,
terminoloji ve doğru cevap şüphesi doktor/uzman kontrolüne bırakılır.
