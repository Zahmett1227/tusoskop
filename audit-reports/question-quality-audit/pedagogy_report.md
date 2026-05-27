# Pedagogy / Learning Value Report — SUBAGENT 13 (PEDAGOGY-LEARNING-AUDITOR)

## Özet
- Toplam incelenen soru: 5687
- high_learning_value_questions (örneklem tahmini): ~%50 (vaka kökü güçlü, exp mekanizma açıklıyor)
- low_learning_value_questions: 93 Pediatri batch hatası (öğrenciye yanlış öğretiyor)
- mnemonic_opportunities (örneklem tahmini): ~%15-20

## 1. Vaka Tabanlı Öğrenme Değeri

Havuzun vaka kökleri TUS standardının üzerinde:
- Ortalama uzunluk: ~280+ karakter
- Demografi + öykü + muayene + tetkik + mekanizma sorgusu yapısı yaygın
- Klinik akıl yürütme öğretme amacı net

**Örnek (id 5559):** TCA intoksikasyonu vakası, EKG bulguları, tedavi mantığı sorgulaması. Öğretici. Ancak correct index hatalı.

## 2. Açıklamada Yanlış Seçenek Ayrımı

`audit:questions` heuristic'i 740 sorunun exp'inin doğru şık metnini "zayıf" içerdiğini tespit etti. Manuel örneklem (12 soru):
- ~%60 yanlış pozitif (eşdeğer ifadeyle doğru cevap destekleniyor)
- ~%40 gerçekten kısa exp (yanlış seçenekleri ayırmıyor)

**Sistematik pedagojik zayıflık:** Çoğu exp doğru cevabı **tek cümleyle** açıklıyor ama yanlış seçeneklerin **neden yanlış** olduğunu **belirtmiyor**.

### Örnek (id 4778 — Fizyoloji)

- correct=C: "Atım hacminin azalması ve diyastol sonu hacmin artma eğilimi"
- exp (106 karakter): "Afterload artışı ventrikülün kanı boşaltmasını zorlaştırır; atım hacmi azalır ve rezidüel hacim artabilir."

Bu exp doğru cevabı destekliyor ama:
- D ve E neden yanlış? exp'te yok
- A "Stroke volume increase" yanlış değil mi? exp'te tartışılmıyor
- Tuzak hangisi? exp'te yok

**Aksiyon (P2):** exp +1-2 cümle eklenerek yanlış seçenek ayrımı sağlanabilir.

## 3. Ezber vs Kavrama

Manuel örneklem 50 soruda:
- Mekanizma sorgusu: ~70% ✅
- Klinik akıl yürütme: ~60%
- Saf ezber (örn. "X hastalığının etkeni Y'dir"): ~20%
- Trivia / değersiz ayrıntı: ~5%

TUS odaklı pedagojik yaklaşım için **iyi denge**.

## 4. Mnemonik / Tablo Fırsatları

Manuel örneklem: ~%15 soruda mnemonik veya tablo eklenmesi öğrenmeyi belirgin artırır:

| id | konu | öneri |
|----|------|-------|
| 4112 | Tanı testleri | "SNOUT / SPIN" mnemoniği zaten var ✅ |
| 5587 | Pediatrik Nöroloji (BRE) | Epilepsi sendromu özet tablosu |
| 5639 | Pediatrik Endokrin | Cushing tanı algoritması mini şema |
| 5546 | Neonatal menenjit | "Ampi + sefotaksim" akronim |

## 5. Tuzak Bilgisi Açıklaması

Manuel örneklem 50 soruda "TUS'ta tuzak şu" tarzında ipucu içeren exp oranı ~%10. Bu oran düşük — pedagojik olarak yükseltilebilir.

## 6. Klinik Vaka Verisi Yeterliliği

Manuel örneklem klinik vakalarda demografi + tetkik + bulgu **çoğunlukla yeterli** (~%85). Eksik veri sorunu nadir.

## 7. low_learning_value_questions (P0 nedenli)

Pediatri 5500-5687 batch'inin 93 sorusu **negatif öğrenme değerine** sahip çünkü öğrenciye yanlış cevap vererek yanlış klinik akıl yürütme öğretiyor. Bu soruların düzeltilmesi pedagojik olarak en yüksek ROI'lu işlem.

## 8. Sonuç

Pedagojik tasarım **genel olarak güçlü**. İki sistematik iyileştirme alanı:
1. exp'lerde yanlış seçenek ayrımı eklenmesi (~300-500 soru)
2. Mnemonik/tablo eklenmesi (~100-200 soru)

İlk olarak Pediatri batch düzeltmesi yapılmalı (P0).

Tam veri: [`all_findings.json`](./all_findings.json)
