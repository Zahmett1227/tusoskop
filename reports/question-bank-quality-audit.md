# Tusoskop Soru Bankası Kalite Denetimi

_Oluşturulma: 2026-05-24T21:59:03.715Z_  
_Bu rapor yapısal ve heuristik sinyaller içerir; tıbbi doğruluk iddiası taşımaz. Kesin olmayan bulgular "manuel kontrol" olarak işaretlenmiştir._  
**Soru bankası dosyalarında otomatik düzeltme yapılmamıştır.**

## Genel Özet

| Metrik | Değer |
|--------|------:|
| Toplam soru | 5687 |
| Ders sayısı | 11 |
| Benzersiz konu (ders+konu) | 150 |
| Kritik bulgu (kayıt) | 0 |
| Orta bulgu (kayıt) | 755 |
| Düşük bulgu (kayıt) | 71 |

### Ders bazlı soru sayısı

| Ders | Soru | Manifest |
|------|-----:|---------:|
| Pediatri | 716 | 716 |
| Dahiliye | 678 | 678 |
| Genel Cerrahi | 530 | 530 |
| Fizyoloji | 528 | 528 |
| Mikrobiyoloji | 510 | 510 |
| Kadın Hastalıkları ve Doğum | 506 | 506 |
| Farmakoloji | 494 | 494 |
| Küçük Stajlar | 475 | 475 |
| Biyokimya | 440 | 440 |
| Patoloji | 413 | 413 |
| Anatomi | 397 | 397 |

### diff dağılımı (genel)

| diff | Adet | % |
|------|-----:|--:|
| 4 | 4049 | 71.2% |
| 3 | 876 | 15.4% |
| 5 | 762 | 13.4% |

> **Uyarı:** Soruların ~71.2% diff=4 değerinde. diff alanı otomatik güvenilir zorluk göstergesi olmayabilir; bu turda diff değiştirilmedi.

### En çok soru olan 20 konu

| Konu | Adet |
|------|-----:|
| Kadın Hastalıkları ve Doğum — Perinatoloji | 198 |
| Kadın Hastalıkları ve Doğum — Jinekoloji | 143 |
| Mikrobiyoloji — Bakteriyoloji | 111 |
| Kadın Hastalıkları ve Doğum — Onkoloji | 104 |
| Mikrobiyoloji — Viroloji | 87 |
| Dahiliye — Gastroenteroloji | 82 |
| Dahiliye — Endokrinoloji | 82 |
| Dahiliye — Nefroloji | 80 |
| Dahiliye — Kardiyoloji | 80 |
| Dahiliye — Hematoloji | 78 |
| Dahiliye — Hepatoloji | 76 |
| Farmakoloji — Kardiyovasküler Sistem Farmakolojisi | 72 |
| Farmakoloji — Santral Sinir Sistemi Farmakolojisi | 70 |
| Mikrobiyoloji — İmmünoloji | 69 |
| Farmakoloji — Endokrin Sistem Farmakolojisi | 68 |
| Pediatri — Pediatrik Enfeksiyon Hastalıkları | 68 |
| Farmakoloji — Otonom Sinir Sistemi Farmakolojisi | 66 |
| Mikrobiyoloji — Genel Mikrobiyoloji | 65 |
| Mikrobiyoloji — Klinik Mikrobiyoloji | 64 |
| Pediatri — Pediatrik Aciller, Zehirlenmeler ve Yoğun Bakım | 63 |

### Çok az soru olan konular (≤2, ilk 30)

| Konu | Adet |
|------|-----:|
| Pediatri — Pediatrik  İmmünoloji/Alerji | 1 |

### Ders bazında diff dağılımı

**Pediatri:** 4=546, 5=90, 3=80

**Dahiliye:** 4=533, 5=104, 3=41

**Genel Cerrahi:** 4=292, 3=175, 5=63

**Fizyoloji:** 4=368, 3=91, 5=69

**Mikrobiyoloji:** 4=378, 3=78, 5=54

**Kadın Hastalıkları ve Doğum:** 4=290, 3=197, 5=19

**Farmakoloji:** 4=394, 3=80, 5=20

**Küçük Stajlar:** 4=359, 5=79, 3=37

**Biyokimya:** 4=283, 5=100, 3=57

**Patoloji:** 4=320, 5=74, 3=19

**Anatomi:** 4=286, 5=90, 3=21


## Kritik Bulgular

_Bulgu yok._


## Orta Seviye Bulgular

| id | ders | konu | problem | açıklama | aksiyon | manuel |
|---|---|---|---|---|---|---|
| 585 | Fizyoloji | Genel Embriyoloji | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 587 | Fizyoloji | Genel Embriyoloji | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2338 | Fizyoloji | Hücre Histolojisi ve Fizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2340 | Fizyoloji | Hücre Histolojisi ve Fizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2354 | Fizyoloji | Kas Dokusu HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2355 | Fizyoloji | Kas Dokusu HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2356 | Fizyoloji | Kas Dokusu HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2358 | Fizyoloji | Kas Dokusu HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2372 | Fizyoloji | Hematopoetik Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2375 | Fizyoloji | Hematopoetik Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2376 | Fizyoloji | Hematopoetik Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2389 | Fizyoloji | Gastrointestinal Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2398 | Fizyoloji | Kardiyovasküler Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2404 | Fizyoloji | Kardiyovasküler Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2407 | Fizyoloji | Kardiyovasküler Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2418 | Fizyoloji | Endokrin ve Genital Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2424 | Fizyoloji | Endokrin ve Genital Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2433 | Fizyoloji | Endokrin ve Genital Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2446 | Fizyoloji | Solunum Sistemi HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2452 | Fizyoloji | Sinir Sistemi HistoFizyolojisi | risky_all_none_option | options[2]: "Kas iğciklerinin tümünün kaybolması" | TUS uygunluğunu kontrol et | evet |
| 2459 | Fizyoloji | Sinir Sistemi HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2461 | Fizyoloji | Sinir Sistemi HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2476 | Fizyoloji | Üriner Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 2480 | Fizyoloji | Üriner Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3584 | Fizyoloji | Hücre Histolojisi ve Fizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3596 | Fizyoloji | Genital Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3601 | Fizyoloji | Genel Embriyoloji | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3602 | Fizyoloji | Hematopoetik Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3603 | Fizyoloji | Hematopoetik Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3604 | Fizyoloji | Hematopoetik Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3605 | Fizyoloji | Hematopoetik Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3607 | Fizyoloji | Hematopoetik Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3625 | Fizyoloji | Endokrin ve Genital Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3630 | Fizyoloji | Solunum Sistemi HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3634 | Fizyoloji | Solunum Sistemi HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3635 | Fizyoloji | Solunum Sistemi HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3641 | Fizyoloji | Sinir Sistemi HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3642 | Fizyoloji | Sinir Sistemi HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3648 | Fizyoloji | Üriner Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3654 | Fizyoloji | Üriner Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 3655 | Fizyoloji | Baş Boyun Embriyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 4728 | Fizyoloji | Hücre Histolojisi ve Fizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 4737 | Fizyoloji | Kas Dokusu HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 4743 | Fizyoloji | Kas Dokusu HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 4753 | Fizyoloji | Genel Embriyoloji | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 4766 | Fizyoloji | Hematopoetik Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 4767 | Fizyoloji | Hematopoetik Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 4773 | Fizyoloji | Gastrointestinal Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 4776 | Fizyoloji | Gastrointestinal Sistem HistoFizyolojisi | risky_all_none_option | options[2]: "Bikarbonat salınımının tümüyle kaybolması" | TUS uygunluğunu kontrol et | evet |
| 4777 | Fizyoloji | Kardiyovasküler Sistem HistoFizyolojisi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |

_…ve 705 kayıt daha (tam liste JSON dosyasında)._ 


## Düşük Seviye Bulgular

| id | ders | konu | problem | açıklama | aksiyon | manuel |
|---|---|---|---|---|---|---|
| 616 | Fizyoloji | Sinir Sistemi HistoFizyolojisi | very_long_option | options[2] çok uzun (222 karakter) | kısaltmayı değerlendir | evet |
| 662 | Patoloji | Pediatrik Hastalıklar | unbalanced_brackets_q | Parantez/tırnak dengesiz olabilir | noktalama kontrol | evet |
| 730 | Patoloji | Pankreas Hastalıkları | very_long_option | options[2] çok uzun (221 karakter) | kısaltmayı değerlendir | evet |
| 753 | Patoloji | Meme Hastalıkları | unbalanced_brackets_q | Parantez/tırnak dengesiz olabilir | noktalama kontrol | evet |
| 754 | Patoloji | Meme Hastalıkları | very_long_option | options[2] çok uzun (223 karakter) | kısaltmayı değerlendir | evet |
| 765 | Patoloji | Genel Tekrar ve Entegre Vakalar | very_long_option | options[1] çok uzun (222 karakter) | kısaltmayı değerlendir | evet |
| 1511 | Pediatri | Pediatrik Nefroloji | very_long_option | options[2] çok uzun (222 karakter) | kısaltmayı değerlendir | evet |
| 2167 | Pediatri | Pediatrik Aciller, Zehirlenmeler ve Yoğun Bakım | suspicious_option_phrase | options[0]: "Parkland formülü" | terminoloji kontrol | evet |
| 166 | Kadın Hastalıkları ve Doğum | Jinekoloji | suspicious_option_phrase | options[4]: "Taşikardi form" | terminoloji kontrol | evet |
| 1068 | Kadın Hastalıkları ve Doğum | Jinekoloji | very_long_option | options[1] çok uzun (226 karakter) | kısaltmayı değerlendir | evet |
| 1072 | Kadın Hastalıkları ve Doğum | Jinekoloji | very_long_option | options[2] çok uzun (249 karakter) | kısaltmayı değerlendir | evet |
| 4600 | Kadın Hastalıkları ve Doğum | Jinekoloji | very_long_option | options[1] çok uzun (233 karakter) | kısaltmayı değerlendir | evet |
| 1367 | Küçük Stajlar | Beyin Cerrahisi | very_short_option | options[0] çok kısa: "7" | seçeneği gözden geçir | evet |
| 1367 | Küçük Stajlar | Beyin Cerrahisi | very_short_option | options[1] çok kısa: "6" | seçeneği gözden geçir | evet |
| 1367 | Küçük Stajlar | Beyin Cerrahisi | very_short_option | options[2] çok kısa: "8" | seçeneği gözden geçir | evet |
| 1367 | Küçük Stajlar | Beyin Cerrahisi | very_short_option | options[4] çok kısa: "9" | seçeneği gözden geçir | evet |
| 1380 | Küçük Stajlar | Anestezi | suspicious_option_phrase | options[4]: "Dalga form kapnografi" | terminoloji kontrol | evet |
| 1435 | Küçük Stajlar | Halk Sağlığı | very_short_option | options[2] çok kısa: "1" | seçeneği gözden geçir | evet |
| 1435 | Küçük Stajlar | Halk Sağlığı | very_short_option | options[4] çok kısa: "5" | seçeneği gözden geçir | evet |
| 1437 | Küçük Stajlar | Halk Sağlığı | very_short_option | options[3] çok kısa: "2" | seçeneği gözden geçir | evet |
| 1437 | Küçük Stajlar | Halk Sağlığı | very_short_option | options[4] çok kısa: "5" | seçeneği gözden geçir | evet |
| 1802 | Küçük Stajlar | Halk Sağlığı | very_short_option | options[0] çok kısa: "4" | seçeneği gözden geçir | evet |
| 1250 | Biyokimya | Karbonhidratlar | very_short_option | options[0] çok kısa: "1" | seçeneği gözden geçir | evet |
| 1250 | Biyokimya | Karbonhidratlar | very_short_option | options[2] çok kısa: "6" | seçeneği gözden geçir | evet |
| 1250 | Biyokimya | Karbonhidratlar | very_short_option | options[3] çok kısa: "4" | seçeneği gözden geçir | evet |
| 1250 | Biyokimya | Karbonhidratlar | very_short_option | options[4] çok kısa: "0" | seçeneği gözden geçir | evet |
| 1303 | Biyokimya | Aminoasitler | very_short_option | options[1] çok kısa: "C" | seçeneği gözden geçir | evet |
| 1337 | Biyokimya | Vitaminler | very_short_option | options[0] çok kısa: "K" | seçeneği gözden geçir | evet |
| 1338 | Biyokimya | Vitaminler | very_short_option | options[0] çok kısa: "A" | seçeneği gözden geçir | evet |
| 1338 | Biyokimya | Vitaminler | very_short_option | options[2] çok kısa: "K" | seçeneği gözden geçir | evet |
| 1338 | Biyokimya | Vitaminler | very_short_option | options[4] çok kısa: "E" | seçeneği gözden geçir | evet |
| 1339 | Biyokimya | Vitaminler | very_short_option | options[0] çok kısa: "E" | seçeneği gözden geçir | evet |
| 1339 | Biyokimya | Vitaminler | very_short_option | options[2] çok kısa: "K" | seçeneği gözden geçir | evet |
| 1339 | Biyokimya | Vitaminler | very_short_option | options[3] çok kısa: "D" | seçeneği gözden geçir | evet |
| 1340 | Biyokimya | Vitaminler | very_short_option | options[0] çok kısa: "E" | seçeneği gözden geçir | evet |
| 1340 | Biyokimya | Vitaminler | very_short_option | options[2] çok kısa: "D" | seçeneği gözden geçir | evet |
| 1340 | Biyokimya | Vitaminler | very_short_option | options[3] çok kısa: "A" | seçeneği gözden geçir | evet |
| — | Pediatri | Pediatrik  İmmünoloji/Alerji | konu_double_space | "Pediatrik  İmmünoloji/Alerji" | boşlukları düzelt | hayır |
| — | Küçük Stajlar | Beyin Cerrahi | konu_ascii_turkish_hint | Türkçe karakter eksik olabilir | yazım kontrol | evet |
| — | Küçük Stajlar | Beyin Cerrahisi | konu_ascii_turkish_hint | Türkçe karakter eksik olabilir | yazım kontrol | evet |
| — | Genel Cerrahi | Cerrahi Enfeksiyonlar ve Komplikasyonlar | konu_ascii_turkish_hint | Türkçe karakter eksik olabilir | yazım kontrol | evet |
| 76 | Dahiliye | Geriartri | konu_alias_hint | Konu "Geriartri" — "geriatri" varyantı da var mı? | standardizasyon | evet |
| 17 | Patoloji | İmmunoloji | konu_alias_hint | Konu "İmmunoloji" — "immün" varyantı da var mı? | standardizasyon | evet |
| 49 | Farmakoloji | Kemoterapotikler ve İmmunmodülatörler | konu_alias_hint | Konu "Kemoterapotikler ve İmmunmodülatörler" — "immün" varyantı da var mı? | standardizasyon | evet |
| 55 | Mikrobiyoloji | İmmünoloji | konu_alias_hint | Konu "İmmünoloji" — "immün" varyantı da var mı? | standardizasyon | evet |
| 144 | Pediatri | Pediatrik İmmünoloji/Alerji | konu_alias_hint | Konu "Pediatrik İmmünoloji/Alerji" — "immün" varyantı da var mı? | standardizasyon | evet |
| 1702 | Pediatri | Pediatrik İmmünoloji | konu_alias_hint | Konu "Pediatrik İmmünoloji" — "immün" varyantı da var mı? | standardizasyon | evet |
| 49 | Farmakoloji | Kemoterapotikler ve İmmunmodülatörler | konu_alias_hint | Konu "Kemoterapotikler ve İmmunmodülatörler" — "kemoterapötik" varyantı da var m | standardizasyon | evet |
| 316 | Genel Cerrahi | Appendix Hastalıkları | konu_alias_hint | Konu "Appendix Hastalıkları" — "apendiks" varyantı da var mı? | standardizasyon | evet |
| 3 | Fizyoloji | Kas Dokusu HistoFizyolojisi | konu_alias_hint | Konu "Kas Dokusu HistoFizyolojisi" — "histo fizyoloji" varyantı da var mı? | standardizasyon | evet |

_…ve 21 kayıt daha (tam liste JSON dosyasında)._ 


## Konu Adı Standardizasyon Önerileri

| id | ders | konu | problem | açıklama | aksiyon | manuel |
|---|---|---|---|---|---|---|
| — | Patoloji | Üriner Sistem Hastalıkları | konu_near_duplicate_name | "Üriner Sistem Hastalıkları" ~ "Sinir Sistem Hastalıkları" (88%) | konu adlarını birleştir | evet |
| — | Dahiliye | Hepatoloji | konu_near_duplicate_name | "Hepatoloji" ~ "Hematoloji" (90%) | konu adlarını birleştir | evet |
| — | Pediatri | Pediatrik  İmmünoloji/Alerji | konu_double_space | "Pediatrik  İmmünoloji/Alerji" | boşlukları düzelt | hayır |
| — | Pediatri | Pediatrik Nöroloji | konu_near_duplicate_name | "Pediatrik Nöroloji" ~ "Pediatrik Nefroloji" (89%) | konu adlarını birleştir | evet |
| — | Pediatri | Pediatrik İmmünoloji/Alerji | konu_case_or_diacritic_variant | "Pediatrik İmmünoloji/Alerji" vs "Pediatrik  İmmünoloji/Alerji" | tek konu adına birleştir | evet |
| — | Küçük Stajlar | Beyin Cerrahi | konu_ascii_turkish_hint | Türkçe karakter eksik olabilir | yazım kontrol | evet |
| — | Küçük Stajlar | Beyin Cerrahisi | konu_ascii_turkish_hint | Türkçe karakter eksik olabilir | yazım kontrol | evet |
| — | Küçük Stajlar | Dermatoloji | konu_near_duplicate_name | "Dermatoloji" ~ "Dermotoloji" (91%) | konu adlarını birleştir | evet |
| — | Genel Cerrahi | Cerrahi Enfeksiyonlar ve Komplikasyonlar | konu_ascii_turkish_hint | Türkçe karakter eksik olabilir | yazım kontrol | evet |
| — | Genel Cerrahi | Gis Kanamaları | konu_case_or_diacritic_variant | "Gis Kanamaları" vs "GIS Kanamaları" | tek konu adına birleştir | evet |


## Manuel Kontrol İçin Öncelikli 50 Soru

| Sıra | id | öncelik skoru | problem tipleri |
|-----:|---:|---:|---|
| 1 | 585 | 85 | exp_missing_correct_option_text |
| 2 | 587 | 85 | exp_missing_correct_option_text |
| 3 | 2338 | 85 | exp_missing_correct_option_text |
| 4 | 2340 | 85 | exp_missing_correct_option_text |
| 5 | 2354 | 85 | exp_missing_correct_option_text |
| 6 | 2355 | 85 | exp_missing_correct_option_text |
| 7 | 2356 | 85 | exp_missing_correct_option_text |
| 8 | 2358 | 85 | exp_missing_correct_option_text |
| 9 | 2372 | 85 | exp_missing_correct_option_text |
| 10 | 2375 | 85 | exp_missing_correct_option_text |
| 11 | 2376 | 85 | exp_missing_correct_option_text |
| 12 | 2389 | 85 | exp_missing_correct_option_text |
| 13 | 2398 | 85 | exp_missing_correct_option_text |
| 14 | 2404 | 85 | exp_missing_correct_option_text |
| 15 | 2407 | 85 | exp_missing_correct_option_text |
| 16 | 2418 | 85 | exp_missing_correct_option_text |
| 17 | 2424 | 85 | exp_missing_correct_option_text |
| 18 | 2433 | 85 | exp_missing_correct_option_text |
| 19 | 2446 | 85 | exp_missing_correct_option_text |
| 20 | 2459 | 85 | exp_missing_correct_option_text |
| 21 | 2461 | 85 | exp_missing_correct_option_text |
| 22 | 2476 | 85 | exp_missing_correct_option_text |
| 23 | 2480 | 85 | exp_missing_correct_option_text |
| 24 | 3584 | 85 | exp_missing_correct_option_text |
| 25 | 3596 | 85 | exp_missing_correct_option_text |
| 26 | 3601 | 85 | exp_missing_correct_option_text |
| 27 | 3602 | 85 | exp_missing_correct_option_text |
| 28 | 3603 | 85 | exp_missing_correct_option_text |
| 29 | 3604 | 85 | exp_missing_correct_option_text |
| 30 | 3605 | 85 | exp_missing_correct_option_text |
| 31 | 3607 | 85 | exp_missing_correct_option_text |
| 32 | 3625 | 85 | exp_missing_correct_option_text |
| 33 | 3630 | 85 | exp_missing_correct_option_text |
| 34 | 3634 | 85 | exp_missing_correct_option_text |
| 35 | 3635 | 85 | exp_missing_correct_option_text |
| 36 | 3641 | 85 | exp_missing_correct_option_text |
| 37 | 3642 | 85 | exp_missing_correct_option_text |
| 38 | 3648 | 85 | exp_missing_correct_option_text |
| 39 | 3654 | 85 | exp_missing_correct_option_text |
| 40 | 3655 | 85 | exp_missing_correct_option_text |
| 41 | 4728 | 85 | exp_missing_correct_option_text |
| 42 | 4737 | 85 | exp_missing_correct_option_text |
| 43 | 4743 | 85 | exp_missing_correct_option_text |
| 44 | 4753 | 85 | exp_missing_correct_option_text |
| 45 | 4766 | 85 | exp_missing_correct_option_text |
| 46 | 4767 | 85 | exp_missing_correct_option_text |
| 47 | 4773 | 85 | exp_missing_correct_option_text |
| 48 | 4777 | 85 | exp_missing_correct_option_text |
| 49 | 4778 | 85 | exp_missing_correct_option_text |
| 50 | 4786 | 85 | exp_missing_correct_option_text |

## En sık görülen problem tipleri (ilk 15)

| Tip | Adet |
|-----|-----:|
| exp_missing_correct_option_text | 740 |
| konu_alias_hint | 30 |
| very_short_option | 24 |
| very_long_option | 8 |
| risky_all_none_option | 6 |
| konu_near_duplicate_name | 4 |
| suspicious_option_phrase | 3 |
| konu_ascii_turkish_hint | 3 |
| unbalanced_brackets_q | 2 |
| exp_favors_other_option | 2 |
| konu_case_or_diacritic_variant | 2 |
| konu_double_space | 1 |
| near_duplicate_question | 1 |

## En problemli dersler / konular (bulgu sayısına göre)

**Ders:**
- Pediatri: 176 bulgu kaydı
- Dahiliye: 100 bulgu kaydı
- Fizyoloji: 96 bulgu kaydı
- Farmakoloji: 92 bulgu kaydı
- Patoloji: 61 bulgu kaydı
- Mikrobiyoloji: 61 bulgu kaydı
- Genel Cerrahi: 56 bulgu kaydı
- Küçük Stajlar: 55 bulgu kaydı
- Kadın Hastalıkları ve Doğum: 53 bulgu kaydı
- Anatomi: 39 bulgu kaydı

**Konu:**
- Kadın Hastalıkları ve Doğum — Perinatoloji: 22 bulgu kaydı
- Pediatri — Neonatoloji: 20 bulgu kaydı
- Farmakoloji — Endokrin Sistem Farmakolojisi: 18 bulgu kaydı
- Pediatri — Pediatrik Enfeksiyon Hastalıkları: 18 bulgu kaydı
- Pediatri — Pediatrik Nefroloji: 17 bulgu kaydı
- Kadın Hastalıkları ve Doğum — Jinekoloji: 17 bulgu kaydı
- Pediatri — Pediatrik Aciller, Zehirlenmeler ve Yoğun Bakım: 16 bulgu kaydı
- Farmakoloji — Genel Farmakoloji: 15 bulgu kaydı
- Dahiliye — Kardiyoloji: 15 bulgu kaydı
- Fizyoloji — Hematopoetik Sistem HistoFizyolojisi: 14 bulgu kaydı

## Sonuç ve İlk Düzeltme Önerisi

1. **Önce kritik:** duplicate id, correct aralığı, boş q/exp, aynı soru kökünde farklı correct, geçersiz ders adı.
2. **Sonra orta:** konu adı birleştirme, near-duplicate sorular, açıklama–şık uyumsuzluğu heuristikleri, 5 dışı seçenek sayısı.
3. **Son olarak düşük:** yazım, boşluk, kısa/uzun metin stil tutarlılığı.

Tam bulgu listesi: `reports/question-bank-quality-audit.json`
