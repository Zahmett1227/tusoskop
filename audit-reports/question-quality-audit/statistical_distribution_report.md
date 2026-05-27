# Statistical Distribution Report — SUBAGENT 14 (STATISTICAL-DISTRIBUTION-AUDITOR)

## Özet
- Toplam soru: 5687
- Ders sayısı: 11
- Benzersiz konu (ders+konu): 150
- diff dağılımı: ⚠️ kalibrasyon problemi (diff=1,2 yok)
- Temel / Klinik dengesi: dengeli

## 1. Ders Bazlı Soru Sayısı

| Ders | Tip | Soru | % |
|------|-----|-----:|--:|
| Pediatri | Klinik | 716 | 12.6% |
| Dahiliye | Klinik | 678 | 11.9% |
| Genel Cerrahi | Klinik | 530 | 9.3% |
| Fizyoloji | Temel | 528 | 9.3% |
| Mikrobiyoloji | Temel | 510 | 9.0% |
| Kadın Hast. ve Doğum | Klinik | 506 | 8.9% |
| Farmakoloji | Temel | 494 | 8.7% |
| Küçük Stajlar | Klinik | 475 | 8.4% |
| Biyokimya | Temel | 440 | 7.7% |
| Genel Cerrahi | Klinik | 530 | 9.3% |
| Patoloji | Temel | 413 | 7.3% |
| Anatomi | Temel | 397 | 7.0% |

### Temel / Klinik dengesi

- **Temel (Anatomi, Biyokimya, Farmakoloji, Fizyoloji, Mikrobiyoloji, Patoloji):** 2782 soru — %48.9
- **Klinik (Dahiliye, Pediatri, Genel Cerrahi, Kadın Hast. ve Doğum, Küçük Stajlar):** 2905 soru — %51.1

TUS sınavında 100 Temel + 100 Klinik blueprint'i için **dengeli** ✅. 200 soruluk denemede her bantı doldurmak için yeterli.

## 2. Konu Bazlı Top 20

| Sıra | Ders | Konu | Adet |
|-----:|------|------|-----:|
| 1 | KHD | Perinatoloji | 198 |
| 2 | KHD | Jinekoloji | 143 |
| 3 | Mikrobiyoloji | Bakteriyoloji | 111 |
| 4 | KHD | Onkoloji | 104 |
| 5 | Mikrobiyoloji | Viroloji | 87 |
| 6 | Dahiliye | Gastroenteroloji | 82 |
| 7 | Dahiliye | Endokrinoloji | 82 |
| 8 | Dahiliye | Nefroloji | 80 |
| 9 | Dahiliye | Kardiyoloji | 80 |
| 10 | Dahiliye | Hematoloji | 78 |
| 11 | Dahiliye | Hepatoloji | 76 |
| 12 | Farmakoloji | Kardiyovasküler | 72 |
| 13 | Farmakoloji | Santral Sinir Sist | 70 |
| 14 | Mikrobiyoloji | İmmünoloji | 69 |
| 15 | Farmakoloji | Endokrin | 68 |
| 16 | Pediatri | Pediatrik Enfeksiyon | 68 |
| 17 | Farmakoloji | Otonom Sinir Sist | 66 |
| 18 | Mikrobiyoloji | Genel Mikrobiyoloji | 65 |
| 19 | Mikrobiyoloji | Klinik Mikrobiyoloji | 64 |
| 20 | Pediatri | Pediatrik Aciller | 63 |

**Yorum:** Top 20 konular TUS yüksek-verim alanları. Yığılma sorunu yok.

## 3. Benzersiz Konu Sayısı

- 150 benzersiz `ders + konu` kombinasyonu
- En az 1 soru olan konu sayısı: 150
- ≤2 soru olan konu sayısı: 1 (Pediatri "Pediatrik  İmmünoloji/Alerji" çift boşluk varyantı)

**Yorum:** Konu dağılımı çok dağınık değil. Aşırı niş alt başlık yok.

## 4. diff Dağılımı (GENEL)

| diff | Adet | % |
|------|-----:|--:|
| 1 | **0** | **0.0%** ⚠️ |
| 2 | **0** | **0.0%** ⚠️ |
| 3 | 876 | 15.4% |
| 4 | 4049 | 71.2% |
| 5 | 762 | 13.4% |

**⚠️ KRİTİK SİSTEMİK BULGU:** difficulty_calibration_report.md'de detaylı ele alındı. diff=1 ve diff=2 hiç yok.

## 5. Ders Bazında diff Dağılımı

Tüm derslerde aynı pattern: diff=4 baskın, diff=1-2 yok. Kalibrasyon problemi global, herhangi bir ders bazlı düzeltme yetmez.

## 6. Eksik / Çok Az Soru Olan Konular

| Konu | Adet |
|------|-----:|
| Pediatri — Pediatrik İmmünoloji/Alerji (çift boşluk variant) | 1 |

Tek "≤2 soru" konu — bu da yazım varyasyonu, gerçek eksiklik değil.

## 7. TUS Blueprint'e Göre Eksikler

200 soruluk TUS deneme blueprint'i:
- 100 Temel: Anatomi 12, Fizyoloji 22, Biyokimya 11, Mikrobiyoloji 16, Patoloji 18, Farmakoloji 21
- 100 Klinik: Dahiliye 24, Pediatri 24, Genel Cerrahi 13, Kadın Hast. ve Doğum 14, Küçük Stajlar 25

Havuzda her ders için **bu blueprint'i kapsayacak** soru sayısı mevcut (✅). En düşük orandaki Anatomi'de bile 397 soru var — bu 200'lük sette 12 Anatomi sorusu çekmek rahatlıkla yapılabilir.

## 8. Mini Test Üretimi

20-30 soruluk mini test üretiminde aşırı konu tekrarı riski: düşük. Top 5 konuda 80-200 soru var, mini testin tekrar üretimleri makul çeşitlilikle olur.

## 9. Coverage Gaps

| Alan | Mevcut soru | Durum |
|------|------:|-------|
| Anatomi - Genel | 397 | Yeterli |
| Pediatri - Genel | 716 | Çok güçlü |
| Mikrobiyoloji - İmmünoloji | 69 | Yeterli |
| Farmakoloji - Sistem alt grupları | ~70 her biri | Yeterli |
| Genel Cerrahi - Travma | (alt konu) | Yeterli |
| Küçük Stajlar - Dermatoloji | (alt konu) | Yeterli |

**Sonuç:** Coverage'da boşluk **yok**. Her büyük alan yeterli soru ile temsil ediliyor.

## 10. Sonuç

Soru havuzu büyüklük ve dağılım açısından **mükemmel**. Tek sistemik problem: diff kalibrasyonu.

Tam veriler: [`subject_counts.json` (mevcut all_findings içinde)](./all_findings.json), [`topic_counts.json`](./all_findings.json), [`difficulty_distribution.json`](./diff_change_suggestions.json)
