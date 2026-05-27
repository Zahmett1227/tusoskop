# Patch Plan — SUBAGENT 15 (PATCH-PLANNER)

> Bu plan, tüm subagent raporlarını birleştirip uygulanabilir düzeltme rehberi sağlar. **Bu turda hiçbir düzeltme kod tarafına UYGULANMADI.** Aşağıdaki adımları açık kullanıcı onayıyla uygulayın.

---

## A. Güvenle Otomatik Düzeltilebilir (Bu Turda UYGULANMADI)

### A.1 Konu Adı Standardizasyonu (P2/P3) — 4 kalem

| Mevcut | Önerilen | Ders | Soru sayısı |
|--------|----------|------|------------:|
| `Geriartri` | `Geriatri` | Dahiliye | ? (kontrol) |
| `Dermotoloji` | `Dermatoloji` | Küçük Stajlar | ? (kontrol) |
| `Pediatrik  İmmünoloji/Alerji` (çift boşluk) | `Pediatrik İmmünoloji/Alerji` | Pediatri | 1 |
| `Gis Kanamaları` | `GIS Kanamaları` | Genel Cerrahi | ? (kontrol) |

**ENGEL:** TopicTracker performans kayıtları konu adına bağlı.
- `src/data/TopicTrackerData.js` aynı zamanda güncellenmeli
- Firestore migration gerekli (kullanıcı `topicTrackerData/{uid}` belgelerinde eski konu adları)

**Önerilen uygulama:**
```js
// scripts/migrate-konu-names.mjs
const RENAMES = {
  "Geriartri": "Geriatri",
  "Dermotoloji": "Dermatoloji",
  "Pediatrik  İmmünoloji/Alerji": "Pediatrik İmmünoloji/Alerji",
  "Gis Kanamaları": "GIS Kanamaları",
};
// 1) Chunk dosyalarında konu adlarını güncelle
// 2) TopicTrackerData.js TRACKER_TOPICS'te ilgili kayıtları güncelle
// 3) (İsteğe bağlı) Firestore migration scripti çalıştır
// 4) npm run validate:questions && npm run build
```

### A.2 ASCII → Türkçe Konu Standardizasyonu (P3) — 4 kalem

| Mevcut | Önerilen | Ders |
|--------|----------|------|
| `İmmunoloji` | `İmmünoloji` | Patoloji |
| `Kemoterapotikler ve İmmunmodülatörler` | `Kemoterapötikler ve İmmünomodülatörler` | Farmakoloji |
| `Appendix Hastalıkları` | `Apendiks Hastalıkları` | Genel Cerrahi |
| `Pediatrik İmmünoloji` | `Pediatrik İmmünoloji/Alerji` (birleştir) | Pediatri |

A.1 ile aynı süreç.

---

## B. Dikkatli Otomatik Düzeltilebilir (Manuel Onay Gerekli)

### B.1 Çok Kısa Açıklamalar (P2) — ~50 soru

`weak_explanations.json` içindeki **gerçek kısa exp**'leri (manuel filtre sonrası ~50-100 soru) `tusoskop-explanation-editor` subagent ile 30-50'lik batch halinde yeniden yaz.

**Önerilen workflow:**
1. weak_explanations.json'dan rastgele 30 örnekle test et
2. Yanlış pozitif oranını ölç (~%50-70)
3. Gerçek zayıf ~200-300 soru için subagent batch'leri uygula
4. Her batch sonrası QC + kullanıcı onayı

### B.2 6 Risky All-None Çeldirici (P2)

`option_quality_report.md` listesi. Manuel rewrite ile çeldiriciler iyileştirilebilir.

---

## C. Manuel Tıbbi Onay Gerekir

### C.1 🚨 PEDIATRİ 5500-5687 BATCH CORRECT-INDEX DÜZELTMESİ (P0)

**TOPLAM: 93 SORU**

Bu, raporun **en kritik** öğesi. Detay: `medical_truth_report.md`

#### Önerilen patch script

```js
// scripts/fix-pediatri-5500-correct-indices.mjs
import { readFile, writeFile } from 'node:fs/promises';

// Manuel tıbbi onay alınmış doğru cevaplar (örnek - tam liste 93 satır olacak)
const FIXES = [
  { id: 5540, oldCorrect: 2, newCorrect: 3, note: 'Rotavirus: ORS kontrendike yanlış, gerçek=ORS+çinko' },
  { id: 5544, oldCorrect: 1, newCorrect: 4, note: 'Kızamık: IVIG değil, Vit A WHO önerisi' },
  { id: 5546, oldCorrect: 3, newCorrect: 2, note: 'Neonatal menenjit: oral amoksisilin yanlış, Sefotaksim+Ampi' },
  { id: 5550, oldCorrect: 2, newCorrect: 3, note: 'EBV mononukleoz: Paul-Bunnell EBV testidir' },
  { id: 5559, oldCorrect: 1, newCorrect: 4, note: 'TCA intox: Flumazenil kontrendike, NaHCO3' },
  { id: 5561, oldCorrect: 3, newCorrect: 2, note: 'DKA: hipotonik sıvı 1. seçenek değil, K eksikliği önemli' },
  { id: 5562, oldCorrect: 4, newCorrect: 1, note: 'Yabancı cisim: torasentez değil, bronkoskopi' },
  { id: 5570, oldCorrect: 2, newCorrect: 3, note: 'DM bebek hipoglisemi: maternal hiperglisemi → fetal hiperinsülinizm' },
  { id: 5587, oldCorrect: 4, newCorrect: 1, note: 'Santral-temporal spike+uyku = BRE, Dravet değil' },
  { id: 5589, oldCorrect: 1, newCorrect: 3, note: 'Pediatrik migren: Ergotamin rutin yok, Valproat profilaktik' },
  { id: 5595, oldCorrect: 2, newCorrect: 3, note: 'Crohn: transmural granülomatöz inflamasyon' },
  { id: 5599, oldCorrect: 1, newCorrect: 4, note: 'Pinworm: kan transfüzyonu saçma, hane halkı tedavisi' },
  { id: 5601, oldCorrect: 3, newCorrect: 2, note: 'VSD komplikasyonu: Eisenmenger, primer HT değil' },
  { id: 5614, oldCorrect: 1, newCorrect: 4, note: 'CF: viskoz sekresyon, astım değil' },
  { id: 5621, oldCorrect: 3, newCorrect: 2, note: 'XLA Bruton, T hücre değil' },
  { id: 5622, oldCorrect: 4, newCorrect: 1, note: 'Astım biyolojik: Anti-IgE/IL5, insülin değil' },
  { id: 5626, oldCorrect: 3, newCorrect: 2, note: 'HUS: Shiga toksini, postinfeksiyöz değil' },
  { id: 5627, oldCorrect: 4, newCorrect: 1, note: 'VUR: profilaktik antibiyotik, antiviral değil' },
  { id: 5632, oldCorrect: 4, newCorrect: 1, note: 'CAH: 21-hidroksilaz, DI değil' },
  { id: 5639, oldCorrect: 1, newCorrect: 4, note: 'Iatrogenik Cushing, feokromositoma değil' },
  { id: 5645, oldCorrect: 2, newCorrect: 3, note: 'İTP: gözlem/steroid/IVIG, antibiyotik değil' },
  { id: 5664, oldCorrect: 1, newCorrect: 4, note: 'Pediatrik obezite: yaşam tarzı, GH değil' },
  { id: 5677, oldCorrect: 4, newCorrect: 1, note: 'IgE gıda alerjisi: kaçınma+epinefrin, IVIG değil' },
  // ... 70 satır daha (manuel tıbbi onay sonrası)
];

const chunkPath = './src/data/questionChunks/pediatri.js';
let content = await readFile(chunkPath, 'utf8');

for (const fix of FIXES) {
  // Soru block'unu bul (id: <id>)
  const regex = new RegExp(`(\\{[^}]*?id:\\s*${fix.id}[^}]*?correct:\\s*)${fix.oldCorrect}([^}]*?\\})`, 's');
  const before = content;
  content = content.replace(regex, `$1${fix.newCorrect}$2`);
  if (before === content) {
    console.error(`PATCH FAILED for id ${fix.id} (no match or correct already different)`);
  } else {
    console.log(`✓ id ${fix.id}: correct ${fix.oldCorrect} → ${fix.newCorrect} (${fix.note})`);
  }
}

await writeFile(chunkPath, content, 'utf8');
console.log('Wrote', chunkPath);
```

#### Workflow

1. **Önce uzman tıbbi onay:** Pediatrist + Acil Tıp + Çocuk Endokrin uzmanı çapraz onayı (en güvenlisi 2-3 uzman)
2. Onay alınan ID'ler için patch script'i finalize et
3. **GİT BRANCH AÇ** — `git checkout -b fix/pediatri-5500-correct-indices`
4. Script'i çalıştır
5. `npm run validate:questions` ✅
6. `npm run audit:questions` — wrong_answer_suspect bulguları 93 → ~5 düşmeli
7. `npm run build` ✅
8. PR aç, code review

#### setVersion bump GEREKSİZ

Fixed exam analizinde gösterildi: hiçbir fixed exam Pediatri 5500-5687 ID'lerini kullanmıyor.

#### Kullanıcı geçmişi etkisi

- `examResults`: Eski snapshot'lar olduğu gibi kalır (puan değişmez)
- `wrongQuestions`: Yanlış cevap nedeniyle eklenmiş olanlar artık doğru sayılır — bu istenilen davranış
- `favoriteQuestions`: Etkilenmez

### C.2 id 1037 ↔ id 969 Near-Duplicate (P1)

**Karar matrisi:**

| Seçenek | Risk | Tavsiye |
|---------|------|---------|
| id 1037'yi sil | id silme yasak | ❌ |
| id 1037'yi farklı klinik bağlama göre rewrite et | Düşük | ✅ ÖNERİLEN |
| id 1037'yi olduğu gibi bırak | Kullanıcı %93 aynı soruyla iki kez karşılaşır | ❌ |

**Önerilen rewrite:** id 1037'yi `Tinea capitis` (saç) veya `Tinea pedis` (ayak mantarı) vakası olarak yeniden yaz, dermatofit keratinofili mekanizmasını aynı şekilde sorgulamaya devam et.

### C.3 Non-Pediatri P1 Wrong-Answer Şüphelileri

- **id 5252 (Fizyoloji / Üriner)** — SGLT2 mekanizması, manuel kontrol
- **id 2705 (KHD / Jinekoloji)** — Bakırlı RIA acil kontrasepsiyon, manuel kontrol

---

## D. Şimdilik Dokunma (Do Not Touch Yet)

### D.1 Diff Kalibrasyonu Toplu Yeniden Etiketleme

5687 soruda diff bandı yeniden ayarlanması gerek (`difficulty_calibration_report.md`). Bu işlem:
- Heuristik geliştirme + manuel kalibrasyon sprintleri gerektirir
- 2-3 sprint sürer
- Tek seferlik patch değil

### D.2 740 exp_missing_correct_option_text Toplu Rewrite

`weak_explanations.json` — manuel filtrelemeden önce dokunma. Yanlış pozitif oranı yüksek (~%60).

### D.3 30 konu_alias_hint Türkçe Standardize

`subject_topic_suggestions.json` — TopicTracker migration plan'ı yapılmadan dokunma.

---

## E. Bu Turda Uygulanan Otomatik Düzeltmeler

**Hiçbiri.** Tüm bulgular rapor/öneri olarak kalır.

Sebepler:
1. P0 wrong-answer (93 soru) — uzman tıbbi onay gerekli
2. Konu standardizasyonu — TopicTracker migration gerekli
3. exp rewrite — uzman onay + bach orkestrasyonu gerekli
4. Diff kalibrasyonu — uzun süreçli kalibrasyon gerekli

---

## F. Önerilen Sıralama (Kullanıcının Yol Haritası)

1. **Sprint 1 (acil):** Pediatri 5500+ batch correct düzeltmesi (uzman onayı + patch script + branch + PR)
2. **Sprint 2:** id 1037 rewrite + 2 non-Pediatri wrong-answer kontrolü
3. **Sprint 3:** TopicTracker migration plan + konu standardizasyonu
4. **Sprint 4 (uzun vadeli):** Diff kalibrasyon batch'leri
5. **Sprint 5 (uzun vadeli):** Exp rewrite paketi (`tusoskop-explanation-editor` ile)
6. **Sprint 6:** Option quality (6 risky_all_none) rewrite

---

## G. JSON Çıktı Dizini

| Dosya | İçerik |
|-------|--------|
| `safe_auto_fixes.json` | A grubu (boş — uygulanmadı, plan A.1+A.2 açıklamaları içeriyor) |
| `needs_manual_review.json` | C grubu (93 wrong-answer + 1 near-duplicate + 2 non-Pediatri) |
| `do_not_touch_yet.json` | D grubu (diff, exp rewrite, konu standardize) |
| `p0_critical_findings.json` | 42 P0 (Pediatri batch yüksek-güven) |
| `p1_high_findings.json` | 30 P1 |
| `all_findings.json` | Tüm 895 finding |
