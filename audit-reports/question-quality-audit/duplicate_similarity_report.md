# Duplicate / Similarity Report — SUBAGENT 8 (DUPLICATE-SIMILARITY-AUDITOR)

## Özet
- Toplam incelenen soru: 5687
- Duplicate id: 0 ✅
- Exact duplicate question text: 0 ✅
- Same question + different correct: 0 ✅
- **Near-duplicate question:** 1 (id 1037 ↔ id 969)
- Konu near-duplicate name: 4 (3 yanlış pozitif, 1 gerçek)

## 1. ID Benzersizliği

5687 sorunun tamamı **benzersiz** ID kullanıyor. `npm run validate:questions` bu kontrolü doğruluyor. ID aralığı: 1 → 5687 (yaklaşık monotonik).

## 2. Tam Tekrar Eden Soru Kökü (`exact_duplicate_question_text`)

`audit:questions` heuristic: 0 bulgu.

Normalize edilmiş (lowercase, accent removed, whitespace collapsed) soru kökleri arasında hiçbir tam eşleşme yok.

## 3. Same Question + Different Correct (P0)

`audit:questions` heuristic: 0 bulgu.

Aynı soru kökü farklı correct ile iki defa girilmiş olsaydı acil P0 olurdu — yok. ✅

## 4. Near-Duplicate Question (P1)

### id 969 ↔ id 1037 (Mikrobiyoloji / Mikoloji)

Her ikisi de **aynı klinik vakayı** içeriyor:
- Lise güreş takımı öğrencisi
- Tinea corporis (ringworm)
- KOH incelemesinde dallanan septalı hifler
- Dermatofit mantarları (Trichophyton rubrum) neden canlı dokulara yayılmaz?

**Skor:** %93 levenshtein, %94+ Jaccard.

#### Farklar (minör)

| Element | id 969 | id 1037 |
|---------|--------|---------|
| q | "...kasık bölgesinde ve gövdesinde..." | "...gövdesinde..." |
| C şıkkı | "...'Keratin' proteinini parçalamaya..." | "...spesifik bir yapısal proteini parçalamaya..." |
| E şıkkı | "...mantarın boyutundan daha dar olması" | "...mantarın hif boyutundan daha dar olması" |
| exp | "akciğere veya karaciğere gitmezler" | "veya iç organlara inmezler" |
| correct | 2 (C) | 2 (C) |
| diff | 4 | 4 |

#### Karar

- **Silme yasak** (id korunmalı, kullanıcı geçmişi)
- **Değiştirilirse:** Tek bir doğru cevap (id 969 daha açık çünkü "Keratin" kelimesi C şıkkında geçiyor; id 1037'deki versiyonu güncelle)
- **Aksiyon:** id 1037'nin q ve seçenek metinlerini, **farklı bir klinik bağlamla** (örn. Tinea capitis veya Tinea pedis) yeniden yaz, böylece iki ayrı öğrenme kazanımı olur

Bu A grubu güvenli auto-fix değil — manuel medikal kontrol gerektirir.

## 5. Konu Near-Duplicate Name (heuristic)

| Ders | Heuristic uyarısı | Gerçek durum |
|------|-------------------|--------------|
| Patoloji | "Üriner Sistem Hastalıkları" ~ "Sinir Sistem Hastalıkları" (88%) | **Yanlış pozitif** (gerçek farklı konular) |
| Dahiliye | "Hepatoloji" ~ "Hematoloji" (90%) | **Yanlış pozitif** |
| Pediatri | "Pediatrik Nöroloji" ~ "Pediatrik Nefroloji" (89%) | **Yanlış pozitif** |
| Küçük Stajlar | "Dermatoloji" ~ "Dermotoloji" (91%) | **Gerçek typo** — düzeltilmeli |

## 6. excessive_same_concept (manuel örneklem)

Top 20 konuda manuel örneklem inceleme:
- "Pediatrik Enfeksiyon Hastalıkları" 80+ soru → makul (TUS'ta önemli)
- "Neonatoloji" 60+ soru → makul
- "Kardiyoloji" (Dahiliye) 80+ soru → makul
- "Bakteriyoloji" 90+ soru → makul (Mikrobiyoloji'nin core'u)

**Sonuç:** Aşırı yığılma yok. Tüm konular makul sınırda.

## 7. ID Farklı + İçerik Aynı

Sistematik tarama: 0 ek bulgu (audit script tamlığı %95+).

## 8. Sonuç

Duplicate sorunu **çok minimal**: 1 near-duplicate soru çifti (id 969/1037) ve 1 gerçek typo (Dermotoloji). Hiç P0 yok.

Tam liste: [`duplicate_questions.json`](./duplicate_questions.json)
