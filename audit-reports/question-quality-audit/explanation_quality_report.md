# Explanation Quality Report — SUBAGENT 6 (EXPLANATION-QUALITY-AUDITOR)

## Özet
- Toplam incelenen soru: 5687
- exp boş veya null: 0
- exp ≤20 karakter (çok kısa): 1
- exp doğru şık metnini zayıf içeriyor (heuristik): 740 ← sistematik gözlem
- exp_favors_other_option (yanlış şık desteği): 2
- Açıklama kalitesi P2 bulgu: 743 toplam

## 1. Yapısal Kontroller

| Kontrol | Sonuç |
|---------|------|
| exp boş değil | 5686 ✅ (1 yok denecek kadar kısa) |
| exp ≥20 karakter | 5686 ✅ |
| exp en az 1 kelime | 5687 ✅ |
| exp doğru cevabı tek cümleyle bile olsa anlatıyor (örneklem 50) | ~%85 ✅ |

## 2. Sistematik Kısa Açıklama Gözlemi (P2)

**740 soruda** açıklama doğru şık metnini "zayıf" içeriyor (audit heuristic: kelime kümeleri arası örtüşme düşük). Bu mutlaka "yanlış" anlamına gelmez — çoğu durumda exp eşdeğer ifadeler kullanarak doğru cevabı destekliyor.

### Ders bazlı dağılım

| Ders | Bulgu |
|------|------:|
| Pediatri | 156 |
| Dahiliye | 98 |
| Farmakoloji | 90 |
| Fizyoloji | 84 |
| Mikrobiyoloji | 58 |
| Patoloji | 53 |
| Genel Cerrahi | 50 |
| Kadın Hastalıkları ve Doğum | 49 |
| Küçük Stajlar | 41 |
| Anatomi | 39 |
| Biyokimya | 22 |

### Rastgele örneklem (12 soru, manuel kontrol)

Yapılan örneklem değerlendirmesinde **740 sorudan tahmini %60-70'i kabul edilebilir** (eşdeğer kelimelerle doğru cevabı destekliyor), **%30-40'ı gerçek zayıf**.

### Örnek (id 3019, Patoloji)
- correct=A "CD8 pozitif sitotoksik T lenfositlere"
- exp: "MHC sınıf I tüm çekirdekli hücrelerde bulunur ve endojen antijenleri CD8 T hücrelerine sunar..."
- **Yanlış pozitif:** exp tam doğru cevabı destekliyor ("CD8 T hücreleri" ≈ "CD8 pozitif sitotoksik T lenfositler")

### Örnek (id 5332, Mikrobiyoloji)
- exp: "Beta hemoliz ve bacitracin duyarlılığı Grup A streptokok lehinedir." (67 karakter)
- correct=B "Streptococcus pyogenes"
- **Gerçek kısa:** exp doğru ama çok minimal. **Aksiyon (P3):** 1-2 cümle daha bilgi (örn. ASO yüksekliği, faringit etkeni) eklenebilir.

## 3. exp_favors_other_option (P1 — 2 bulgu)

### id 5329 (Mikrobiyoloji)
- "MHC sınıf I yanlıştır?" — **Yanlış pozitif** (negatif soru, exp doğru ifadeyi tekrarladığı için A'yı destekliyor görünüyor; ancak doğru cevap D "Yalnızca makrofajlarda")

### id 5570 (Pediatri / Neonatoloji)
- **Gerçek P0 wrong-answer** (medical_truth_report.md'de detaylı ele alındı). exp D'yi destekliyor, correct=C işaretli.

## 4. exp Çok Kısa (P2 — 1 bulgu)

Audit script'in tetiklediği: 1 soruda exp <20 karakter. Bu sorunun ID'si all_findings.json'da var.

## 5. exp Boş / Bozuk: 0

## 6. Kalite Değerlendirme Skoru (örneklem)

50 sorudan oluşan manuel örneklem üzerinde:

| Skor | Tanım | Tahmini oran |
|------|-------|------------:|
| 5 | Harika, öğretici, sınav odaklı | ~15% |
| 4 | İyi, küçük geliştirme yeterli | ~35% |
| 3 | Kabul edilebilir ama geliştirilebilir | ~30% |
| 2 | Zayıf, öğrenciye az şey öğretir | ~15% |
| 1 | Boş/hatalı/yanıltıcı | ~5% (çoğu Pediatri batch hatası nedenli) |

## 7. Sistematik İyileştirme Önerileri (P2 — Pedagojik)

1. **"Cevap A" tipi exp YOK** ✅ — havuzda hiç yok, çok iyi
2. **Yanlış seçeneklerin neden yanlış olduğu açıklamada** — şu an havuzun ~%60-70'inde bu yok. Sistematik bir iyileştirme paketi gerekli
3. **Mnemonik/tablo önerisi** — id 4112'de "SNOUT" mnemoniği örnek olarak güzel. Daha çok soruya bu tarz eklenebilir
4. **TUS tarzı tuzak uyarısı** — "Bu soruda dikkat: ..." tarzı bir not eklenmesi pedagojik değeri yükseltir

## 8. Otomatik Düzeltme Kararı

**Hiçbir exp otomatik rewrite edilmedi.** Sebep:
- Açıklama yeniden yazımı **tıbbi anlam değiştirme riski** taşır
- Bu işin uzman tıbbi validatörle yapılması gerekir
- Toplu rewrite için `tusoskop-explanation-editor` subagent çalıştırılmalı (bu rapor, o subagent'ın input'u olabilir)

## 9. Önerilen Sonraki Adım

1. weak_explanations.json'daki 740 sorudan rastgele 100 örneklem manuel okuma
2. Gerçek "kısa/zayıf" oranını ölç
3. Gerçek zayıf olan ~200-300 soru için exp-editor subagent'ına 30-50'lik batch'ler halinde delegasyon
4. Her batch sonrası QC + kullanıcı onayı

Tam liste: [`weak_explanations.json`](./weak_explanations.json) — 743 entry
