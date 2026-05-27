# Difficulty Calibration Report — SUBAGENT 7 (DIFFICULTY-CALIBRATION-AUDITOR)

## Özet
- Toplam incelenen soru: 5687
- diff alanı tip uyumu: %100 integer ✅
- diff 1-5 aralık uyumu: %100 ✅
- **SİSTEMİK P1 BULGU:** diff=1 ve diff=2 hiç yok

## 1. Mevcut Dağılım

| diff | Anlam | Adet | % |
|------|-------|-----:|--:|
| 1 | Çok kolay | **0** | **0.0%** |
| 2 | Kolay | **0** | **0.0%** |
| 3 | Orta | 876 | 15.4% |
| 4 | Zor | **4049** | **71.2%** |
| 5 | Çok zor | 762 | 13.4% |

## 2. Sorun

Bu dağılım pedagojik olarak **kırık**:

- Öğrenci hiç "kolay" düzeyde soru göremiyor
- Soruların %71'i diff=4 — öğrenci sürekli "zor" düzeyle uğraşıyor
- Diff filtresi (varsa) anlamsız — diff=4 seçildiğinde havuzun %71'i geliyor, neredeyse hiç filtreleme etkisi yok
- Adaptive learning sistemi varsa (örn. zor sorularda daha fazla pratik), bu sistem çalışmıyor çünkü gradient yok

## 3. Ders Bazlı diff Dağılımı

| Ders | diff=3 | diff=4 | diff=5 | Toplam |
|------|------:|------:|------:|-----:|
| Pediatri | ~110 | ~530 | ~76 | 716 |
| Dahiliye | ~105 | ~470 | ~103 | 678 |
| Genel Cerrahi | ~90 | ~360 | ~80 | 530 |
| Fizyoloji | ~90 | ~370 | ~68 | 528 |
| Mikrobiyoloji | ~75 | ~360 | ~75 | 510 |
| Kadın Hast. ve Doğum | ~80 | ~360 | ~66 | 506 |
| Farmakoloji | ~75 | ~340 | ~79 | 494 |
| Küçük Stajlar | ~70 | ~340 | ~65 | 475 |
| Biyokimya | ~70 | ~310 | ~60 | 440 |
| Patoloji | ~65 | ~290 | ~58 | 413 |
| Anatomi | ~46 | ~319 | ~32 | 397 |

(yaklaşık dağılım, audit JSON'ında tam veri var)

Tüm derslerde aynı pattern: diff=4 baskın.

## 4. Önerilen Hedef Dağılım

| diff | Hedef % | Hedef ~adet |
|------|--------:|----:|
| 1 | 5% | ~285 |
| 2 | 15% | ~853 |
| 3 | 30% | ~1706 |
| 4 | 35% | ~1991 |
| 5 | 15% | ~853 |

Bu dağılım:
- Yeni başlayan öğrenciye kolay sorularla giriş sağlar
- Orta düzeyde pratik için bol soru sunar
- Zor/çok zor düzey makul oranda kalır

## 5. Otomatik diff Yeniden Etiketleme (UYGULANMADI)

**Hiçbir diff alanı otomatik değiştirilmedi.** Sebep:
- diff bir kullanıcı **filtre kriteri** olabilir
- Toplu diff değişimi mevcut filtreyle etkileşebilir
- Heuristic ile "gerçek zorluk" ölçmek mümkün değil (soru kökü uzunluğu ≠ zorluk; mekanizma derinliği ölçülemez)

## 6. Önerilen Workflow

1. **Manuel örneklem kalibrasyon:** 50 soru rastgele seçilip uzman tarafından 1-5 arası gerçek diff'i belirlenir
2. **Heuristic kalibrasyon:** Kelime sayısı, klinik vaka karmaşıklığı, mekanizma derinliği, çeldirici kalitesi gibi sinyallerle diff tahmin scoring
3. **Toplu yeniden etiketleme:** Her diff bant'ında belirli sayıda soru yeni diff'e atanır
4. **QC sprintleri:** Her ders için ders uzmanı 50 örnek diff doğrular

Bu süreç tek seferlik değil, 2-3 sprint sürer.

## 7. Acil Aksiyon Önerisi

Ufak adım olarak: havuzdaki 5687 sorudan **ham temel bilgi soruları** (daha kısa kök, mekanizma sorgusu içermeyen) çıkarılıp diff=2 etiketlenebilir. Bu yapay zeka asistanlı sınıflandırma ile kolay bir batch işi.

Tam veri: [`diff_change_suggestions.json`](./diff_change_suggestions.json)
