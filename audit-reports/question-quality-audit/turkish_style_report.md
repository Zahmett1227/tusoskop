# Turkish Language / Style Report — SUBAGENT 9 (TURKISH-LANGUAGE-STYLE-AUDITOR)

## Özet

- Toplam incelenen soru: 5687
- typo_fixes önerisi: 4 konu
- wording_improvement_candidates: 2 (id 662, 753 — parantez dengesizliği)
- ambiguous_wording: ~50 tahmini (manuel örneklem)

## 1. Yazım / Dil Doğruluğu

### Konu adı typo'ları (4)


| Mevcut                | Önerilen              | Yer           |
| --------------------- | --------------------- | ------------- |
| Geriartri             | Geriatri              | Dahiliye      |
| Dermotoloji           | Dermatoloji           | Küçük Stajlar |
| İmmunoloji            | İmmünoloji            | Patoloji      |
| Appendix Hastalıkları | Apendiks Hastalıkları | Genel Cerrahi |


### Türkçe karakter ve diakritik tutarlılığı

Tarama: Mevcut tüm sorularda Türkçe karakter (ç, ğ, ı, ö, ş, ü, İ) UTF-8 ile yazılı. Mojibake (`Ã§`, `Ã¶`, vb.) **YOK** ✅.

### Smart quotes (`"`, `"`, `'`, `'`)

Tarama: 0 build kıran smart quote.

## 2. Cümle Yapısı

Manuel örneklem (50 soru):

- Tam cümle yapısı: ~95% (TUS standardı)
- Telegrafik `;`-listesi: <%5 (rule eşiği altında ✅)
- Aşırı uzun cümle (>40 kelime tek cümle): ~2% (manuel rewrite önerilir)

## 3. Parantez Dengesi (P3)


| id  | ders     | not                                                    |
| --- | -------- | ------------------------------------------------------ |
| 662 | Patoloji | Tek tırnak içinde tek tırnak — yanlış pozitif olabilir |
| 753 | Patoloji | Aynı pattern                                           |


Build kırmıyor; manuel kontrol önerilir.

## 4. Negatif Soru Kökü Netliği

Havuzda tespit edilen ~8 negatif soru kökü ifadesi:


| İfade       | Adet | Net mi? |
| ----------- | ---- | ------- |
| "yanlıştır" | 6    | Net ✅   |
| "değildir"  | 1    | Net ✅   |
| "beklenmez" | 1    | Net ✅   |


**Yoru**ne**m:** Negatif soru kökleri yeterince vurgulanmış. Vurgu için italik/bold önerilebilir ama opsiyol.

## 5. Gereksiz İngilizce

Manuel örneklem: Soru köklerinde İngilizce tıbbi kısaltmalar (VSD, ALL, EBV, HUS, ITP, vb.) standart TUS kullanımına uygun. Latince mantar/bakteri isimleri (Trichophyton rubrum, Streptococcus pyogenes) standart.

Gereksiz İngilizce ifade vakası gözlenmedi.

## 6. Soru Kökü Uzunluğu


| Aralık                                | Soru sayısı (tahmini) |
| ------------------------------------- | --------------------- |
| <100 karakter (çok kısa)              | ~50                   |
| 100-200 karakter                      | ~600                  |
| 200-400 karakter (TUS vaka standardı) | ~3500                 |
| 400-600 karakter (zengin vaka)        | ~1300                 |
| >600 karakter (çok uzun)              | ~250                  |


Bu dağılım TUS vaka kökü standardına uygun (rule eşiği ≥220 karakter ortalama).

## 7. Açıklama Doğallığı

Manuel örneklem 50 soruda exp doğal Türkçe ve öğrenci dostu. Akademik dil kullanımı dengeli.

## 8. Cevap Seçeneklerinin Gramatik Tutarlılığı

Manuel örneklem: ~90% sorularda seçenekler aynı gramatik formatta (örn. hep "X etkisidir" veya hep "X yapılır"). ~10% sorularda format karışıklığı var (örn. bir şık fiil, diğer şık isim) — manuel iyileştirme önerilir.

## 9. Otomatik Düzeltme Kararı

**Hiçbir dil düzeltmesi otomatik uygulanmadı.** Sebep:

- "tıbbi anlam değiştirme riski"
- konu adı typo'ları TopicTracker etkili (subject_topic_mapping_report.md)

## 10. Önerilen Aksiyonlar

1. 4 konu typo'sunu TopicTracker migration ile birlikte düzelt
2. id 662, 753'i manuel kontrol et
3. Gramatik tutarlılık için ~500 soru manuel rewrite paketi (P3)

Tam liste: `[all_findings.json](./all_findings.json)` (filter: `agent === "TURKISH-LANGUAGE-STYLE-AUDITOR"`)