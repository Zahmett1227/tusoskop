# Medical Truth Report — SUBAGENT 2 (MEDICAL-TRUTH-AUDITOR)

## Özet
- Toplam incelenen soru: 5687
- **P0 medikal yanlış cevap şüphelisi:** 42
- P1 düşük-güven yanlış cevap şüphelisi: 25 (Pediatri 5500+ gap 0.05-0.10)
- P1 exp_favors_other_option: 2
- Manuel medikal validatör onayı gereken: 67

> **EN KRİTİK BULGU: Pediatri 5500-5687 batch'inde sistematik correct-index hatası.** Bu durum, Tusoskop kullanıcılarına aktif olarak yanlış tıbbi bilgi öğretiyor.

## 1. Tespit Yöntemi

Her sorunun `exp` alanı normalize edilip, her şıkkın metni ile **kelime Jaccard (0.6 ağırlık) + 2-gram Jaccard (0.4 ağırlık)** kombine skoru hesaplandı. "Negatif soru kökü" tespiti yapıldı (`yanlıştır`, `değildir`, `beklenmez` vb.) — bu sorularda exp'in başka şıkkı destekliyor olması beklenen davranıştır ve filtrelendi.

**Kriter:** Pozitif-çerçeve sorular için, exp ile correct şık benzerlik skoru, exp ile başka şık benzerlik skorundan ≥0.10 düşükse → `wrong_answer_suspect`.

Sonuç: **44 pozitif-çerçeve şüpheli** (gap ≥ 0.10). Negatif filtre 3 yanlış pozitifi temizledi.

İkinci derin tarama olarak **Pediatri 5500+ batch'inin tamamı** 0.05 eşikle tarandı — 93 ek şüpheli çıktı (68 yüksek + 25 düşük gap).

## 2. Pediatri 5500-5687 Batch Felaketi

### Toplam etki tablosu

| Durum | Sayı | Yorum |
|-------|-----:|-------|
| Batch toplamı | 150 | Pediatri.js son batch (5500 → 5687) |
| OK (sağlıklı) | 41 | %27 |
| OK_negative (negatif soru, beklenen davranış) | 8 | %5 |
| **SUSPECT_high** (gap ≥ 0.10) | **68** | **%45** |
| SUSPECT_low (gap 0.05-0.10) | 25 | %17 |
| UNCERTAIN (gap < 0.05, exp çok kısa veya benzerlik düşük) | 8 | %5 |

Yani batch'in **%62'sinde correct index muhtemelen yanlış**.

### Pattern hipotezi

Ham veri analizi gösteriyor ki `correct` index aşağıdaki gibi kaymış:
- **B ↔ E** (3 step swap)
- **C ↔ D** (1 step swap)

Yani append script'i toplu seçenek karıştırma veya seçenek-listesi yeniden ataması sırasında `correct` index güncellenmemiş gibi görünüyor. Kök neden olarak `scripts/append-pediatri-150.mjs` çalıştırma akışında bir "correct mapping atlandı" hipotezi makul.

### Doğrulanmış 25 örnek (manuel medikal inceleme)

| id | konu | Mevcut correct | exp'in işaret ettiği | Mevcut metnin tıbbi durumu |
|----|------|----------------|------------|-----|
| 5540 | Pediatrik Enfeksiyon | C "Dehidratasyonda oral sıvı kontrendike" | D "Villus epitel lizis + ORS+çinko" | C **tıbben yanlış ifade** |
| 5544 | Pediatrik Enfeksiyon | B "IVIG rutin tüm kızamık olgularında" | E "Yüksek doz Vit A WHO önerisi" | B yanlış, WHO Vit A önerir |
| 5546 | Pediatrik Enfeksiyon | D "Oral amoksisilin BOS yeterli" | C "Sefotaksim + ampisilin" | D **klinik tehlike**, neonatal menenjitte oral yetersiz |
| 5550 | Pediatrik Enfeksiyon | C "Toksoplazmoz + Paul-Bunnell" | D "EBV B lenfosit + kontakt spor riski" | C **tıbben yanlış**, Paul-Bunnell EBV'ye özgü |
| 5559 | Pediatrik Aciller | B "Flumazenil TCA tedavisi" | E "Sodyum bikarbonat" | B **klinik tehlike**, Flumazenil TCA'da kontrendike (nöbet riski) |
| 5561 | Pediatrik Aciller | D "DKA'da hipotonik sıvı 1. seçenek" | C "DKA'da total K eksikliği" | D **tıbben yanlış**, izotonik öncelikli |
| 5562 | Pediatrik Aciller | E "Yabancı cisim → torasentez 1. basamak" | B "Bronkoskopi 1. basamak" | E **klinik tehlike**, bronkoskopi gerekir |
| 5570 | Neonatoloji | C "Konjenital hiperamonyemi → üre döngüsü" | D "Maternal hipergisemi → fetal hiperinsülinizm" | C **tıbben yanlış**, ek olarak vaka senaryosuyla uyumsuz |
| 5587 | Pediatrik Nöroloji | E "Dravet; SCN1A" | B "Benign rolandik epilepsi" | E **tıbben yanlış**, santral-temporal spike+uyku=BRE |
| 5589 | Pediatrik Nöroloji | B "Ergotamin çocukta rutin" | D "Valproat akut atakta 1. seçenek" | B **tıbben yanlış**, ergotamin pediatride önerilmez |
| 5595 | Pediatrik Gastroenteroloji | C "Submukozal polipler" | D "Crohn: transmural granülomatöz" | C **vaka senaryosuyla uyumsuz** |
| 5599 | Pediatrik Gastroenteroloji | B "Kan transfüzyonu" | E "Hane halkı tedavisi" | B **saçma**, pinworm tedavisi kan transfüzyonu olamaz |
| 5601 | Pediatrik Kardiyoloji | D "Primer hipertansiyon" | C "Eisenmenger sendromu" | D **tıbben yanlış**, VSD komplikasyonu Eisenmenger |
| 5614 | Pediatrik Göğüs | B "Astım bronş spazmı" | E "Viskoz sekresyon mukosiliyer" | B **vaka senaryosuyla uyumsuz** (ter testi+elastaz=CF) |
| 5621 | Pediatrik Göğüs | D "T hücre immün yetmezliği" | C "XLA Bruton" | D **tıbben yanlış**, IgG/IgA/IgM düşük=B hücre |
| 5622 | Pediatrik Göğüs | E "İnsülin replasmanı" | B "Anti-IgE/IL5 biyolojik" | E **saçma**, astım tedavisi insülin olamaz |
| 5625 | Pediatrik Nefroloji | C "Amyloid birikimi" | D "Streptokok antijen immün kompleks" | C **vaka senaryosuyla uyumsuz** (boğaz ağrısı + nefrit = PSGN) |
| 5626 | Pediatrik Nefroloji | D "Postinfeksiyöz immün kompleks" | C "Shiga toksini endotel hasarı" | D **tıbben yanlış**, kanlı ishal + HUS triad = Shiga |
| 5627 | Pediatrik Nefroloji | E "Antiviral profilaksi" | B "VUR profilaktik antibiyotik" | E **saçma**, VUR antiviral değil |
| 5632 | Pediatrik Nefroloji | E "Diabetes insipidus" | B "21-hidroksilaz eksikliği" | E **tıbben yanlış**, Na↓ K↑ erkek bebek = klasik 21-OH CAH |
| 5634 | Pediatrik Endokrinoloji | B "Üre döngüsü defekti" | E "Mutlak insülin eksikliği" | B **vaka senaryosuyla uyumsuz** (poliüri+polidipsi+glukoz 412=Tip1 DM) |
| 5639 | Pediatrik Endokrinoloji | B "Feokromositoma" | E "Ekzojen glukokortikoid Cushing" | B **vaka senaryosuyla uyumsuz** (sabah yüksek kortizol + striae = Cushing) |
| 5645 | Pediatrik Hematoloji | C "Geniş spektrumlu antibiyotik" | D "Gözlem veya steroid/IVIG" | C **klinik tehlike**, İTP'de antibiyotik yok |
| 5664 | Beslenme | B "Rekombinant GH" | E "Aile temelli yaşam tarzı" | B **tıbben yanlış**, pediatrik obezite 1. basamak davranış |
| 5677 | Pediatrik İmmünoloji | E "Aylık IVIG" | B "Allerjen kaçınma + epinefrin" | E **saçma**, IgE gıda alerjisinde IVIG yok |

### Klinik tehlike düzeyi

Bu yanlış cevapların bir kısmı **direkt klinik tehlike**:
- **id 5546** — Yenidoğan menenjitte "oral amoksisilin" demek mortaliteyi katlar
- **id 5559** — TCA intox'ta Flumazenil vermek ölümcül nöbet tetikleyebilir
- **id 5562** — Yabancı cisim aspirasyonunda torasentez ölümcül gecikme
- **id 5645** — İTP'de geniş spektrumlu antibiyotik vermek yanlış tedavi

**CLINICAL-SAFETY-AUDITOR çapraz kontrolü:** Bu 4 soru klinik güvenlik açısından da P0 işaretlenmeli.

## 3. Pediatri Batch Dışı Şüpheliler

### id 5252 — Fizyoloji / Üriner Sistem
- Soru: SGLT2 inhibitörü mekanizması
- correct=E "İç medullada ozmotik gradyanı güçlendirerek"
- suspect=A "Kortikal toplayıcı kanalda sodyum geri emilimini durdurarak"
- gap=0.152
- **Karar:** Manuel medikal kontrol. SGLT2i mekanizması proksimal tübülde glikoz emilimini bloklar; ne A ne E tipik doğru cevap. Soru kökü incelemesi gerekir.

### id 2705 — Kadın Hastalıkları ve Doğum / Jinekoloji
- Soru: Acil kontrasepsiyon hangisi etkili?
- correct=E "Bakırlı RİA"
- suspect=C "Levonorgestrel salan RİA"
- gap=0.131
- **Karar:** Bakırlı RİA acil kontrasepsiyonda **en etkili** seçenektir (>%99). Levonorgestrel hap acil kontrasepsiyon olarak kullanılır ama Levonorgestrel **RİA** acil kontrasepsiyon için kullanılmaz (sadece düzenli kontrasepsiyon). Mevcut correct=E **muhtemelen doğru**. exp'i okumadan kesin yargı vermek riskli, manuel kontrol önerilir.

## 4. exp_favors_other_option (P1, audit:questions heuristic)

| id | ders | durum |
|----|------|-------|
| 5329 | Mikrobiyoloji / İmmünoloji | **Yanlış pozitif.** "MHC sınıf I yanlıştır?" — correct=D doğru, exp A şıkkına benziyor çünkü A doğru ifadeyi tekrar ediyor |
| 5570 | Pediatri / Neonatoloji | **Gerçek P0** — yukarıda ele alındı |

## 5. Otomatik Düzeltme Kararı

**Hiçbir correct index otomatik değiştirilmedi.** Sebep:
- Kullanıcı talimatı: "correct index değiştirme konusunda çok dikkatli ol. Tıbbi doğruluktan emin değilsen değiştirme, manual review required olarak bırak."
- 93 sorudaki düzeltme kullanıcı `wrongQuestions`/`favoriteQuestions`/`examResults` kayıtlarını etkiler (fixed exam'ler etkilenmiyor, bu yeşil ışık).
- Toplu correct değişikliği için tek tek tıbbi doğrulama yapılmalıdır.

## 6. Önerilen Workflow

1. Bu raporu **uzman tıbbi validatörle** (pediatrist tercih) gözden geçir.
2. 93 soru için doğru cevabı tek tek doğrula.
3. Düzeltmeleri batch script ile uygula:
   ```js
   // scripts/fix-pediatri-5500-correct-indices.mjs
   const FIXES = [
     { id: 5540, correct: 3 },  // C -> D
     { id: 5544, correct: 4 },  // B -> E
     ...
   ];
   ```
4. `npm run validate:questions && npm run audit:questions && npm run build` çalıştır.
5. Manuel test: PWA'da Pediatri filtresiyle rastgele 20 soru çöz, doğru/yanlış mapping çalışıyor mu kontrol et.
6. Firestore migration GEREK YOK çünkü id'ler değişmiyor, sadece correct index değişiyor. `examResults` içindeki `score` kalan eski snapshot, kullanıcı yeni denerse doğru hesaplanır.

Tam liste: [`wrong_answer_suspects.json`](./wrong_answer_suspects.json)
