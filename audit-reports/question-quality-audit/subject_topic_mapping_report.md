# Subject-Topic Mapping Report — SUBAGENT 4 (SUBJECT-TOPIC-MAPPING-AUDITOR)

## Özet
- Toplam incelenen soru: 5687
- ders alanı subjects.js uyumu: **%100** ✅
- Konu standardizasyon önerisi: 37 bulgu
- TopicTracker etkileşim riski: yüksek (her konu adı değişikliği migration gerektirir)

## 1. Ders Adı Uyumu (P0 RİSKİ YOK)

Tüm 5687 sorunun `ders` alanı `src/data/subjects.js` içindeki 11 isimden biriyle **birebir** eşleşiyor:

```
Anatomi, Fizyoloji, Biyokimya, Mikrobiyoloji, Patoloji, Farmakoloji,
Dahiliye, Pediatri, Genel Cerrahi, Kadın Hastalıkları ve Doğum, Küçük Stajlar
```

- "Kadın Doğum" / "KHD" varyasyonu yok ✅
- Türkçe karakter farkı yok ✅
- Görünmez unicode karakter yok ✅
- Boşluk farkı yok ✅

`SUBJECT_QUESTION_COUNTS` manifest ile gerçek soru sayıları **birebir eşleşiyor**. Dashboard ders sayımlarında risk yok.

## 2. Konu Standardizasyon Önerileri (P2/P3)

### A. Aynı konunun farklı yazımı (P2)

| Ders | Mevcut varyantlar | Önerilen standart |
|------|-------------------|-------------------|
| Pediatri | `Pediatrik İmmünoloji/Alerji` + `Pediatrik  İmmünoloji/Alerji` (çift boşluk) | `Pediatrik İmmünoloji/Alerji` |
| Pediatri | `Pediatrik İmmünoloji/Alerji` + `Pediatrik İmmünoloji` | Tek isimde birleştir |
| Genel Cerrahi | `Gis Kanamaları` + `GIS Kanamaları` | `GIS Kanamaları` (TUS standardı, hep büyük harf) |
| Küçük Stajlar | `Dermatoloji` + `Dermotoloji` (typo) | `Dermatoloji` |

### B. Türkçe karakter eksikliği (P3)

| Ders | Mevcut | Önerilen | Risk |
|------|--------|----------|------|
| Dahiliye | `Geriartri` | `Geriatri` | Düşük (typo) |
| Patoloji | `İmmunoloji` | `İmmünoloji` | Düşük |
| Farmakoloji | `Kemoterapotikler ve İmmunmodülatörler` | `Kemoterapötikler ve İmmünomodülatörler` | Düşük |
| Genel Cerrahi | `Appendix Hastalıkları` | `Apendiks Hastalıkları` | Orta (İng → Tr) |
| Mikrobiyoloji | `İmmünoloji` | (zaten doğru) | — |
| Pediatri | `Pediatrik İmmünoloji/Alerji` | (zaten doğru) | — |

### C. Yanlış pozitif near-duplicate konu adları

Bunlar gerçekten **farklı konular**, audit heuristiği aldatıyor:

| Ders | Heuristic uyarısı | Gerçek durum |
|------|-------------------|--------------|
| Patoloji | "Üriner Sistem Hastalıkları" ~ "Sinir Sistem Hastalıkları" | Gerçek farklı konular |
| Dahiliye | "Hepatoloji" ~ "Hematoloji" | Gerçek farklı konular |
| Pediatri | "Pediatrik Nöroloji" ~ "Pediatrik Nefroloji" | Gerçek farklı konular |
| Küçük Stajlar | "Dermatoloji" ~ "Dermotoloji" | **Gerçek typo** — düzeltilmeli |

## 3. TopicTracker Etkileşim Riski

`src/data/TopicTrackerData.js` içindeki `TRACKER_TOPICS` listesi sabit konu adlarına bağlı:

```js
{ id: "patoloji-4", ders: "Patoloji", konu: "İmmunoloji" },  // dikkat: "İmmunoloji"
```

Eğer chunk içinde "İmmunoloji" → "İmmünoloji" yaparsak, `TRACKER_TOPICS`'i de güncellemediğimiz takdirde **Patoloji İmmünoloji konusunun performans takibi kopar**. Firestore'da yazılı kayıtlar eski isimle kalır.

**Önerilen migration (otomatik UYGULANMADI):**

1. `TRACKER_TOPICS` içinde standardize edilecek konuları eşle
2. Migration script:
   ```js
   // scripts/migrate-konu-names.mjs
   const RENAMES = {
     "Geriartri": "Geriatri",
     "Dermotoloji": "Dermatoloji",
     "İmmunoloji": "İmmünoloji",
     "Gis Kanamaları": "GIS Kanamaları",
     "Pediatrik  İmmünoloji/Alerji": "Pediatrik İmmünoloji/Alerji",
   };
   ```
3. Chunk dosyalarında konu adlarını güncelle (sadece `konu:` alanı, başka şey yok)
4. `TRACKER_TOPICS` listesini güncelle
5. (İsteğe bağlı) Firestore `topicTrackerData/{uid}` belgelerinde anahtar adlarını güncelleyen Cloud Function veya Firebase rule

## 4. Dersler Arası "Gri Alan" Soruları

Manuel medikal kontrol gerektiren gri alanlar:
- **"Sepsis tedavisi" konulu sorular** Dahiliye/Pediatri yaş bazlı dağılım uygun
- **"Pnömoni etkenleri" soruları** Mikrobiyoloji/Klinik soru tipine göre uygun
- **"Kanser patogenezi" Patoloji, tedavisi Dahiliye/Genel Cerrahi** — havuzda doğru dağılmış

Bu konularda audit hiçbir yanlış sınıflandırma bulamadı.

## 5. Sonuç

ders-konu mapping yapısı **çok sağlıklı**. ders adı uyumu kusursuz. Konu adı standardizasyonu önerileri var ama hepsi TopicTracker migration gerektiriyor. **Bu turda otomatik düzeltme yapılmadı.**

Tam liste: [`subject_topic_suggestions.json`](./subject_topic_suggestions.json)
