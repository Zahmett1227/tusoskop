// Deterministik soru bankası denetimi — yapısal / tutarlılık / kalite sinyalleri
// Kullanım: node scripts/audit-questions.mjs
import fs from "fs";
import path from "path";

const dir = "src/data/questionChunks";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js"));

const all = [];
for (const f of files) {
  const mod = await import(path.resolve(dir, f));
  const subject = mod.SUBJECT || f;
  const qs = mod.QUESTIONS || [];
  qs.forEach((q, i) => all.push({ ...q, __file: f, __subject: subject, __idx: i }));
}

const findings = []; // {sev, type, subject, id, file, msg, extra}
const add = (sev, type, q, msg, extra) =>
  findings.push({ sev, type, subject: q.__subject, id: q.id, file: q.__file, msg, ...(extra ? { extra } : {}) });

const norm = (s) =>
  (s || "")
    .toLocaleLowerCase("tr")
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?()"'`´]/g, "")
    .trim();

// ---- global yapılar ----
const byId = new Map();
const qTextMap = new Map(); // normalized q -> [refs]
const answerPos = {}; // subject -> [c0..c4] counts
const diffDist = {}; // subject -> {1..5}
const negWordCount = { total: 0, bySubject: {} };

const NEG_WORDS = ["değildir", "yanlıştır", "yanlış olan", "hangisi yanlış", "hariç", "dışında", "beklenmez", "görülmez", "olmaz", "kontrendike", "en az"];
const ALLNONE = ["hepsi", "hiçbiri", "yukarıdakilerin"];

for (const q of all) {
  const subj = q.__subject;
  answerPos[subj] = answerPos[subj] || [0, 0, 0, 0, 0, 0];
  diffDist[subj] = diffDist[subj] || {};

  // --- field integrity ---
  if (typeof q.id !== "number") add("HIGH", "field.id", q, `id sayı değil: ${JSON.stringify(q.id)}`);
  if (!q.ders) add("MED", "field.ders", q, "ders alanı yok");
  else if (q.ders !== subj) add("MED", "field.ders_mismatch", q, `ders="${q.ders}" ama dosya subject="${subj}"`);
  if (!q.konu || !String(q.konu).trim()) add("LOW", "field.konu", q, "konu alanı boş");
  if (typeof q.diff !== "number") add("LOW", "field.diff", q, `diff sayı değil: ${JSON.stringify(q.diff)}`);
  else {
    if (q.diff < 1 || q.diff > 5) add("LOW", "field.diff_range", q, `diff aralık dışı: ${q.diff}`);
    diffDist[subj][q.diff] = (diffDist[subj][q.diff] || 0) + 1;
  }

  // --- q text ---
  const qt = String(q.q || "");
  if (!qt.trim()) add("HIGH", "q.empty", q, "soru metni boş");
  else if (qt.trim().length < 25) add("MED", "q.short", q, `soru metni çok kısa (${qt.trim().length} karakter)`, qt.slice(0, 80));
  if (/\.\.\.$|…$/.test(qt.trim()) && qt.trim().length < 60) add("MED", "q.truncated", q, "soru kesik/eksik olabilir", qt.slice(-60));

  // --- options ---
  const opts = q.options;
  if (!Array.isArray(opts)) {
    add("HIGH", "opt.notarray", q, "options dizi değil");
  } else {
    if (opts.length !== 5) add("HIGH", "opt.count", q, `şık sayısı 5 değil: ${opts.length}`);
    const seen = new Map();
    opts.forEach((o, i) => {
      const os = String(o ?? "");
      if (!os.trim()) add("HIGH", "opt.empty", q, `şık ${i} boş`);
      const key = norm(os);
      if (key && seen.has(key)) add("HIGH", "opt.dup", q, `şık ${i} ile şık ${seen.get(key)} aynı: "${os.slice(0, 50)}"`);
      else seen.set(key, i);
    });
    // all/none placement
    opts.forEach((o, i) => {
      const on = norm(o);
      if (ALLNONE.some((w) => on.includes(w))) {
        if (i !== opts.length - 1) add("LOW", "opt.allnone_pos", q, `"hepsi/hiçbiri" tarzı şık son sırada değil (idx ${i})`, String(o));
      }
    });
    // longest-option-is-correct giveaway
    if (typeof q.correct === "number" && opts[q.correct] != null) {
      const lens = opts.map((o) => String(o).length);
      const maxLen = Math.max(...lens);
      const correctLen = lens[q.correct];
      if (correctLen === maxLen && maxLen > 0) {
        const secondMax = Math.max(...lens.filter((_, i) => i !== q.correct));
        if (maxLen >= secondMax * 1.6 && maxLen - secondMax > 25)
          add("LOW", "opt.longest_correct", q, `doğru şık belirgin şekilde en uzun (giveaway riski): ${correctLen} vs ${secondMax}`);
      }
    }
  }

  // --- correct ---
  if (typeof q.correct !== "number" || !Number.isInteger(q.correct)) {
    add("HIGH", "correct.type", q, `correct tam sayı değil: ${JSON.stringify(q.correct)}`);
  } else if (Array.isArray(opts) && (q.correct < 0 || q.correct >= opts.length)) {
    add("HIGH", "correct.range", q, `correct aralık dışı: ${q.correct} (şık sayısı ${opts.length})`);
  } else {
    answerPos[subj][q.correct] = (answerPos[subj][q.correct] || 0) + 1;
  }

  // --- exp ---
  const exp = String(q.exp || "");
  if (!exp.trim()) add("MED", "exp.empty", q, "açıklama boş");
  else if (exp.trim().length < 30) add("LOW", "exp.short", q, `açıklama çok kısa (${exp.trim().length} karakter)`, exp.slice(0, 80));
  // exp doğru şıkkın anahtar terimini içeriyor mu? (kaba sinyal)
  if (Array.isArray(opts) && typeof q.correct === "number" && opts[q.correct] != null && exp.trim()) {
    const correctText = norm(opts[q.correct]);
    const words = correctText.split(" ").filter((w) => w.length >= 5);
    if (words.length) {
      const expN = norm(exp);
      const hit = words.some((w) => expN.includes(w));
      if (!hit) add("LOW", "exp.no_ref", q, `açıklama doğru şıkkın anahtar terimlerinden hiçbirini içermiyor gibi`, String(opts[q.correct]).slice(0, 60));
    }
  }

  // --- id dedup ---
  if (typeof q.id === "number") {
    if (!byId.has(q.id)) byId.set(q.id, []);
    byId.get(q.id).push(q);
  }

  // --- q dedup ---
  const nk = norm(qt);
  if (nk) {
    if (!qTextMap.has(nk)) qTextMap.set(nk, []);
    qTextMap.get(nk).push(q);
  }

  // --- negatif ifade ---
  const qn = norm(qt);
  if (NEG_WORDS.some((w) => qn.includes(w))) {
    negWordCount.total++;
    negWordCount.bySubject[subj] = (negWordCount.bySubject[subj] || 0) + 1;
  }
}

// duplicate ids
for (const [id, arr] of byId) {
  if (arr.length > 1) {
    const subs = [...new Set(arr.map((a) => a.__subject))];
    findings.push({
      sev: "HIGH",
      type: "id.duplicate",
      id,
      subject: subs.join("+"),
      file: arr.map((a) => a.__file).join(","),
      msg: `id ${id} ${arr.length} kez kullanılmış (${subs.join(", ")})`,
    });
  }
}

// duplicate question texts
let dupQGroups = 0;
for (const [nk, arr] of qTextMap) {
  if (arr.length > 1) {
    dupQGroups++;
    const subs = arr.map((a) => `${a.__subject}#${a.id}`);
    findings.push({
      sev: "HIGH",
      type: "q.duplicate",
      id: arr[0].id,
      subject: [...new Set(arr.map((a) => a.__subject))].join("+"),
      file: arr.map((a) => a.__file).join(","),
      msg: `aynı soru metni ${arr.length} kez: ${subs.join(", ")}`,
      extra: arr[0].q.slice(0, 120),
    });
  }
}

// answer position bias (chi-square-ish sinyal)
const biasReport = {};
for (const [subj, counts] of Object.entries(answerPos)) {
  const c = counts.slice(0, 5);
  const n = c.reduce((a, b) => a + b, 0);
  if (!n) continue;
  const exp = n / 5;
  const chi = c.reduce((a, o) => a + Math.pow(o - exp, 2) / exp, 0);
  const pct = c.map((x) => ((x / n) * 100).toFixed(1) + "%");
  biasReport[subj] = { n, dist: c, pct, chi2: +chi.toFixed(1), biased: chi > 20 }; // df=4, chi>~18 anlamlı
}

// ---- özet ----
const bySev = { HIGH: 0, MED: 0, LOW: 0 };
const byType = {};
for (const f of findings) {
  bySev[f.sev] = (bySev[f.sev] || 0) + 1;
  byType[f.type] = (byType[f.type] || 0) + 1;
}

const summary = {
  totalQuestions: all.length,
  perSubject: Object.fromEntries(Object.entries(answerPos).map(([s, c]) => [s, c.reduce((a, b) => a + b, 0)])),
  findingsBySeverity: bySev,
  findingsByType: byType,
  duplicateQuestionGroups: dupQGroups,
  negativeWorded: negWordCount,
  answerPositionBias: biasReport,
  diffDistribution: diffDist,
};

fs.mkdirSync("scratchpad", { recursive: true });
fs.writeFileSync("/home/user/tusoskop/scratchpad/audit-summary.json", JSON.stringify(summary, null, 2));
fs.writeFileSync("/home/user/tusoskop/scratchpad/audit-findings.json", JSON.stringify(findings, null, 2));

console.log("=== ÖZET ===");
console.log("Toplam soru:", all.length);
console.log("Bulgular (severity):", JSON.stringify(bySev));
console.log("\nBulgu tipleri:");
Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => console.log(`  ${n.toString().padStart(5)}  ${t}`));
console.log("\nCevap pozisyonu dağılımı (bias):");
for (const [s, r] of Object.entries(biasReport)) console.log(`  ${s.padEnd(28)} n=${r.n}  ${r.pct.join(" ")}  chi2=${r.chi2}${r.biased ? "  <-- SAPMA" : ""}`);
console.log("\nNegatif ifadeli soru sayısı:", negWordCount.total);
console.log("\nRaporlar: scratchpad/audit-summary.json, scratchpad/audit-findings.json");