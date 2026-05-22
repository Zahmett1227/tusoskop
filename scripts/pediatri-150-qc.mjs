import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const draftPath = "c:/Users/ahmet/OneDrive/Masaüstü/TUSOSKOP informations/pediatri_150_taslak.json";
const reportPath = "c:/Users/ahmet/OneDrive/Masaüstü/TUSOSKOP informations/pediatri_150_kalite_kontrol_raporu.md";

const draft = JSON.parse(readFileSync(draftPath, "utf8"));
const newQs = draft.questions;

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function jaccard(a, b) {
  const wa = new Set(norm(a).split(" ").filter((w) => w.length > 3));
  const wb = new Set(norm(b).split(" ").filter((w) => w.length > 3));
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / (wa.size + wb.size - inter || 1);
}

const { QUESTIONS: bankQs } = await import(
  pathToFileURL(path.join(root, "src/data/questionChunks/pediatri.js")).href
);

const formatErrors = [];
for (const q of newQs) {
  if (q.ders !== "Pediatri") formatErrors.push(`${q.id}: ders`);
  if (!Array.isArray(q.options) || q.options.length !== 5) formatErrors.push(`${q.id}: options`);
  if (q.correct < 0 || q.correct > 4) formatErrors.push(`${q.id}: correct`);
  if (q.diff < 1 || q.diff > 5) formatErrors.push(`${q.id}: diff`);
}

const dupBatch = [];
for (let i = 0; i < newQs.length; i++) {
  for (let j = i + 1; j < newQs.length; j++) {
    const sim = jaccard(newQs[i].q, newQs[j].q);
    if (sim >= 0.65) dupBatch.push({ a: newQs[i].id, b: newQs[j].id, sim: sim.toFixed(2) });
  }
}

const dupBank = [];
for (const nq of newQs) {
  for (const bq of bankQs) {
    const sim = jaccard(nq.q, bq.q);
    if (sim >= 0.72 || norm(nq.q) === norm(bq.q)) {
      dupBank.push({ id: nq.id, bankId: bq.id, sim: sim.toFixed(2) });
    }
  }
}

const lens = newQs.map((q) => q.q.length);
const avgLen = Math.round(lens.reduce((a, b) => a + b, 0) / lens.length);
const vakaLike = newQs.filter(
  (q) =>
    !q.q.includes("yanlıştır") &&
    (q.q.includes("yaş") || q.q.includes("bebek") || q.q.includes("çocuk") || q.q.includes("yenidoğan"))
);
const vakaLens = vakaLike.map((q) => q.q.length);
const vakaAvg = vakaLens.length ? Math.round(vakaLens.reduce((a, b) => a + b, 0) / vakaLens.length) : 0;
const shortVaka = vakaLike.filter((q) => q.q.length < 220);
const telegraphic = newQs.filter((q) => (q.q.match(/;/g) || []).length >= 3 && q.q.length < 280);

const mechanism = newQs.filter((q) =>
  /mekanizma|patofizyoloj|temel neden|en iyi açıklar|kritik basamak|birinci basamak.*gerekçe/i.test(q.q)
);

const verdict =
  formatErrors.length === 0 &&
  dupBank.filter((d) => parseFloat(d.sim) >= 0.85).length === 0 &&
  shortVaka.length <= 2 &&
  avgLen >= 280
    ? "EKLENEBİLİR"
    : "DÜZELTME GEREKLİ";

const report = `# Pediatri 150 — Kalite Kontrol Raporu (rev3)

**Tarih:** 2026-05-22  
**Revizyon:** TUS/USMLE tarzı uzun vaka kökleri — telegrafik format düzeltildi  
**Pipeline:** writer → medical-validator → tus-alignment-reviewer → format-data-guard → duplicate-auditor → explanation-editor → final-reviewer  
**Durum:** taslak-onay-bekliyor  
**Bankaya eklenmedi.**

## Özet

| Alan | rev2 (eski) | rev3 (yeni) |
|------|-------------|-------------|
| Ortalama kök uzunluğu | ~96 karakter | **${avgLen} karakter** |
| Vaka ortalama uzunluk | ~120 | **${vakaAvg} karakter** |
| Kök <220 (vaka-benzeri) | 122/150 | **${shortVaka.length}/${vakaLike.length}** |
| Telegrafik (; listesi) | çok | **${telegraphic.length}** |
| Mekanizma odaklı soru | az | **${mechanism.length}/150** |
| Yanlıştır | 22 | ${draft.distribution?.yanlisTarzi ?? 20} |
| diff 3/4/5 | 45/75/30 | ${draft.distribution?.diff?.[3]}/${draft.distribution?.diff?.[4]}/${draft.distribution?.diff?.[5]} |

## Final karar: **${verdict}**

${verdict === "EKLENEBİLİR" ? "Vaka kökü kalitesi banka standardına yaklaştı. Onay sonrası pediatri.js + manifest (566→716) güncellenebilir." : "Aşağıdaki bulgular giderilmeden bankaya eklenmemeli."}

---

## tus-alignment-reviewer (vaka kökü)

- Ortalama vaka uzunluğu: **${vakaAvg}** (hedef ≥220)
- 220 altı vaka-benzeri: **${shortVaka.length}** ${shortVaka.length ? `→ id: ${shortVaka.map((q) => q.id).join(", ")}` : ""}
- Telegrafik kök: **${telegraphic.length}**
- Mekanizma/patofizyoloji sorgusu: **${mechanism.length}** soru

**Örnek düzeltme (5541 deterjan):** 523 karakter, tam öykü + endoskopi + alkali mekanizma sorusu.

---

## tusoskop-format-data-guard

Bloklayıcı hatalar: **${formatErrors.length}**
${formatErrors.length ? formatErrors.map((e) => `- ${e}`).join("\n") : "- Yok"}

---

## tusoskop-duplicate-auditor

- Batch içi yüksek benzerlik (≥0.65): **${dupBatch.length}**
- Banka ile yüksek benzerlik (≥0.72): **${dupBank.length}**

---

## Subagent güncellemeleri (rev3)

Kalite kapıları güncellendi:
- \`.cursor/agents/tusoskop-question-writer.md\` — min vaka uzunluğu, telegrafik yasak, mekanizma sorusu
- \`.cursor/agents/tusoskop-tus-alignment-reviewer.md\` — T1-T7 red kodları, vaka skoru
- \`.cursor/agents/tusoskop-final-reviewer.md\` — vaka kalitesi otomatik RED
- \`.cursor/agents/tusoskop-medical-validator.md\` — eksik klinik bağlam uyarısı
- \`.cursor/agents/tusoskop-explanation-editor.md\` — exp'de mekanizma zorunluluğu
- \`.cursor/rules/tusoskop-question-generation.mdc\` — vaka red bayrakları

---

## Ekleme sonrası

\`npm run validate:questions\`, \`npm run test\`, \`npm run build\`
`;

writeFileSync(reportPath, report, "utf8");
console.log("Report:", reportPath);
console.log("Verdict:", verdict);
console.log("Avg len:", avgLen, "Vaka avg:", vakaAvg, "Short vaka:", shortVaka.length);
