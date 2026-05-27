# Schema Audit Report — SUBAGENT 1 (DATA-SCHEMA-AUDITOR)

## Özet
- Toplam incelenen soru: 5687
- Schema P0 bulgu: **0**
- Schema P1 bulgu: 0
- Konu format P2: 8 bulgu
- Konu format P3: 29 bulgu

## 1. Yapısal Kontroller (Hepsi Geçti)

`npm run validate:questions` script çıktısı:

```
Question bank validation passed: 5687 questions across 11 subjects.
```

Bu kontrol şunları doğruladı:

| Kontrol | Sonuç |
|---------|------|
| id integer + benzersiz (5687 unique id) | ✅ |
| ders alanı subjects.js ile birebir eşleşiyor | ✅ |
| Manifest `subjectCounts` ↔ gerçek soru sayısı | ✅ (tam eşleşme) |
| options dizi, length ≥ 2 (gerçekte hepsi 5) | ✅ |
| correct integer + 0..(options.length-1) aralığında | ✅ |
| q, exp non-empty string | ✅ |
| konu non-empty string | ✅ |
| diff 1-5 aralığında | ✅ |
| `SUBJECT` export'u (chunk dosyasında varsa) manifest ile uyumlu | ✅ |

## 2. JS Syntax Sağlığı

Tüm 11 chunk dosyası (`anatomi.js`, `biyokimya.js`, `dahiliye.js`, `farmakoloji.js`, `fizyoloji.js`, `genel_cerrahi.js`, `kad_n_hastal_klar_ve_dogum.js`, `kucuk_stajlar.js`, `mikrobiyoloji.js`, `patoloji.js`, `pediatri.js`) Vite dinamik import'unu sorunsuz geçti.

- **Eksik virgül/bracket:** 0
- **Smart quotes (build kıran):** 0
- **Encoding bozukluğu:** 0
- **Control karakteri (`\x00`-`\x1f`):** 0
- **`undefined`/`null`/`NaN`/`[object Object]` ham token:** 0

## 3. Parantez Dengesi (Düşük güven uyarısı)

| id | ders | konu | not |
|----|------|------|-----|
| 662 | Patoloji | Pediatrik Hastalıklar | Soru kökünde tek tırnak içinde tek tırnak (`'Trifazik (3 fazlı)'`) — build kırmıyor, görsel uyarı |
| 753 | Patoloji | Meme Hastalıkları | Aynı pattern, yanlış pozitif olabilir |

**Aksiyon:** Yok. Yanlış pozitif olarak işaretlendi.

## 4. Konu Adı Standardizasyon Sorunları (P2/P3)

### P2 — Aynı konunun farklı yazımı

| ders | varyant A | varyant B | öneri |
|------|-----------|-----------|-------|
| Pediatri | `Pediatrik İmmünoloji/Alerji` | `Pediatrik  İmmünoloji/Alerji` (çift boşluk) | A'da birleştir |
| Genel Cerrahi | `Gis Kanamaları` | `GIS Kanamaları` | "GIS Kanamaları" tercih edilir (TUS standardı) |
| Küçük Stajlar | `Dermatoloji` | `Dermotoloji` (typo) | "Dermatoloji" doğru |
| Dahiliye | (sadece "Geriartri") | — | "Geriatri" doğru yazım |
| Pediatri | `Pediatrik İmmünoloji/Alerji` | `Pediatrik İmmünoloji` (varyant) | birleştir |
| Patoloji | `İmmunoloji` | (önerilen "İmmünoloji") | Türkçe karakter ekle |
| Farmakoloji | `Kemoterapotikler ve İmmunmodülatörler` | — | "Kemoterapötikler ve İmmünomodülatörler" |
| Genel Cerrahi | `Appendix Hastalıkları` | — | "Apendiks Hastalıkları" (TUS Türkçesi) |

### P3 — Estetik

- 30 `konu_alias_hint` (Türkçe karakter eksikliği önerisi)
- 4 `konu_near_duplicate_name` (Hepatoloji↔Hematoloji, Pediatrik Nöroloji↔Pediatrik Nefroloji, Üriner Sistem↔Sinir Sistemi Hastalıkları — gerçek farklı konular, yanlış pozitif **3'ü**; sadece Dermatoloji↔Dermotoloji gerçek typo)

## 5. Otomatik Düzeltme Önerisi (UYGULANMADI)

Aşağıdaki "güvenli A grubu" düzeltmeler **TopicTracker performans kayıtlarına bağlı oldukları için** bu turda otomatik uygulanmadı:

```diff
- konu: "Pediatrik  İmmünoloji/Alerji"   // (çift boşluk)
+ konu: "Pediatrik İmmünoloji/Alerji"

- konu: "Gis Kanamaları"
+ konu: "GIS Kanamaları"

- konu: "Dermotoloji"
+ konu: "Dermatoloji"

- konu: "Geriartri"
+ konu: "Geriatri"
```

**TopicTracker engeli:** `src/data/TopicTrackerData.js` içinde `TRACKER_TOPICS` listesi sabit konu adları içeriyor (`{ id, ders, konu }`). Eğer chunk içindeki `konu` standardize edilirken `TRACKER_TOPICS` güncellenmezse, kullanıcının performans kayıtları (Firestore'da konu adıyla yazılı) yetim kalır.

**Önerilen güvenli workflow:**
1. `TRACKER_TOPICS` içindeki standardize hedef adları doğrula (örn. "Geriatri" var mı?)
2. Migration script yaz: eski konu adı → yeni konu adı eşleştirmesi
3. Firestore migration: kullanıcı `topicTrackerData/{uid}` belgelerinde eski konu adı varsa yeniyle değiştir
4. Chunk dosyalarında konu adlarını standardize et
5. validate + test + build çalıştır

Bu turda sadece **rapor** üretildi.

## 6. Sonuç

Schema yapısı **çok sağlıklı**. Hiçbir P0 yapısal hata yok. Veri formatı production-grade. Yalnızca konu adı standardizasyonu önerisi kaldı, o da TopicTracker etkileşimi nedeniyle migration gerektiriyor.

Tam liste: [`schema_audit_findings.json`](./all_findings.json) (filter: `agent === "DATA-SCHEMA-AUDITOR"` veya `agent === "SUBJECT-TOPIC-MAPPING-AUDITOR"`)
