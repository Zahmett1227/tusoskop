# Tusoskop Soru Bankası Kalite Denetimi

_Oluşturulma: 2026-05-18T10:06:33.169Z_  
_Bu rapor yapısal ve heuristik sinyaller içerir; tıbbi doğruluk iddiası taşımaz. Kesin olmayan bulgular "manuel kontrol" olarak işaretlenmiştir._  
**Soru bankası dosyalarında otomatik düzeltme yapılmamıştır.**

## Genel Özet

| Metrik | Değer |
|--------|------:|
| Toplam soru | 4114 |
| Ders sayısı | 11 |
| Benzersiz konu (ders+konu) | 156 |
| Kritik bulgu (kayıt) | 0 |
| Orta bulgu (kayıt) | 486 |
| Düşük bulgu (kayıt) | 70 |

### Ders bazlı soru sayısı

| Ders | Soru | Manifest |
|------|-----:|---------:|
| Dahiliye | 678 | 678 |
| Pediatri | 566 | 566 |
| Küçük Stajlar | 475 | 475 |
| Patoloji | 413 | 413 |
| Farmakoloji | 374 | 374 |
| Fizyoloji | 308 | 308 |
| Genel Cerrahi | 280 | 280 |
| Anatomi | 280 | 280 |
| Mikrobiyoloji | 270 | 270 |
| Kadın Hastalıkları ve Doğum | 270 | 270 |
| Biyokimya | 200 | 200 |

### diff dağılımı (genel)

| diff | Adet | % |
|------|-----:|--:|
| 4 | 3193 | 77.6% |
| 5 | 563 | 13.7% |
| 3 | 358 | 8.7% |

> **Uyarı:** Soruların ~77.6% diff=4 değerinde. diff alanı otomatik güvenilir zorluk göstergesi olmayabilir; bu turda diff değiştirilmedi.

### En çok soru olan 20 konu

| Konu | Adet |
|------|-----:|
| Kadın Hastalıkları ve Doğum — Perinatoloji | 89 |
| Dahiliye — Gastroenteroloji | 82 |
| Dahiliye — Endokrinoloji | 82 |
| Dahiliye — Nefroloji | 80 |
| Dahiliye — Kardiyoloji | 80 |
| Dahiliye — Hematoloji | 78 |
| Dahiliye — Hepatoloji | 76 |
| Kadın Hastalıkları ve Doğum — Jinekoloji | 71 |
| Mikrobiyoloji — Bakteriyoloji | 65 |
| Dahiliye — Göğüs Hastalıkları | 62 |
| Dahiliye — Onkoloji | 58 |
| Farmakoloji — Kardiyovasküler Sistem Farmakolojisi | 57 |
| Farmakoloji — Santral Sinir Sistemi Farmakolojisi | 55 |
| Kadın Hastalıkları ve Doğum — Onkoloji | 55 |
| Kadın Hastalıkları ve Doğum — İnfertilite | 55 |
| Pediatri — Pediatrik Enfeksiyon Hastalıkları | 54 |
| Farmakoloji — Endokrin Sistem Farmakolojisi | 53 |
| Dahiliye — Romatoloji | 52 |
| Farmakoloji — Otonom Sinir Sistemi Farmakolojisi | 51 |
| Pediatri — Pediatrik Aciller, Zehirlenmeler ve Yoğun Bakım | 50 |

### Çok az soru olan konular (≤2, ilk 30)

| Konu | Adet |
|------|-----:|
| Pediatri — Pediatrik  İmmünoloji/Alerji | 1 |

### Ders bazında diff dağılımı

**Dahiliye:** 4=533, 5=104, 3=41

**Pediatri:** 4=469, 5=61, 3=36

**Küçük Stajlar:** 4=359, 5=79, 3=37

**Patoloji:** 4=320, 5=74, 3=19

**Farmakoloji:** 4=302, 3=55, 5=17

**Fizyoloji:** 4=243, 5=38, 3=27

**Genel Cerrahi:** 4=186, 5=63, 3=31

**Anatomi:** 4=215, 5=44, 3=21

**Mikrobiyoloji:** 4=218, 5=31, 3=21

**Kadın Hastalıkları ve Doğum:** 4=189, 3=62, 5=19

**Biyokimya:** 4=159, 5=33, 3=8


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
| 631 | Patoloji | Hücre Zedelenmesi | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 651 | Patoloji | Hemodinamik Bozukluklar | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 652 | Patoloji | Hemodinamik Bozukluklar | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 653 | Patoloji | Hemodinamik Bozukluklar | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 669 | Patoloji | Çevresel ve Enfeksiyoz Hastalıklar | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 673 | Patoloji | Vasküler Hastalıklar | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 704 | Patoloji | Kadın Genital Sistem Hastalıkları | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 714 | Patoloji | Karaciğer Hastalıkları | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |
| 724 | Patoloji | Gastrointestinal Sistem Hastalıkları | exp_missing_correct_option_text | Açıklamada doğru şık metni zayıf geçiyor | açıklama–cevap uyumunu kontrol et | evet |

_…ve 436 kayıt daha (tam liste JSON dosyasında)._ 


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
| 4 | Fizyoloji | Genital Sistem HistoFizyolojisi | konu_alias_hint | Konu "Genital Sistem HistoFizyolojisi" — "histo fizyoloji" varyantı da var mı? | standardizasyon | evet |

_…ve 20 kayıt daha (tam liste JSON dosyasında)._ 


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
| 41 | 631 | 85 | exp_missing_correct_option_text |
| 42 | 651 | 85 | exp_missing_correct_option_text |
| 43 | 652 | 85 | exp_missing_correct_option_text |
| 44 | 653 | 85 | exp_missing_correct_option_text |
| 45 | 669 | 85 | exp_missing_correct_option_text |
| 46 | 673 | 85 | exp_missing_correct_option_text |
| 47 | 704 | 85 | exp_missing_correct_option_text |
| 48 | 714 | 85 | exp_missing_correct_option_text |
| 49 | 724 | 85 | exp_missing_correct_option_text |
| 50 | 727 | 85 | exp_missing_correct_option_text |

## En sık görülen problem tipleri (ilk 15)

| Tip | Adet |
|-----|-----:|
| exp_missing_correct_option_text | 475 |
| konu_alias_hint | 30 |
| very_short_option | 24 |
| very_long_option | 7 |
| risky_all_none_option | 5 |
| konu_near_duplicate_name | 4 |
| suspicious_option_phrase | 3 |
| konu_ascii_turkish_hint | 3 |
| unbalanced_brackets_q | 2 |
| konu_double_space | 1 |
| konu_case_or_diacritic_variant | 1 |
| near_duplicate_question | 1 |

## En problemli dersler / konular (bulgu sayısına göre)

**Ders:**
- Dahiliye: 100 bulgu kaydı
- Pediatri: 87 bulgu kaydı
- Farmakoloji: 70 bulgu kaydı
- Patoloji: 61 bulgu kaydı
- Küçük Stajlar: 55 bulgu kaydı
- Fizyoloji: 51 bulgu kaydı
- Genel Cerrahi: 46 bulgu kaydı
- Kadın Hastalıkları ve Doğum: 38 bulgu kaydı
- Biyokimya: 18 bulgu kaydı
- Mikrobiyoloji: 15 bulgu kaydı

**Konu:**
- Dahiliye — Kardiyoloji: 15 bulgu kaydı
- Kadın Hastalıkları ve Doğum — Perinatoloji: 15 bulgu kaydı
- Dahiliye — Hepatoloji: 13 bulgu kaydı
- Farmakoloji — Endokrin Sistem Farmakolojisi: 12 bulgu kaydı
- Dahiliye — Gastroenteroloji: 12 bulgu kaydı
- Dahiliye — Hematoloji: 12 bulgu kaydı
- Kadın Hastalıkları ve Doğum — Jinekoloji: 12 bulgu kaydı
- Dahiliye — Onkoloji: 11 bulgu kaydı
- Farmakoloji — Genel Farmakoloji: 10 bulgu kaydı
- Farmakoloji — Santral Sinir Sistemi Farmakolojisi: 10 bulgu kaydı

## Sonuç ve İlk Düzeltme Önerisi

1. **Önce kritik:** duplicate id, correct aralığı, boş q/exp, aynı soru kökünde farklı correct, geçersiz ders adı.
2. **Sonra orta:** konu adı birleştirme, near-duplicate sorular, açıklama–şık uyumsuzluğu heuristikleri, 5 dışı seçenek sayısı.
3. **Son olarak düşük:** yazım, boşluk, kısa/uzun metin stil tutarlılığı.

Tam bulgu listesi: `reports/question-bank-quality-audit.json`
