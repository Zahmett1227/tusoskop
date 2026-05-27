# Patch Plan A + C2 + C3 — Uygulama Raporu

**Tarih:** 2026-05-27  
**Branch:** `fix/pediatri-correct-index-audit`  
**Önceki commit:** `e1b831f` (Pediatri 41 P0 correct-index düzeltmesi)

Bu rapor `patch_plan.md` dosyasındaki **A (konu standardizasyonu)**, **C2 (id 1037 near-duplicate)** ve **C3 (non-Pediatri P1 manuel kontrol)** maddelerinin uygulamasını belgeler.

---

## A. Konu Adı Standardizasyonu (8 rename, 161 soru etkilendi)

### A.1 — Konu adı standardizasyonu (4 rename)

| Mevcut | Yeni | Ders | Etkilenen soru |
|---|---|---|---|
| `Geriartri` | `Geriatri` | Dahiliye | 28 |
| `Dermotoloji` | `Dermatoloji` | Küçük Stajlar | 19 (mevcut `Dermatoloji` 17 ile birleşti → 36) |
| `Pediatrik  İmmünoloji/Alerji` (çift boşluk) | `Pediatrik İmmünoloji/Alerji` | Pediatri | 1 (kanonik isimle birleşti) |
| `Gis Kanamaları` | `GIS Kanamaları` | Genel Cerrahi | 10 (mevcut `GIS Kanamaları` 7 ile birleşti → 17) |

### A.2 — ASCII → Türkçe + birleştirme (4 rename)

| Mevcut | Yeni | Ders | Etkilenen soru |
|---|---|---|---|
| `İmmunoloji` | `İmmünoloji` | Patoloji | 14 |
| `Kemoterapotikler ve İmmunmodülatörler` | `Kemoterapötikler ve İmmünomodülatörler` | Farmakoloji | 62 |
| `Appendix Hastalıkları` | `Apendiks Hastalıkları` | Genel Cerrahi | 14 |
| `Pediatrik İmmünoloji` | `Pediatrik İmmünoloji/Alerji` | Pediatri | 13 (kanonik isimle birleşti) |

### A — TopicTrackerData.js güncellenmeleri (6 entry)

| ID | Eski konu | Yeni konu |
|---|---|---|
| `patoloji-4` | `İmmunoloji` | `İmmünoloji` |
| `dahiliye-10` | `Geriartri` | `Geriatri` |
| `farmakoloji-7` | `Kemoterapotikler ve İmmunmodülatörler` | `Kemoterapötikler ve İmmünomodülatörler` |
| `genel-cerrahi-14` | `Appendix Hastalıkları` | `Apendiks Hastalıkları` |
| `genel-cerrahi-27` | `Gis Kanamaları` | `GIS Kanamaları` |
| `kucuk-stajlar-13` | `Dermotoloji` | `Dermatoloji` |

### Doğrulama: birleşen konuların yeni sayıları

| Ders | Konu | Yeni soru sayısı |
|---|---|---|
| Dahiliye | Geriatri | 28 |
| Küçük Stajlar | Dermatoloji | 36 (=17 + 19) |
| Pediatri | Pediatrik İmmünoloji/Alerji | 32 (=18 + 13 + 1) |
| Genel Cerrahi | Apendiks Hastalıkları | 14 |
| Genel Cerrahi | GIS Kanamaları | 17 (=7 + 10) |
| Patoloji | İmmünoloji | 14 |
| Farmakoloji | Kemoterapötikler ve İmmünomodülatörler | 62 |

### Kullanıcı verisi etkisi

- **Firestore migration GEREKMEZ.** `topicTrackerData/{uid}` Firestore belgelerinde eski konu adıyla mevcut kayıtlar varsa, frontend `TRACKER_TOPICS` ile filtrelediği için bu kayıtlar "orphan" hale gelir ve `TopicTrackerView` ekranında görüntülenmez. Kullanıcılar yeni konu adında **sıfırdan başlar** (toplam 8 konu için).
- **localStorage `topicStudyMemory`** kayıtlarındaki eski konu adlı entry'ler `topicStudyMemory.js` içindeki `available count > 0` filtresinde elenir; tekrar konu seçimiyle kendiliğinden yeni isimle yeniden oluşur.
- **fixedExams**, **examResults**, **wrongQuestions**, **favoriteQuestions** etkilenmez (bunlar soru `id` üzerinden çalışır).

### A.2'de uygulanmayan öneri

Plan'daki `Patoloji → İmmünoloji` (önceki Patoloji.İmmunoloji) ile `Mikrobiyoloji.İmmünoloji`'nin **birleştirilmemesi** doğru karar: bunlar **farklı ders altında farklı pedagojik bağlamlar** (Patoloji'de doku/hücresel immün hastalıklar; Mikrobiyoloji'de antikor/aşı). Sadece imla düzeltildi, birleştirme yapılmadı.

---

## C2. id 1037 → Tinea pedis vakası olarak yeniden yazıldı

**Sorun:** id 1037 (`Mikrobiyoloji / Mikoloji`) ile id 969 (aynı ders/konu) %93 metin benzerliğine sahipti — her ikisi de güreşçi öğrencide Tinea corporis vakası, aynı `correct`, neredeyse aynı `exp`. Kullanıcı aynı soruyla iki kez karşılaşıyordu.

**Çözüm:** id 1037'nin klinik bağlamı **Tinea pedis (atlet ayağı)** olarak değiştirildi. Mekanizma sorgusu (dermatofit keratinofili) **korundu** — pedagojik amaç değişmedi, sadece klinik prezentasyon farklılaştırıldı.

### Değişen alanlar

| Alan | Önce (Tinea corporis) | Sonra (Tinea pedis) |
|---|---|---|
| `q` (vaka) | Lise güreş takımı + gövde + ringworm | Yüzme havuzu kullanan üniversite öğrencisi + parmak araları + maserasyon + koku |
| `options[A-E]` | Hafif rötuş (anlam korundu) | Aynı 5 mekanizma şıkkı (C-keratinofili doğru) |
| `exp` | Tinea corporis odaklı | Tinea pedis odaklı, T. rubrum etken, mekanizma aynı |
| `correct` | 2 (C) | **2 (C) — değişmedi** |

### Sabit kalanlar
- `id` (1037)
- `ders` (Mikrobiyoloji)
- `konu` (Mikoloji)
- `diff` (4)
- Şıkların sayısı (5) ve sırası
- Doğru cevabın indeksi (C, keratinofili)
- Pedagojik öğretim hedefi (dermatofit yüzeysel kalış mekanizması)

---

## C3. Non-Pediatri P1 Wrong-Answer Manuel Kontrolü

### id 5252 (Fizyoloji / Üriner Sistem HistoFizyolojisi)

Patch plan "SGLT2 mekanizması" diye etiketlemiş ama gerçek soru **üre geri dönüşümü** ile ilgili. Tam metin incelemesi:

- **Soru:** Açlıkta protein yıkımı artan hastada böbrek medullasında üre geri dönüşümünün artması idrarın yoğunlaştırılmasına hangi yolla katkı sağlar?
- **Mevcut correct:** E (4) — "İç medullada ozmotik gradyanı güçlendirerek"
- **exp:** "Üre iç medüller toplayıcı kanaldan interstisyuma geçip Henle kulpuna geri döner. Bu döngü iç medullanın hipertonisitesini artırarak su geri emilimini ve idrar yoğunlaşmasını destekler."

**Karar:** **Düzeltme gerekmez.** correct=E tıbben kesin doğru; exp ve şık birebir uyumlu. Audit script'in P1 işareti yanlış pozitif. Patch plan'ın "SGLT2" yorumu da yanlış (soru SGLT2 ile alakasız).

### id 2705 (Kadın Hastalıkları ve Doğum / Jinekoloji)

- **Soru:** Bakırlı RİA takılmasından sonraki aylarda adet kanaması ve dismenoresi artan hastada enfeksiyon bulgusu yok. Bu yan etki hangi yöntemle daha tipiktir?
- **Mevcut correct:** E (4) — "Bakırlı RİA"
- **exp:** "Bakırlı RİA kanama miktarı ve krampı artırabilir. Levonorgestrel salan RİA ise genellikle kanama miktarını azaltır."

**Karar:** **Düzeltme gerekmez.** correct=E tıbben doğru; exp tutarlı. Soru tasarımı biraz tautolojik ("Bakırlı RİA takılan hastanın yan etkisi → Bakırlı RİA'da daha tipik") ancak tıbbi içerik doğru ve sıkça TUS tipi karşılaştırma sorularında bu format kullanılır. Düşük öncelikli kozmetik rewrite önerilebilir ama bu görev kapsamı dışında.

---

## Kontroller

| Komut | Sonuç |
|---|---|
| `npm run validate:questions` | ✅ PASS — 5687 soru / 11 ders |
| `npm run test` | ✅ PASS — 296/296 |
| `npm run build` | ✅ PASS — built in 975ms |

---

## Değiştirilen Dosyalar

| Dosya | Değişiklik | Etki |
|---|---|---|
| `src/data/questionChunks/dahiliye.js` | konu rename | 28 soru |
| `src/data/questionChunks/kucuk_stajlar.js` | konu rename | 19 soru |
| `src/data/questionChunks/pediatri.js` | konu rename (2 varyant) | 14 soru |
| `src/data/questionChunks/genel_cerrahi.js` | konu rename (2 varyant) | 24 soru |
| `src/data/questionChunks/patoloji.js` | konu rename | 14 soru |
| `src/data/questionChunks/farmakoloji.js` | konu rename | 62 soru |
| `src/data/questionChunks/mikrobiyoloji.js` | id 1037 q+options+exp yeniden yazıldı (Tinea pedis) | 1 soru |
| `src/data/TopicTrackerData.js` | 6 entry konu adı güncellendi | 6 tracker satırı |

**Toplam:** 162 soru konu adı standardize edildi + 1 soru klinik bağlamı yenilendi.

---

## Dokunulmayanlar

- ❌ `_manifest.json` — soru sayıları zaten doğru (160 ders sayıları korundu)
- ❌ `subjects.js` — ders adları değişmedi
- ❌ `fixedExams/*` — id'ler korundu
- ❌ `exams.js` (setVersion bump GEREKMEDİ)
- ❌ Pediatri 5500+ correct-index'leri (önceki commit'te yapıldı)
- ❌ id 5252 ve 2705 (tıbben doğru, düzeltme gereksiz)
- ❌ Frontend kodu, Firebase, firestore.rules

---

## Sonraki Öneri (yine bu görevin DIŞINDA)

- `weak_explanations.json` — 740 P2 öneriden gerçek "kısa exp" olanların manuel filtrelemesi
- `risky_all_none_option` — 6 zayıf çeldirici rewrite
- `difficulty_calibration` — sistemik diff dağılımı yeniden etiketleme (uzun süreçli)
- `Patoloji → "Solunum Sistem Hastallıkları"` typo'su (`patoloji-12` TRACKER_TOPICS satırında) — A turuna dahil değildi, ileri sprintte değerlendirilebilir
