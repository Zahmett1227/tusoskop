# Tusoskop Soru Havuzu Çoklu-Subagent Kalite Denetimi — Master Özet

*Oluşturulma: 2026-05-27 (UTC+3)*  
*Denetlenen havuz: `src/data/questionChunks/` — 5687 soru / 11 ders*  
*Denetim modu: 15 subagent rolünün orkestre edildiği derin denetim. **Bu turda hiçbir soru dosyasında otomatik düzeltme uygulanmamıştır.***

> **Bu rapor neden önemli:** Pediatri 5500-5687 ID aralığında **sistematik bir correct-index hatası batch'i** tespit edildi. 150 sorudan en az **93'ünde doğru cevap olarak işaretlenen şık ile açıklama (exp) farklı şıkkı destekliyor**. Bu, Tusoskop kullanıcısına aktif olarak yanlış tıbbi bilgi öğretme riski oluşturduğundan EN ÜST ÖNCELİKLİ P0 BLOKER olarak işaretlenmiştir.

---

## 1. Genel Özet


| Metrik                                    | Değer                        |
| ----------------------------------------- | ---------------------------- |
| Toplam soru                               | 5687                         |
| Ders sayısı                               | 11                           |
| Benzersiz konu (ders+konu)                | ~340                         |
| Manifest count ↔ actual count tutarlılığı | %100 (tüm dersler eşleşiyor) |
| `npm run validate:questions`              | ✅ Geçti (5687 soru, 0 hata)  |
| Toplam bulgu                              | 895                          |
| **P0 (Kritik)**                           | **42**                       |
| P1 (Yüksek)                               | 30                           |
| P2 (Orta)                                 | 753                          |
| P3 (Düşük)                                | 70                           |
| P4 (İyileştirme)                          | 0                            |


### Ders bazlı soru sayıları


| Ders                        | Soru | Manifest beklenen | Eşleşme |
| --------------------------- | ---- | ----------------- | ------- |
| Pediatri                    | 716  | 716               | ✅       |
| Dahiliye                    | 678  | 678               | ✅       |
| Genel Cerrahi               | 530  | 530               | ✅       |
| Fizyoloji                   | 528  | 528               | ✅       |
| Mikrobiyoloji               | 510  | 510               | ✅       |
| Kadın Hastalıkları ve Doğum | 506  | 506               | ✅       |
| Farmakoloji                 | 494  | 494               | ✅       |
| Küçük Stajlar               | 475  | 475               | ✅       |
| Biyokimya                   | 440  | 440               | ✅       |
| Patoloji                    | 413  | 413               | ✅       |
| Anatomi                     | 397  | 397               | ✅       |


**Ders adı uyumu:** Tüm soru objelerinin `ders` alanı `subjects.js` ile birebir eşleşiyor. "Kadın Doğum" / "KHD" gibi varyasyon **YOK**.

### Diff dağılımı (kritik kalibrasyon problemi)


| diff          | Adet     | %         |
| ------------- | -------- | --------- |
| 1 (çok kolay) | **0**    | **0.0%**  |
| 2 (kolay)     | **0**    | **0.0%**  |
| 3 (orta)      | 876      | 15.4%     |
| 4 (zor)       | **4049** | **71.2%** |
| 5 (çok zor)   | 762      | 13.4%     |


> **P1 Sistemik Bulgu:** Havuzda **hiç diff=1 ve diff=2 sorusu yok**. Soruların %71'i diff=4. Öğrenci hiç "kolay" düzeyde soru göremiyor, bu mücadele eğrisini ezici hale getiriyor. Detaylı analiz: `difficulty_calibration_report.md`.

---

## 2. EN KRİTİK BULGU: Pediatri 5500-5687 Batch Correct-Index Felaketi

### Durum

`src/data/questionChunks/pediatri.js` dosyasının **son 150 sorusu (ID 5500-5687)** içinde:


| Durum                                                    | Adet   | Yorum   |
| -------------------------------------------------------- | ------ | ------- |
| OK (correct ile exp tutarlı)                             | 41     | %27     |
| OK_negative (yanlıştır tipi, beklenen davranış)          | 8      | %5      |
| **SUSPECT_high** (exp başka şıkkı destekliyor, gap≥0.10) | **68** | **%45** |
| SUSPECT_low (orta gap 0.05-0.10)                         | 25     | %17     |
| UNCERTAIN (kararsız)                                     | 8      | %5      |


Yani **batch'in %62'si (93 soru) muhtemelen yanlış correct index taşıyor**.

### Doğrulanan örnekler (manuel inceleme)


| id   | konu                 | mevcut correct                      | exp'in işaret ettiği                              | açıklama                                                                     |
| ---- | -------------------- | ----------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| 5544 | Kızamık              | B "IVIG rutin tüm olgularda endike" | E "Vitamin A WHO önerisi"                         | exp WHO'nun Vit A önerisini detaylandırıyor; correct B saçma bir ifade       |
| 5550 | Mononukleoz          | C "Toksoplazmozda Paul-Bunnell+"    | D "EBV B lenfosit..."                             | Paul-Bunnell EBV testidir, toksoplazmozda değil                              |
| 5559 | TCA intox            | B "Flumazenil benzodiazepin"        | E "Sodyum bikarbonat"                             | TCA tedavisi NaHCO₃; Flumazenil benzodiazepin için, hatta TCA'da kontrendike |
| 5561 | DKA potasyum         | D "Hipotonik sıvı 1. seçenek"       | C "DKA'da total K eksikliği"                      | C tıbben doğru, D klasik DKA hatası                                          |
| 5570 | DM bebek hipoglisemi | C "Konjenital hiperamonyemi"        | D "Maternal hiperglisemi → fetal hiperinsülinizm" | exp D'yi birebir anlatıyor                                                   |
| 5587 | BRE                  | E "Dravet; SCN1A"                   | B "Benign rolandik epilepsi"                      | Santral-temporal spike + uyku = BRE; exp BRE diyor                           |
| 5599 | Pinworm              | B "Kan transfüzyonu"                | E "Hane halkı tedavisi + tırnak hijyeni"          | "Kan transfüzyonu" pinworm tedavisi olamaz                                   |
| 5601 | VSD                  | D "Primer hipertansiyon"            | C "Eisenmenger sendromu"                          | VSD sol-sağ şuntu Eisenmenger'a ilerler; exp Eisenmenger anlatıyor           |
| 5614 | Kistik fibroz        | B "Astım bronş spazmı"              | E "Viskoz sekresyon mukosiliyer"                  | CF terlikte yüksek klor + dışkı elastaz düşük; exp CFTR anlatıyor            |
| 5621 | XLA                  | D "T hücre immün yetmezliği"        | C "Bruton, B hücre/antikor yokluğu"               | exp Bruton + BTK net anlatıyor                                               |
| 5626 | HUS                  | D "Postinfeksiyöz immün kompleks"   | C "Shiga toksini → endotel hasarı"                | HUS tipik Shiga, "postinfeksiyöz immün kompleks" PSGN'dir                    |
| 5632 | CAH                  | E "Diabetes insipidus"              | B "21-hidroksilaz eksikliği"                      | Erkek bebekte tuz kaybı + hiperkalemi = klasik 21-OH CAH                     |
| 5645 | ITP                  | C "Geniş spektrumlu antibiyotik"    | D "Gözlem veya kortikosteroid/IVIG"               | İTP'de antibiyotik yok, exp gözlem/steroid/IVIG diyor                        |
| 5664 | Pediatrik obezite    | B "Rekombinant GH"                  | E "Aile temelli yaşam tarzı"                      | GH obeziteyi tedavi etmez; exp davranışsal yaklaşımı anlatıyor               |
| 5677 | Gıda alerjisi        | E "Aylık IVIG"                      | B "Allerjen kaçınma + epinefrin otoenjektör"      | IgE alerjisinde IVIG yok                                                     |


### Pattern hipotezi

Şık-doğru cevap eşleşmesi şu kalıplarda kaymış:

- **B ↔ E** (en
- **C ↔ D** yaygın, gerçek doğru genellikle "uzun, doğru klinik ifade" yerine "kısa, saçma alternatif" olarak işaretlenmiş)
- **D ↔ C**, **E ↔ B**, **C ↔ B**

Olası kök neden: Toplu append script'i sırasında `correct` index alanının yanlış kaynaktan alınması veya seçenek karıştırma adımının `correct` güncellemesini atlaması.

### Etki

- **Fixed exam'ler etkilenmiyor** ✅ — Pediatri 5500-5687 aralığındaki hiçbir ID 10 fixed exam'in (Kamp 1-3, Bahar 1-3, Tekrar 1-4) hiçbirinde yer almıyor. Bu yeşil ışık.
- **Kullanıcı geçmişi:** Düzeltme uygulanırsa, bu soruları daha önce çözmüş kullanıcıların `wrongQuestions`/`favoriteQuestions`/`examResults` kayıtlarında "yanlış" yapılanlar artık "doğru" sayılacak ve tam tersi.
- **setVersion bump:** Gerek yok (fixed exam yok).

### Öneri

1. Bu 93 soru için **manuel medikal validatör onayı** alınmalı.
2. Onaydan sonra `correct` index toplu güncellemesi (her soru için tek tek, exp'in işaret ettiği şıka).
3. Bu turda **otomatik düzeltme yapılmadı** — kullanıcının açık tıbbi onayı gerekiyor.

Tam liste: `[wrong_answer_suspects.json](./wrong_answer_suspects.json)`

---

## 3. Subagent-Bazlı Bulgu Özeti


| Subagent                             | Bulgu             | Kritik Notlar                                                                                                           |
| ------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1. DATA-SCHEMA-AUDITOR               | 0 P0              | validate:questions ✅, manifest counts ✅, options.length=5 her soruda, correct 0-4 aralığında                            |
| 2. MEDICAL-TRUTH-AUDITOR             | **42 P0 + 30 P1** | Pediatri batch felaketi (yukarıda detay)                                                                                |
| 3. TUS-EXAM-RELEVANCE-AUDITOR        | düşük             | Vaka kökleri TUS tarzında, ortalama 280+ karakter; "yanlıştır" tipi sorular sağlıklı dağılmış                           |
| 4. SUBJECT-TOPIC-MAPPING-AUDITOR     | 37 (29 P3 + 8 P2) | 30 konu_alias hint, 4 near-duplicate konu adı, 2 case/diacritic variant, 1 double-space, 3 ASCII Türkçe uyarı           |
| 5. OPTION-QUALITY-AUDITOR            | 35 (6 P2 + 29 P3) | 6 "tümü/tümüyle" çeldirici, 24 very_short_option, 8 very_long_option                                                    |
| 6. EXPLANATION-QUALITY-AUDITOR       | **743**           | 740 exp doğru şık metnini zayıf içeriyor (heuristik), 2 exp_favors_other, 1 very_short_explanation                      |
| 7. DIFFICULTY-CALIBRATION-AUDITOR    | **sistemik P1**   | 0 diff=1, 0 diff=2 — kalibrasyon felaketi                                                                               |
| 8. DUPLICATE-SIMILARITY-AUDITOR      | 1 P1              | id 1037 ↔ id 969 (Mikrobiyoloji/Mikoloji, Tinea corporis vakası, %93 benzerlik); aynı correct, aynı exp                 |
| 9. TURKISH-LANGUAGE-STYLE-AUDITOR    | 2 P3              | 2 soruda parantez dengesi uyarısı (id 662, 753; her ikisi yanlış pozitif olabilir)                                      |
| 10. CLINICAL-SAFETY-AUDITOR          | bkz. SUBAGENT 2   | Pediatri batch felaketi içinde acil yaklaşım yanlışları var (id 5559 TCA flumazenil, id 5546 oral amoksisilin menenjit) |
| 11. FRONTEND-INTEGRATION-AUDITOR     | 0 risk            | Manifest ↔ actual count tam eşleşme; SUBJECT_QUESTION_COUNTS uyumlu; import.meta.glob ile dynamic loading sağlam        |
| 12. FIXED-EXAM-COMPATIBILITY-AUDITOR | 0 etki            | 10 fixed exam'in hiçbiri Pediatri 5500+ aralığını kullanmıyor; setVersion bump gerekmez                                 |
| 13. PEDAGOGY-LEARNING-AUDITOR        | sistemik          | Vaka kökleri öğretici, ama 740 sorunun exp'i çok kısa/dar — "yanlış şıkları neden yanlış" öğretimi eksik                |
| 14. STATISTICAL-DISTRIBUTION-AUDITOR | sistemik          | diff dağılımı ile çoğu konu sayısı dengesiz (bkz. statistical_distribution_report.md)                                   |
| 15. PATCH-PLANNER                    | —                 | A grubu auto-fix: 0 uygulandı (hepsi TopicTracker etkili). B/C/D gruplarına detaylı patch_plan.md                       |


---

## 4. P0 / P1 Bulguların Konsolide En Kritik 20 Soru Listesi


| Sıra | id   | ders     | konu                       | seviye | sorun                                                                  | öneri       |
| ---- | ---- | -------- | -------------------------- | ------ | ---------------------------------------------------------------------- | ----------- |
| 1    | 5570 | Pediatri | Neonatoloji                | P0     | exp D'yi destekliyor, correct=C                                        | correct → D |
| 2    | 5559 | Pediatri | Pediatrik Aciller          | P0     | TCA intox: exp NaHCO₃ (E), correct=B (Flumazenil)                      | correct → E |
| 3    | 5550 | Pediatri | Pediatrik Enfeksiyon       | P0     | EBV mononukleoz: exp EBV/D, correct=C (yanlış)                         | correct → D |
| 4    | 5599 | Pediatri | Pediatrik Gastroenteroloji | P0     | Pinworm: exp E, correct=B (Kan transfüzyonu, saçma)                    | correct → E |
| 5    | 5544 | Pediatri | Pediatrik Enfeksiyon       | P0     | Kızamık+Vit A: exp E, correct=B                                        | correct → E |
| 6    | 5561 | Pediatri | Pediatrik Aciller          | P0     | DKA potasyum: exp C, correct=D                                         | correct → C |
| 7    | 5540 | Pediatri | Pediatrik Enfeksiyon       | P0     | Rotavirus: exp D, correct=C                                            | correct → D |
| 8    | 5614 | Pediatri | Pediatrik Göğüs            | P0     | Kistik fibroz: exp E, correct=B                                        | correct → E |
| 9    | 5595 | Pediatri | Pediatrik Gastroenteroloji | P0     | Crohn: exp D, correct=C                                                | correct → D |
| 10   | 5632 | Pediatri | Pediatrik Nefroloji        | P0     | CAH: exp B (21-OH), correct=E (DI, saçma)                              | correct → B |
| 11   | 5677 | Pediatri | Pediatrik İmmünoloji       | P0     | Gıda alerjisi: exp B, correct=E                                        | correct → B |
| 12   | 5664 | Pediatri | Beslenme                   | P0     | Pediatrik obezite: exp E, correct=B                                    | correct → E |
| 13   | 5587 | Pediatri | Pediatrik Nöroloji         | P0     | BRE: exp B, correct=E (Dravet)                                         | correct → B |
| 14   | 5639 | Pediatri | Pediatrik Endokrin         | P0     | Iatrogenik Cushing: exp E, correct=B (feokromositoma)                  | correct → E |
| 15   | 5546 | Pediatri | Pediatrik Enfeksiyon       | P0     | Neonatal menenjit: exp C, correct=D (oral amoksisilin, klinik tehlike) | correct → C |
| 16   | 5626 | Pediatri | Pediatrik Nefroloji        | P0     | HUS: exp C (Shiga), correct=D (immün kompleks)                         | correct → C |
| 17   | 5627 | Pediatri | Pediatrik Nefroloji        | P0     | VUR: exp B, correct=E (Antiviral profilaksi)                           | correct → B |
| 18   | 5622 | Pediatri | Pediatrik Göğüs            | P0     | Biyolojik astım: exp B (Anti-IgE), correct=E (İnsülin)                 | correct → B |
| 19   | 5589 | Pediatri | Pediatrik Nöroloji         | P0     | Pediatrik migren: exp D (Valproat profilaksi), correct=B (Ergotamin)   | correct → D |
| 20   | 5621 | Pediatri | Pediatrik Göğüs            | P0     | XLA Bruton: exp C, correct=D (T hücre)                                 | correct → C |


> Tüm 42 P0 + 30 P1 bulgusu için detay: `[p0_critical_findings.json](./p0_critical_findings.json)`, `[p1_high_findings.json](./p1_high_findings.json)`

---

## 5. Sistematik (Soru-Bağımsız) Bulgular


| Bulgu                      | Seviye | Açıklama                                                                                                                                                       |
| -------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Diff kalibrasyon           | P1     | Havuzda diff=1 ve diff=2 hiç yok; öğrenci kolay soru bulamıyor                                                                                                 |
| Sistematik kısa exp        | P2     | 740 soru "exp doğru şık metnini zayıf içeriyor" heuristiğini tetikledi; çoğu yanlış pozitif olabilir ama bu derece yaygınlık sistemik kısa açıklama göstergesi |
| Yanlıştır soru tipi sayımı | bilgi  | 8 negatif soru kökü tespit edildi (genelde sağlıklı yapı), 3 yanlış pozitif heuristic'te                                                                       |
| Konu adı varyasyonu        | P2     | "Pediatrik İmmünoloji/Alerji" vs "Pediatrik İmmünoloji/Alerji" (çift boşluk), "Gis Kanamaları" vs "GIS Kanamaları", "Dermatoloji" vs "Dermotoloji" (typo)      |


---

## 6. Test ve Build Durumu

`npm run validate:questions` ✅ Geçti (5687 soru, 11 ders, 0 hata).  
`npm run test` ve `npm run build` ayrı koşulacak — bkz. `[test_results.md](./test_results.md)`

---

## 7. Önerilen Sonraki Adımlar (Öncelik Sırası)

1. **🚨 ACİL — Pediatri 5500-5687 batch correct-index düzeltmesi.** 93 soru için manuel medikal validatör + uzman onayı, ardından toplu correct update. Fixed exam'i etkilemediği için setVersion bump gerekmez. Önerilen workflow: `[patch_plan.md](./patch_plan.md)` bölüm 1.
2. **id 1037 ↔ id 969 near-duplicate** kararı: hangi varyant kalacak, diğeri silinmeyecek (id korunur), içerik farklılaştırılacak veya yeniden yazılacak.
3. **Diff kalibrasyon batch'i:** 5687 sorudan rastgele 50 örnek için manuel diff yeniden değerlendirme; ardından kelime-bazlı heuristic ile toplu yeniden etiketleme (sonra manuel QC).
4. **Konu standardizasyonu**, ancak `TopicTracker` migration plan'ı sonrası: Dermotoloji→Dermatoloji, çift boşluk temizliği, Geriartri→Geriatri (Dahiliye), Gis→GIS.
5. **Sistematik exp rewrite paketi:** önce P2 weak_explanations.json (740 soru) örneklenip yanlış pozitif oranı tespit edilecek; gerçek zayıf olanlar exp-editor subagent paketine alınacak (50-100 batch).
6. **6 risky_all_none_option** çeldirici iyileştirmesi.
7. Toplam 753 P2 bulgu için "yavaş yavaş orjinal rewrite" sprint planı.

---

## 8. Bu Raporda **Hiçbir** Şey Otomatik Uygulanmadı

Kullanıcı talimatına bağlı kalarak:

- ❌ `correct` index hiç değiştirilmedi (en kritik 93 soru bile)
- ❌ Soru `id`'leri hiç değiştirilmedi
- ❌ Hiçbir soru silinmedi
- ❌ Hiçbir konu adı standardize edilmedi (TopicTracker etkili)
- ❌ Hiçbir exp rewrite edilmedi
- ❌ Hiçbir option metin düzeltmesi yapılmadı
- ❌ Manifest dosyası değiştirilmedi
- ❌ Fixed exam metadata'sına dokunulmadı

Sadece bu klasör altında **rapor + JSON çıktıları** üretildi.

---

## 9. Rapor Dosyaları Dizini

### Markdown raporları

1. `[master_audit_summary.md](./master_audit_summary.md)` — bu dosya
2. `[schema_audit_report.md](./schema_audit_report.md)`
3. `[medical_truth_report.md](./medical_truth_report.md)`
4. `[tus_relevance_report.md](./tus_relevance_report.md)`
5. `[subject_topic_mapping_report.md](./subject_topic_mapping_report.md)`
6. `[option_quality_report.md](./option_quality_report.md)`
7. `[explanation_quality_report.md](./explanation_quality_report.md)`
8. `[difficulty_calibration_report.md](./difficulty_calibration_report.md)`
9. `[duplicate_similarity_report.md](./duplicate_similarity_report.md)`
10. `[turkish_style_report.md](./turkish_style_report.md)`
11. `[clinical_safety_report.md](./clinical_safety_report.md)`
12. `[frontend_integration_report.md](./frontend_integration_report.md)`
13. `[fixed_exam_compatibility_report.md](./fixed_exam_compatibility_report.md)`
14. `[pedagogy_report.md](./pedagogy_report.md)`
15. `[statistical_distribution_report.md](./statistical_distribution_report.md)`
16. `[patch_plan.md](./patch_plan.md)`

Ayrıca `[test_results.md](./test_results.md)` — validate/test/build sonuçları.

### Machine-readable JSON

1. `[all_findings.json](./all_findings.json)` — tüm 895 finding
2. `[p0_critical_findings.json](./p0_critical_findings.json)`
3. `[p1_high_findings.json](./p1_high_findings.json)`
4. `[wrong_answer_suspects.json](./wrong_answer_suspects.json)`
5. `[multi_correct_suspects.json](./multi_correct_suspects.json)`
6. `[weak_explanations.json](./weak_explanations.json)`
7. `[duplicate_questions.json](./duplicate_questions.json)`
8. `[subject_topic_suggestions.json](./subject_topic_suggestions.json)`
9. `[diff_change_suggestions.json](./diff_change_suggestions.json)`
10. `[safe_auto_fixes.json](./safe_auto_fixes.json)`
11. `[needs_manual_review.json](./needs_manual_review.json)`
12. `[do_not_touch_yet.json](./do_not_touch_yet.json)`

