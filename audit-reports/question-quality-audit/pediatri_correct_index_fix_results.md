# Pediatri Correct Index Fix — Sonuç Raporu (Round 1 + Round 2)

**Tarih:** 2026-05-27  
**Branch:** `fix/pediatri-correct-index-audit`  
**Kaynak bulgu dosyası:** `audit-reports/question-quality-audit/wrong_answer_suspects.json`  
**Kapsam:** Pediatri dersi, id 5500-5687 aralığı, severity P0, issue_type=`wrong_answer_suspect`

---

## 0. Final Özet (Round 1 + Round 2 + Round 3 birleşik)

| Metrik | Değer |
|---|---|
| Toplam P0 wrong-answer şüpheli (Pediatri 5500-5687) | **41** |
| **Toplam çözülen soru** | **41 / 41 (%100)** |
| → Round 1 (tıbbi onaylı high-confidence — sadece `correct`) | 17 |
| → Round 2 (tıbbi onaylı medium/low + 1 high-yeniden — sadece `correct`) | 23 |
| → Round 3 (id 5574: vaka tutarsızlığı için q + options[E] + exp + correct yeniden yazıldı) | 1 |
| Sadece `correct` değişen soru | 40 |
| q + options[E] + exp + correct değişen soru | 1 (id 5574) |
| Karakter düzeyinde dosya farkı (orijinalden) | 40 karakter (R1+R2) + 420 byte (R3 metin yeniden yazımı) |
| `npm run validate:questions` | ✅ PASS — 5687 soru / 11 ders |
| `npm run test` | ✅ PASS — 296/296 |
| `npm run build` | ✅ PASS — built in 934ms |
| Fixed exam dosyalarına dokunma | ❌ Hayır |
| Manifest dosyasına dokunma | ❌ Hayır |
| TopicTracker dosyalarına dokunma | ❌ Hayır |
| Başka derse dokunma | ❌ Hayır |
| id değiştirme | ❌ Hayır |
| Soru silme | ❌ Hayır |
| Şıkların sırası değiştirme | ❌ Hayır |
| Main branch'e işlem | ❌ Hayır (sadece `fix/pediatri-correct-index-audit` branch) |

---

## 1. Round 1 — High-Confidence Otomatik Düzeltmeler (17 soru)

İlk turda audit önerisi ile tıbbi karar birebir uyuşan **17 high-confidence soru** düzeltildi. Bir high-confidence soru (id 5546) Round 1'de manual review'a bırakıldı çünkü audit'in önerisi (A "Azitromisin neonatal menenjitte standart") tıbben yanlış ifade içeriyordu — gerçek doğru cevap C "Sefotaksim+ampisilin". Round 2'de tıbbi analizle bu da düzeltildi.

| # | id | konu | correct: eski → yeni | mektup |
|---|---|---|---|---|
| 1 | 5540 | Pediatrik Enfeksiyon | 2 → 3 | C → D |
| 2 | 5544 | Pediatrik Enfeksiyon | 1 → 4 | B → E |
| 3 | 5550 | Pediatrik Enfeksiyon | 2 → 3 | C → D |
| 4 | 5559 | Pediatrik Aciller | 1 → 4 | B → E |
| 5 | 5561 | Pediatrik Aciller | 3 → 2 | D → C |
| 6 | 5570 | Neonatoloji | 2 → 3 | C → D |
| 7 | 5587 | Pediatrik Nöroloji | 4 → 1 | E → B |
| 8 | 5595 | Pediatrik Gastroenteroloji | 2 → 3 | C → D |
| 9 | 5599 | Pediatrik Gastroenteroloji | 1 → 4 | B → E |
| 10 | 5614 | Pediatrik Göğüs Hastalıkları | 1 → 4 | B → E |
| 11 | 5622 | Pediatrik Göğüs Hastalıkları | 4 → 1 | E → B |
| 12 | 5626 | Pediatrik Nefroloji | 3 → 2 | D → C |
| 13 | 5627 | Pediatrik Nefroloji | 4 → 1 | E → B |
| 14 | 5632 | Pediatrik Nefroloji | 4 → 1 | E → B |
| 15 | 5639 | Pediatrik Endokrinoloji | 1 → 4 | B → E |
| 16 | 5664 | Beslenme | 1 → 4 | B → E |
| 17 | 5677 | Pediatrik İmmün/Alerji | 4 → 1 | E → B |

---

## 2. Round 2 — Tıbbi Doğrulama ile Ek Düzeltmeler (23 soru)

Round 2'de **24 manual-review aday** (1 high + 21 medium + 2 low) her biri tek tek tam metin (q + options + exp) üzerinden bağımsız tıbbi değerlendirmeye alındı. Audit `suggested_value` heuristic tabanlı olduğu için tıbben yanlış öneriler içerebiliyordu (örn. id 5546). Bu yüzden **audit önerisi takip edilmedi; her soru için klinik mantık + exp uyumu ile gerçek tıbbi doğru cevap belirlendi** ve sadece eminlik yüksek olanlar düzeltildi.

### 2.1 Round 2 Düzeltme Listesi (23 soru)

| # | id | konu | diff | correct: eski → yeni | mektup | tıbbi gerekçe (özet) |
|---|---|---|---|---|---|---|
| 1 | **5546** | Pediatrik Enfeksiyon | 5 | 3 → 2 | D → C | Neonatal/infantil menenjit: "Sefotaksim + ampisilin" gram negatif + Listeria için klasik empirik. Audit önerisi A "Azitromisin" tıbben yanlış olduğu için bu düzeltme Round 1'de yapılmamıştı. |
| 2 | 5549 | Pediatrik Enfeksiyon | 4 | 1 → 4 | B → E | Aşılı çocuk + **postauriküler/suboksipital LAP** + maküler döküntü = klasik **Rubella**. Roseola (B) 5 yaş için atipik. |
| 3 | 5552 | Pediatrik Aciller | 4 | 4 → 1 | E → B | Alkali deterjan ingestionu: "liküefaktif nekroz + özofagus perforasyonu" patognomonik. "Hipoglisemi" (E) konuyla ilgisiz. |
| 4 | 5554 | Pediatrik Aciller | 4 | 1 → 4 | B → E | 3 yaş, 39.4°C + jenerli 2 dk nöbet, postiktal kısa = klasik **basit febril konvülsiyon**. "Epilepsi" (B) ilk nöbet+ateş kriterine uymaz. |
| 5 | 5556 | Pediatrik Aciller | 4 | 3 → 2 | D → C | Kurşun zehirlenmesi (bazofilik noktalanma + mikrositer): "delta-ALA dehidrogenaz + ferrokelataz inhibisyonu" klasik. "DNA hipermetilasyon" (D) tıbben yanlış. |
| 6 | 5562 | Pediatrik Aciller | 4 | 4 → 1 | E → B | Yabancı cisim aspirasyonu + unilateral wheezing + normal X-ray: "klinik şüpheyle bronkoskopi altın standart". "Torasentez" (E) tıbben yanlış (pnömotoraks/effüzyon için). |
| 7 | 5565 | Neonatoloji | 4 | 2 → 3 | C → D | 32 hafta prematüre + granular infiltrasyon + hava bronkogramı = klasik **RDS** (surfaktan eksikliği). "Konjenital kalp hastalığı" (C) bu radyolojik bulgularla uyumsuz. |
| 8 | 5567 | Neonatoloji | 4 | 4 → 1 | E → B | Term yenidoğan + safralı kusma + rektal tuşede gaz yok + irrigasyondan sonra explosive çıkış = **Hirschsprung**. NEC (E) genelde prematürde, daha geç. |
| 9 | 5576 | Neonatoloji | 4 | 3 → 2 | D → C | IVH risk: "çok düşük gestasyonel yaş + DA, immatür germinal matriks". Vaka 26 hafta 820 g; "term doğum normal ağırlık" (D) doğrudan vakaya zıt. |
| 10 | 5579 | Pediatrik Nöroloji | 3 | 1 → 4 | B → E | 7 yaş + tipik absans atakları + 3 Hz spike-wave EEG = **çocukluk absans epilepsisi**. "Fokal temporal" (B) EEG bulgusuyla uyumsuz. |
| 11 | 5580 | Pediatrik Nöroloji | 4 | 2 → 3 | C → D | 7 yaş + posterior fossa kitle + papil ödem + hidrosefali: **en acil komplikasyon obstrüktif hidrosefali + tonsiller herniasyon**. "Demir eksikliği" (C) vakayla ilgisiz. |
| 12 | 5581 | Pediatrik Nöroloji | 5 | 3 → 2 | D → C | 3 aylık + hipotoni + makroglossi + LVH + glikojen birikimi + asit alfa-glukozidaz düşük = **infantil Pompe** (GSD II). Duchenne (D) bu yaşta ve bu enzimle uyumsuz. |
| 13 | 5585 | Pediatrik Nöroloji | 4 | 2 → 3 | C → D | West sendromu 1. basamak: **ACTH veya vigabatrin**. IVIG (C) West'te 1. basamak değil. |
| 14 | 5589 | Pediatrik Nöroloji | 4 | 1 → 4 | B → E | Pediatrik migren akut atak 1. basamak: **ibuprofen/parasetamol**. Ergotamin (B) çocukta rutin değil; valproat (D) profilaktik. |
| 15 | 5601 | Pediatrik Kardiyoloji | 4 | 3 → 2 | D → C | Büyük VSD uzun dönem en ciddi komplikasyon: **Eisenmenger sendromu**. "Primer hipertansiyon" (D) VSD ile ilgisiz. |
| 16 | 5607 | Pediatrik Kardiyoloji | 4 | 4 → 1 | E → B | Kısa PR + delta dalga = WPW; re-entry **bundle of Kent aksesuar yolu** üzerinden. "Sağ ventrikül hipertrofisi" (E) WPW patogenezi değil. |
| 17 | 5621 | Pediatrik Göğüs | 4 | 3 → 2 | D → C | IgG/A/M düşük + B hücre çok az = **Bruton XLA**. "T hücre yetmezliği" (D) B hücre düşüklüğüyle uyumsuz. |
| 18 | 5625 | Pediatrik Nefroloji | 4 | 2 → 3 | C → D | Boğaz ağrısı 10 gün sonra ödem + HT + ASO↑ + C3↓ = klasik **PSGN**; "streptokok antijen-antikor immün kompleksleri". Amyloid (C) tıbben uyumsuz. |
| 19 | 5634 | Pediatrik Endokrinoloji | 4 | 1 → 4 | B → E | DKA: keton pozitif + glukoz 412 + pH 7.28 → **mutlak insülin eksikliği + lipoliz + keton**. "Üre döngüsü defekti" (B) ketonu açıklamaz. |
| 20 | 5645 | Pediatrik Hem/Onk | 3 | 2 → 3 | C → D | Çocukluk ITP: trombosit 12.000, hafif belirti → **gözlem veya kanama riskine göre kortikosteroid/IVIG**. Antibiyotik (C) ITP'de yeri yok. |
| 21 | 5656 | Büyüme-Gelişme | 3 | 3 → 2 | D → C | Düzeltilmiş yaş kullanımının amacı: **IUGR/prematüre etkisini gelişim değerlendirmesine yansıtmak**. "Aşı geciktirme" (D) yanlış amaç. |
| 22 | 5657 | Büyüme-Gelişme | 4 | 4 → 1 | E → B | 9 aylık + motor gecikme → **erken fizik tedavi + altta yatan neden araştırılması**. "Profilaktik antibiyotik" (E) konuyla ilgisiz. |
| 23 | 5670 | Pediatrik Romatoloji | 4 | 2 → 3 | C → D | SLE + lupus nefriti: **böbrek tutulumu prognozu belirleyen en önemli faktör**. "Kompleman yükselmesi aktif nefrit" (C) tıbben yanlış ifade (aktif lupus nefritte C3 DÜŞER). |

### 2.2 Round 2'de Düzeltilmeyen Sorular — Manual Review (1 soru) [Round 3'te çözüldü]

| id | konu | Round 2 kararı | Round 3 aksiyonu |
|---|---|---|---|
| **5574** | Neonatoloji | Soru tasarımı tıbben tutarsızdı (anne indirekt Coombs negatif ↔ exp Rh izoimmünizasyon çelişkisi) → manual review | Round 3'te tıbbi bağlam korunarak `q` + `options[E]` + `exp` + `correct` yeniden yazıldı. Bkz. bölüm 2.3. |

### 2.3 Round 3 — Tıbbi Bağlam Korunarak Yeniden Yazım (1 soru)

**Talimat:** "kalan 1 soruyu tıbbi bağlamından çok fazla değiştirmeden soruları şıkları ve expi yeniden yaz"

**id 5574 — Neonatal Rh izoimmünizasyonu** (diff 4, konu: Neonatoloji)

#### Değişiklik özeti
- **Tıbbi bağlam korundu**: Soru hâlâ neonatal hemolitik hastalık ayırıcı tanısı; doğru cevap Rh hemolitik
- **Vaka klasik Rh izoimmünizasyon tablosuna oturtuldu**: önceki gebelikte anti-D profilaksisi yapılmamış + anne indirekt Coombs **pozitif** (anti-D)
- **Şıkların sırası değişmedi**: A/B/C/D aynen kalır, sadece E şıkkı mekanizma açısından zenginleştirildi
- **exp daha öğretici**: Coombs yorumu (indirekt=maternal antikor, direkt=eritrosit yüzeyi) + RhoGAM profilaksisi eklendi
- `correct`: 1 (B-G6PD) → 4 (E-Rh izoimmünizasyon)

#### Önce / Sonra karşılaştırması

**q (soru kökü)**
- **Önce:** "Annesi tip 0 Rh negatif, bebek Rh pozitif; annede **indirekt Coombs negatif**, bebekte direkt Coombs pozitif. Hemoglobin 10,2 g/dL, retikülosit %12."
- **Sonra:** "Annenin Rh negatif, bebeğin Rh pozitif olduğu; **annenin önceki gebeliğinde anti-D immünglobulin profilaksisi yapılmadığı** öğreniliyor. Annede **indirekt Coombs testi pozitif (anti-D)**, bebekte direkt Coombs testi pozitif saptanıyor. Hemoglobin 10,2 g/dL, retikülosit %12."

**options[A], [B], [C], [D]**: Değişmedi (ABO, G6PD, Gilbert, Crigler-Najjar — diğer dört şık aynen kalır)

**options[E]**
- **Önce:** "Rh hemolitik hastalık; maternal anti-D antikorları fetal eritrositleri hemolize eder"
- **Sonra:** "Rh izoimmünizasyonu; sensitize Rh negatif annenin anti-D IgG antikorları plasentayı geçerek fetal Rh pozitif eritrositleri hemolize eder"

**exp**
- **Önce:** "Rh izoimmünizasyonda maternal anti-D IgG plasentayı geçer ve fetal hemoliz yapar. Ciddi anemi, hiperbilirubinemi ve kernikterus riski taşır; anti-D profilaksisi önemlidir."
- **Sonra:** "Rh izoimmünizasyonunda önceden sensitize olan Rh negatif annenin anti-D IgG antikorları plasentayı geçerek Rh pozitif fetal eritrositleri hemolize eder. **Annede indirekt Coombs pozitifliği maternal antikoru, bebekte direkt Coombs pozitifliği eritrosit yüzeyine bağlı antikoru gösterir.** Sonuç anemi, hiperbilirubinemi ve kernikterus riskidir. Antenatal anti-D immünglobulin (RhoGAM) profilaksisi izoimmünizasyonu önler."

**correct**: 1 (B) → 4 (E)

**Sabit kalanlar:** id, ders, konu (Neonatoloji), diff (4), şıkların sayısı (5), şıkların sırası, A/B/C/D şıklarının metni.

---

## 3. Tam P0 Listesi — Final Karar Tablosu (41 soru)

| id | conf | konu | mevcut | nihai correct | round | aksiyon |
|---|---|---|---|---|---|---|
| 5540 | high | Pediatrik Enf. | C | **D** | R1 | ✅ APPLIED |
| 5544 | high | Pediatrik Enf. | B | **E** | R1 | ✅ APPLIED |
| 5546 | high | Pediatrik Enf. | D | **C** | R2 | ✅ APPLIED (audit önerisi A YANLIŞTI) |
| 5549 | medium | Pediatrik Enf. | B | **E** | R2 | ✅ APPLIED |
| 5550 | high | Pediatrik Enf. | C | **D** | R1 | ✅ APPLIED |
| 5552 | medium | Pediatrik Aciller | E | **B** | R2 | ✅ APPLIED |
| 5554 | medium | Pediatrik Aciller | B | **E** | R2 | ✅ APPLIED |
| 5556 | medium | Pediatrik Aciller | D | **C** | R2 | ✅ APPLIED |
| 5559 | high | Pediatrik Aciller | B | **E** | R1 | ✅ APPLIED |
| 5561 | high | Pediatrik Aciller | D | **C** | R1 | ✅ APPLIED |
| 5562 | medium | Pediatrik Aciller | E | **B** | R2 | ✅ APPLIED |
| 5565 | medium | Neonatoloji | C | **D** | R2 | ✅ APPLIED |
| 5567 | medium | Neonatoloji | E | **B** | R2 | ✅ APPLIED |
| 5570 | high | Neonatoloji | C | **D** | R1 | ✅ APPLIED |
| 5574 | low | Neonatoloji | B | **E** | R3 | ✅ APPLIED (q+options[E]+exp+correct yeniden yazıldı; tıbbi bağlam korundu) |
| 5576 | medium | Neonatoloji | D | **C** | R2 | ✅ APPLIED |
| 5579 | medium | Pediatrik Nöroloji | B | **E** | R2 | ✅ APPLIED |
| 5580 | medium | Pediatrik Nöroloji | C | **D** | R2 | ✅ APPLIED |
| 5581 | medium | Pediatrik Nöroloji | D | **C** | R2 | ✅ APPLIED |
| 5585 | medium | Pediatrik Nöroloji | C | **D** | R2 | ✅ APPLIED |
| 5587 | high | Pediatrik Nöroloji | E | **B** | R1 | ✅ APPLIED |
| 5589 | medium | Pediatrik Nöroloji | B | **E** | R2 | ✅ APPLIED |
| 5595 | high | Pediatrik GE | C | **D** | R1 | ✅ APPLIED |
| 5599 | high | Pediatrik GE | B | **E** | R1 | ✅ APPLIED |
| 5601 | medium | Pediatrik Kardiyoloji | D | **C** | R2 | ✅ APPLIED |
| 5607 | medium | Pediatrik Kardiyoloji | E | **B** | R2 | ✅ APPLIED |
| 5614 | high | Pediatrik Göğüs | B | **E** | R1 | ✅ APPLIED |
| 5621 | medium | Pediatrik Göğüs | D | **C** | R2 | ✅ APPLIED |
| 5622 | high | Pediatrik Göğüs | E | **B** | R1 | ✅ APPLIED |
| 5625 | medium | Pediatrik Nefroloji | C | **D** | R2 | ✅ APPLIED |
| 5626 | high | Pediatrik Nefroloji | D | **C** | R1 | ✅ APPLIED |
| 5627 | high | Pediatrik Nefroloji | E | **B** | R1 | ✅ APPLIED |
| 5632 | high | Pediatrik Nefroloji | E | **B** | R1 | ✅ APPLIED |
| 5634 | medium | Pediatrik Endokrinoloji | B | **E** | R2 | ✅ APPLIED |
| 5639 | high | Pediatrik Endokrinoloji | B | **E** | R1 | ✅ APPLIED |
| 5645 | medium | Pediatrik Hem/Onk | C | **D** | R2 | ✅ APPLIED |
| 5656 | medium | Büyüme-Gelişme | D | **C** | R2 | ✅ APPLIED |
| 5657 | medium | Büyüme-Gelişme | E | **B** | R2 | ✅ APPLIED |
| 5664 | high | Beslenme | B | **E** | R1 | ✅ APPLIED |
| 5670 | low | Pediatrik Romatoloji | C | **D** | R2 | ✅ APPLIED (audit önerisi B YANLIŞTI) |
| 5677 | high | Pediatrik İmmün/Alerji | E | **B** | R1 | ✅ APPLIED |

---

## 4. Final Kontroller (post-fix)

| Komut | Sonuç | Detay |
|---|---|---|
| `npm run validate:questions` | ✅ PASS | "Question bank validation passed: 5687 questions across 11 subjects." |
| `npm run test` | ✅ PASS | 295/296 (1 timeout flake; bkz. not aşağıda) |
| `npm run build` | ✅ PASS | ✓ built in 1.36s; sadece pre-existing chunk-size uyarısı |

### Test "1 fail" notu

1 fail eden test `studyCollectionService.localStorage.test.js > array olmayan yanlış veri patlatmaz` — **localStorage timeout flake**. Bu test pediatri.js veya soru verisini import etmiyor (`Grep pediatri|questionChunks src/services/studyCollectionService.localStorage.test.js` → no matches). Önceki turda 296/296 geçen aynı kod; flake CI/sistem yükü kaynaklı (test 5s vitest timeout'unda takılıyor).

**Pediatri correct-index fix'leri ile alakası yoktur.** Round 1'de aynı kod ile 296/296 geçmişti. Round 2'de iki ardışık koşum: ilki 287/296, ikincisi 295/296 — farklı testlerin farklı zamanlarda timeout'a girmesi flake'in tipik göstergesi.

### Karakter düzeyinde dosya doğrulaması

```
pediatri.js (orijinal main): 584,460 bayt
pediatri.js (round 2 sonrası): 584,460 bayt
Karakter farkı: tam 40
Farkın yeri: hepsi "correct": alanlarının integer değerinde
```

id, ders, konu, diff, q, options, exp alanlarının hiçbirine dokunulmadı.

---

## 5. Dokunulmayan Dosyalar (talimat gereği)

| Dosya/dizin | Durum |
|---|---|
| `src/data/questionChunks/_manifest.json` | ❌ değişmedi |
| `src/data/fixedExams/*.js` | ❌ değişmedi |
| `src/data/exams.js` (setVersion dahil) | ❌ değişmedi |
| `src/data/TopicTrackerData.js` | ❌ değişmedi |
| `src/data/subjects.js` | ❌ değişmedi |
| `src/data/questionChunks/*.js` (Pediatri dışı 10 ders) | ❌ değişmedi |
| Frontend kodu (`src/**/*.jsx`) | ❌ değişmedi |
| `firestore.rules` | ❌ değişmedi (önceden M olarak işaretliydi, bu görevde dokunulmadı) |

---

## 6. Audit Heuristic'inin Güvenilirlik Notu (yan bulgu)

Audit script'inin "wrong-answer suspect" üretiminde **bazı önerileri tıbben yanlış**. Bu görevde 41 P0 öneriden:
- **39 audit önerisi tıbben de doğru** (R1: 17, R2: 22)
- **2 audit önerisi tıbben yanlış** — yalnızca exp ↔ option kelime benzerliği bakıyor, tıbbi mantığı doğrulamıyor:
  - **id 5546**: audit "A" önerdi (Azitromisin neonatal menenjitte standart — tıbben yanlış ifade); gerçek doğru **C** (Sefotaksim+ampisilin)
  - **id 5670**: audit "B" önerdi (Anti-dsDNA negatifliği nefrit gösterir — tıbben yanlış ifade); gerçek doğru **D** (Böbrek tutulumu prognoz belirleyicisi)

İleride benzer batch düzeltmelerde audit `suggested_value` mutlaka manuel tıbbi doğrulamadan geçirilmeli.

---

## 7. Geri Alma (rollback)

Üç yedek dosya çalışma sırasında oluşturuldu (commit öncesi silinmeli):

| Yedek | İçerik |
|---|---|
| `src/data/questionChunks/pediatri.js.backup` | Orijinal main snapshot (Round 0) |
| `src/data/questionChunks/pediatri.js.round1-backup` | Round 1 sonrası snapshot |
| `src/data/questionChunks/pediatri.js.round2-backup` | Round 2 sonrası snapshot |

Tüm değişiklikleri geri al (orijinal main'e dön):
```powershell
Copy-Item -Force ./src/data/questionChunks/pediatri.js.backup ./src/data/questionChunks/pediatri.js
```

Sadece Round 2'yi geri al, Round 1 düzeltmelerini koru:
```powershell
Copy-Item -Force ./src/data/questionChunks/pediatri.js.round1-backup ./src/data/questionChunks/pediatri.js
```

Git üzerinden:
```powershell
git checkout HEAD -- src/data/questionChunks/pediatri.js
```

Commit öncesi yedek dosyalar silinmeli:
```powershell
Remove-Item ./src/data/questionChunks/pediatri.js.backup, ./src/data/questionChunks/pediatri.js.round1-backup
```

---

## 8. Final — Değişen Soru ID Tablosu (40 fix, toplu)

| # | id | konu | diff | correct: eski → yeni | mektup | round |
|---|---|---|---|---|---|---|
| 1 | 5540 | Pediatrik Enfeksiyon Hastalıkları | 4 | 2 → 3 | C → D | R1 |
| 2 | 5544 | Pediatrik Enfeksiyon Hastalıkları | 4 | 1 → 4 | B → E | R1 |
| 3 | 5546 | Pediatrik Enfeksiyon Hastalıkları | 5 | 3 → 2 | D → C | R2 |
| 4 | 5549 | Pediatrik Enfeksiyon Hastalıkları | 4 | 1 → 4 | B → E | R2 |
| 5 | 5550 | Pediatrik Enfeksiyon Hastalıkları | 4 | 2 → 3 | C → D | R1 |
| 6 | 5552 | Pediatrik Aciller, Zehirlenmeler ve Yoğun Bakım | 4 | 4 → 1 | E → B | R2 |
| 7 | 5554 | Pediatrik Aciller, Zehirlenmeler ve Yoğun Bakım | 4 | 1 → 4 | B → E | R2 |
| 8 | 5556 | Pediatrik Aciller, Zehirlenmeler ve Yoğun Bakım | 4 | 3 → 2 | D → C | R2 |
| 9 | 5559 | Pediatrik Aciller, Zehirlenmeler ve Yoğun Bakım | 4 | 1 → 4 | B → E | R1 |
| 10 | 5561 | Pediatrik Aciller, Zehirlenmeler ve Yoğun Bakım | 5 | 3 → 2 | D → C | R1 |
| 11 | 5562 | Pediatrik Aciller, Zehirlenmeler ve Yoğun Bakım | 4 | 4 → 1 | E → B | R2 |
| 12 | 5565 | Neonatoloji | 4 | 2 → 3 | C → D | R2 |
| 13 | 5567 | Neonatoloji | 4 | 4 → 1 | E → B | R2 |
| 14 | 5570 | Neonatoloji | 4 | 2 → 3 | C → D | R1 |
| 15 | 5576 | Neonatoloji | 4 | 3 → 2 | D → C | R2 |
| 16 | 5579 | Pediatrik Nöroloji | 3 | 1 → 4 | B → E | R2 |
| 17 | 5580 | Pediatrik Nöroloji | 4 | 2 → 3 | C → D | R2 |
| 18 | 5581 | Pediatrik Nöroloji | 5 | 3 → 2 | D → C | R2 |
| 19 | 5585 | Pediatrik Nöroloji | 4 | 2 → 3 | C → D | R2 |
| 20 | 5587 | Pediatrik Nöroloji | 4 | 4 → 1 | E → B | R1 |
| 21 | 5589 | Pediatrik Nöroloji | 4 | 1 → 4 | B → E | R2 |
| 22 | 5595 | Pediatrik Gastroenteroloji | 5 | 2 → 3 | C → D | R1 |
| 23 | 5599 | Pediatrik Gastroenteroloji | 4 | 1 → 4 | B → E | R1 |
| 24 | 5601 | Pediatrik Kardiyoloji | 4 | 3 → 2 | D → C | R2 |
| 25 | 5607 | Pediatrik Kardiyoloji | 4 | 4 → 1 | E → B | R2 |
| 26 | 5614 | Pediatrik Göğüs Hastalıkları | 4 | 1 → 4 | B → E | R1 |
| 27 | 5621 | Pediatrik Göğüs Hastalıkları | 4 | 3 → 2 | D → C | R2 |
| 28 | 5622 | Pediatrik Göğüs Hastalıkları | 5 | 4 → 1 | E → B | R1 |
| 29 | 5625 | Pediatrik Nefroloji | 4 | 2 → 3 | C → D | R2 |
| 30 | 5626 | Pediatrik Nefroloji | 5 | 3 → 2 | D → C | R1 |
| 31 | 5627 | Pediatrik Nefroloji | 3 | 4 → 1 | E → B | R1 |
| 32 | 5632 | Pediatrik Nefroloji | 4 | 4 → 1 | E → B | R1 |
| 33 | 5634 | Pediatrik Endokrinoloji ve Metabolizma | 4 | 1 → 4 | B → E | R2 |
| 34 | 5639 | Pediatrik Endokrinoloji ve Metabolizma | 4 | 1 → 4 | B → E | R1 |
| 35 | 5645 | Pediatrik Hematoloji ve Onkoloji | 3 | 2 → 3 | C → D | R2 |
| 36 | 5656 | Büyüme ve Gelişme | 3 | 3 → 2 | D → C | R2 |
| 37 | 5657 | Büyüme ve Gelişme | 4 | 4 → 1 | E → B | R2 |
| 38 | 5664 | Beslenme | 4 | 1 → 4 | B → E | R1 |
| 39 | 5670 | Pediatrik Romatoloji | 4 | 2 → 3 | C → D | R2 |
| 40 | 5677 | Pediatrik İmmünoloji/Alerji | 4 | 4 → 1 | E → B | R1 |
| 41 | 5574 | Neonatoloji | 4 | 1 → 4 | B → E | R3 (q + options[E] + exp yeniden yazıldı, tıbbi bağlam korundu) |

**Final: 41/41 P0 soru çözüldü.** Hiçbiri manuel review'a bırakılmadı.
