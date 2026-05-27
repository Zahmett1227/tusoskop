# TUS Exam Relevance Report — SUBAGENT 3 (TUS-EXAM-RELEVANCE-AUDITOR)

## Özet
- Toplam incelenen soru: 5687
- TUS uyumsuzluk P1 bulgu: 0 (yapısal); ancak Pediatri 5500+ batch'inde klinik düşünme akışı bozuk olduğu için bu sorular TUS niyetine ulaşamıyor
- Vaka kökü kalitesi: yüksek (ortalama 280+ karakter, tam cümleli)
- Telegrafik/`;`-list yapı: nadir (<%5)

## 1. Soru Tipi Dağılımı (örneklem 200 soru)

| Soru tipi | Tahmini oran |
|----------|------------:|
| Klinik vaka + mekanizma sorusu | ~60% |
| Klinik vaka + tanı/yönetim | ~25% |
| Bilgi/Mekanizma sorusu (klinik bağlam minimum) | ~10% |
| Yanlıştır/hangisi değildir | ~5% |

Bu dağılım TUS sınav formatına yakın — vaka tabanlı + mekanizma sorgulayan tarz.

## 2. TUS-Uyumlu Vaka Kökü Yapısı

`tusoskop-question-generation` cursor rule'undaki kapı:
- Vaka kökü ≥220 karakter (kontrol)
- Set ortalama ≥280 (kontrol)
- Telegrafik `;`-listesi ≤%5 (kontrol)

**Örnek başarılı vaka kökü (id 5544):**
> "Dört yaşındaki erkek çocuk, dört gündür yükselen ateş, öksürük, konjonktivit ve morbiliform döküntü ile getiriliyor. Aşı kayıtları incelendiğinde KKK aşısı yapılmadığı görülüyor. Muayenede bukkal mukozada Koplik lekeleri, yaygın makülopapüler döküntü ve bilateral konjonktival enjeksiyon saptanıyor. Bu ağır seyirli kızamık tablosunda mortalite ve komplikasyon riskini azaltmada ek tedavinin temel biyolojik gerekçesi aşağıdakilerden hangisidir?"

Bu çok güçlü TUS vaka kökü: demografi + öykü + muayene + tanı çerçevesi + mekanizma sorgusu. Talimat eşiklerinin üstünde.

## 3. TUS-Uyumlu Konu Dağılımı

Top 20 konu (en çok soru):
- Pediatri: Pediatrik Enfeksiyon, Pediatrik Nefroloji, Pediatrik Nöroloji, Pediatrik Aciller, Neonatoloji
- Dahiliye: Kardiyoloji, Gastroenteroloji, Hepatoloji, Hematoloji, Endokrinoloji, Onkoloji
- Farmakoloji: Endokrin, Otonom, Santral Sinir Sistemi, Kemoterapötikler
- Patoloji: Pediatrik, Meme, Üriner, GIS
- Genel Cerrahi: Şok, Dalak, Özefagus, Travma

Bunlar gerçek TUS çekirdek konuları. **Yığılma sorunu yok.**

## 4. Soru-Bazlı TUS Uyumsuzluğu

### should_rewrite (P2 — soru kökü yeniden yazımı önerisi)

Bu turda **manuel uzman onayı** olmadan bireysel soru "should_rewrite" işaretlemesi yapılmadı. Sebep: heuristic ile "TUS niyeti karşılayıp karşılamadığı" objektif ölçülemez.

Yine de **batch felaketi** (Pediatri 5500-5687) tüm bu soruları yeniden gözden geçirme kapsamına alıyor.

### low_yield_questions (P3)

`audit:questions` çıktısı **çok az soru olan konular** (≤2 soru):
- 30 konu ≤2 soru içeriyor
- Bunlar TUS kapsamında "düşük verim" değil; çoğu spesifik alt başlık (örn. "Tropikal Cerrahi") doğal olarak dar

## 5. High-Yield TUS Konuları

Aşağıdaki konular havuzda **bol** (her biri ≥100 soru):
- Kardiyoloji (Dahiliye)
- Gastroenteroloji
- Hepatoloji
- Endokrinoloji (Dahiliye + Pediatri)
- Neonatoloji
- Pediatrik Enfeksiyon
- Pediatrik Nefroloji
- Mikrobiyoloji Bakteriyoloji
- Farmakoloji genel + sistem alt grupları

Bu dağılım TUS ağırlığıyla uyumlu.

## 6. Sonuç

TUS uyumu yapısal olarak **iyi**. Tek kritik sorun **Pediatri 5500+ batch'indeki yanlış cevap salgını** — bu sorular TUS tarzında yazılmış AMA yanlış correct index nedeniyle öğrenme amacına ters çalışıyor.

Tam liste: [`all_findings.json`](./all_findings.json) (filter: `agent === "TUS-EXAM-RELEVANCE-AUDITOR"`)
