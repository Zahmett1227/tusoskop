# Option Quality Report — SUBAGENT 5 (OPTION-QUALITY-AUDITOR)

## Özet
- Toplam incelenen soru: 5687
- 5 seçenek uyumu: %100 ✅
- P2 risky_all_none_option: 6
- P3 very_short_option: 24
- P3 very_long_option: 8
- P3 suspicious_option_phrase: 3
- P3 duplicate_option_in_question: 0 (audit script bulgu üretmedi)

## 1. 5 Seçenek Uyumu

Tüm 5687 sorunun `options` dizisi tam 5 eleman içeriyor. **Hiçbir soru 4 veya 6 seçenekli değil.**

## 2. "Tümü/Tümüyle" Risky Çeldiriciler (P2)

6 soruda "hepsi/tümünün kaybolması/tümüyle baskılanması" tarzında mutlak ifadeli çeldiriciler:

| id | ders | konu | sorun seçeneği |
|----|------|------|----------------|
| 2452 | Fizyoloji | Sinir Sistemi HistoFizyolojisi | "Kas iğciklerinin tümünün kaybolması" (çeldirici) |
| 4776 | Fizyoloji | GIS HistoFizyolojisi | "Bikarbonat salınımının tümüyle kaybolması" (çeldirici) |
| 193 | Küçük Stajlar | Anestezi | "...asetilkolin reseptörlerinin tümünün birden açılarak..." (doğru cevap!) |
| 2637 | Genel Cerrahi | Dalak Hastalıkları | "Aşıların tümünü ameliyat sonrası hiç yapmamak" (çeldirici) |
| 3431 | Genel Cerrahi | Şok | "Fibrinolizin tümüyle baskılanması" (çeldirici) |
| 3497 | Genel Cerrahi | Özefagus | "Skuamöz epitelin tümüyle normale dönmesi" (çeldirici) |

**Yorum:** Genel TUS prensibinde "her zaman/asla/tümüyle" gibi mutlak ifadeler genellikle yanlış çeldirici olur ve doğru cevabı ele verir. Yine de id 193'te bu ifade doğru cevap içindeyken kalmış — bu çelişki sorunun çözülebilirliğini düşürüyor.

**Aksiyon önerisi (P2):**
- Çeldirici "tümüyle X kaybolması" yerine daha incelikli yanlış ifadeler tercih edilmeli
- id 193'te doğru cevap "tümünün birden açılması" — bunun yerine "geniş bir alan boyunca açılarak" gibi daha az mutlak ifade öner

## 3. Very Short Option (P3 — 24 bulgu)

24 soruda en az bir seçenek çok kısa (<2 karakter veya tek kelime, anomali). Örnekler audit:questions raporunda mevcut.

Çoğu **liste başlığı** veya **kısa Latince terim** (örn. "EBV", "MHC-I", "ITP") olduğundan genellikle yanlış pozitif. Yine de görsel okunabilirlik için manuel kontrol önerilir.

## 4. Very Long Option (P3 — 8 bulgu)

8 soruda en az bir seçenek >220 karakter. Bunlar **karmaşık mekanizma açıklayan doğru cevap** veya **uzun çeldirici** olabilir.

**Sorun:** TUS sınavında çok uzun seçenek genelde doğru cevaptır (çünkü tüm istisnaları içerir). Bu, sınav stratejisini bilen öğrenciye **avantaj** sağlar.

**Örnek (id 1037 — Mikrobiyoloji/Mikoloji):**
> "Mantarın hayatta kalabilmesi için 'SADECE ÖLÜ DOKUDA (stratum korneum, tırnak, saç)' bulunan spesifik bir yapısal proteini parçalamaya (Kera..."

Bu doğru cevap olarak işaretli ve uzun. **Aksiyon:** Doğru cevabı kısalt VEYA çeldiricileri uzat. Manuel rewrite gerektirir.

## 5. Suspicious Option Phrase (P3 — 3 bulgu)

3 soruda "form" kelimesi ve kısa metin (audit heuristic). Manuel kontrol gerektirir. Düşük öncelik.

## 6. Birden Fazla Doğru / Hiç Doğru Cevap

**Sistematik tarama (Jaccard exp-option):**
- Birden fazla şıkkın exp ile yüksek skorla eşleşmesi (ambiguous_correct): 2 soru (id 5329 ve id 5407 — her ikisi de **yanlıştır** tipi soru, beklenen davranış)
- Hiç doğru cevap yok şüphesi: 0 soru (audit'in `same_question_different_correct` heuristiği 0 tespit)

## 7. Seçenek Aynı Kategoriye Aitlik

Sistematik tarama yapılmadı (heuristik sınırlı). Manuel örneklem incelemesinde (50 soru) seçenekler aynı kategoriye ait (hastalık/mekanizma/ilaç) ve TUS tarzı. Sorun gözlenmedi.

## 8. Negatif Soru Kökü ile Seçenek Karmaşası

"Yanlıştır/değildir" tipi sorularda seçeneklerin kafa karıştırıcı olması riski TUS'ta önemli. Havuzda ~8 tespit edilen negatif kök sorusu var, hepsinde seçenek setleri uygun (mantıksal olarak "biri yanlış 4'ü doğru").

## 9. Seçenek Uzunluk Dengesi

Manuel örneklem 50 soruda doğru cevap seçeneğinin diğerlerine kıyasla anormal uzun/kısa olması: ~%10. Bu **TUS sınav stratejisi** öğretmek için kabul edilebilir bir oran (gerçek TUS'ta da var) ama daha düşük tutulabilir.

## 10. Sonuç

Seçenek kalitesi genel olarak **kabul edilebilir TUS standardı**. Kritik P1 sorunu yok. 6 "tümüyle/hepsi" çeldirici manuel rewrite kuyruğuna alınmalı.

Tam liste: [`all_findings.json`](./all_findings.json) (filter: `agent === "OPTION-QUALITY-AUDITOR"`)
