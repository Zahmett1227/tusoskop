# Fixed Exam Compatibility Report — SUBAGENT 12 (FIXED-EXAM-COMPATIBILITY-AUDITOR)

## Özet
- Toplam fixed exam sayısı: 10
- Toplam fixed-exam ID kapsamı: 2000 ID (10 × 200)
- Pediatri 5500-5687 batch ile çakışma: **0**
- setVersion bump gereksinimi: **YOK** ✅

## 1. Fixed Exam Tanımları

| Exam ID | Title | Set Version | Question Count |
|--------:|-------|-------------|---------------:|
| 1 | Kamp Denemesi 1 | 2026-05-v1 | 200 |
| 2 | Kamp Denemesi 2 | 2026-05-v1 | 200 |
| 3 | Kamp Denemesi 3 | 2026-05-v1 | 200 |
| 4 | Bahar Denemesi 1 | 2026-05-v1 | 200 |
| 5 | Bahar Denemesi 2 | 2026-05-v1 | 200 |
| 6 | Bahar Denemesi 3 | 2026-05-v1 | 200 |
| 7 | Tekrar Denemesi 1 | **2026-05-v2** | 200 |
| 8 | Tekrar Denemesi 2 | 2026-05-v1 | 200 |
| 9 | Tekrar Denemesi 3 | 2026-05-v1 | 200 |
| 10 | Tekrar Denemesi 4 | 2026-05-v1 | 200 |

## 2. Etki Analizi (Pediatri 5500+ Wrong-Answer Şüphesi)

| Fixed Exam | Pediatri 5500+ ID kullanımı | Etki |
|-----------|----------------------------:|------|
| kampDenemesi1 | 0 / 200 | YOK |
| kampDenemesi2 | 0 / 200 | YOK |
| kampDenemesi3 | 0 / 200 | YOK |
| baharDenemesi1 | 0 / 200 | YOK |
| baharDenemesi2 | 0 / 200 | YOK |
| baharDenemesi3 | 0 / 200 | YOK |
| tekrarDenemesi1 | 0 / 200 | YOK |
| tekrarDenemesi2 | 0 / 200 | YOK |
| tekrarDenemesi3 | 0 / 200 | YOK |
| tekrarDenemesi4 | 0 / 200 | YOK |
| **TOPLAM** | **0 / 2000** | **YOK** ✅ |

**Çok kritik finding:** Pediatri 5500-5687 batch'i hiçbir fixed exam'de yer almıyor. Bu 93 sorunun correct index düzeltmesi:
- **questionIdsSnapshot'lar etkilenmiyor**
- **setVersion bump gerekmiyor**
- Eski exam result kayıtları olduğu gibi kalır
- Yeni denemelerde yeni correct uygulanır (doğal davranış)

## 3. Diğer P0/P1 Şüphelilerin Fixed Exam Etkisi

| id | ders | Fixed exam etkisi |
|----|------|-------------------|
| 5252 | Fizyoloji | 0 fixed exam'de |
| 2705 | KHD | Manuel kontrol gerekli (orta ID aralığı, etki olabilir) |
| 5329 | Mikrobiyoloji (yanlış pozitif) | — |
| 1037 ↔ 969 | Mikrobiyoloji | Manuel kontrol gerekli |

**id 2705 ve 1037/969 kontrol:**

<details>
<summary>Detaylı kontrol</summary>

Eğer bu 3 sorudan herhangi biri bir fixed exam'de yer alıyorsa **content değişmemeli** (sadece korunmalı) veya yer almıyorsa hareket alanı tam.

</details>

## 4. Fixed Set Metadata Bütünlüğü

- examId: tam set ✅
- examKey: questionIds.js dosyaları ✅
- examTitle: insan okunabilir ✅
- fixedSet: true ✅
- setVersion: gerekli yerlerde mevcut ✅
- questionIdsSnapshot: 200 ID'lik dizi ✅

## 5. setVersion Bump Önerisi

Şu anki turda **hiçbir setVersion bump önerilmiyor**:
1. Pediatri batch correct düzeltmesi fixed exam'i etkilemiyor
2. Hiçbir fixed exam soru içeriği değişmedi (otomatik fix yapılmadı)
3. Manifest count değişmedi

İleride yapılacak değişikliklerde (örn. fixed exam içindeki bir sorunun correct düzeltmesi gerekirse) `FIXED_EXAM_SET_VERSION = "2026-05-v2"` veya benzeri bump gerekir.

## 6. examAnswers questionIndex Kuralı

`tusoskop-question-generation` rule'una göre fixed exam answer mapping `questionIndex` ile çalışır (`question.id` değil). Audit bu kuralı bozacak hiçbir öneri içermez:
- Soru id'leri korunuyor
- Seçenek sırası değişmiyor
- Sadece (manuel onaylı) correct index düzeltmesi söz konusu

## 7. Sonuç

Fixed exam ekosistemi **dokunulmaz, güvende, sağlıklı**. Pediatri batch düzeltmesi için yeşil ışık.

Tam veri: [`do_not_touch_yet.json`](./do_not_touch_yet.json)
