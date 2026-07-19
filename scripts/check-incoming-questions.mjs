// Gelen soru JSON'unu kanonik ders→konu şablonuna göre denetler.
//
// Kullanım:
//   node scripts/check-incoming-questions.mjs <soru.json> [--json cikti.json]
//
// Girdi biçimleri (otomatik algılanır):
//   - [ {ders, konu, ...}, ... ]
//   - { QUESTIONS: [ ... ] }
//   - { "Ders": [ ... ], ... }  (ders adına göre gruplanmış)
//
// Çıktı: uyumsuz soruların listesi + her biri için en yakın geçerli konu önerisi.
// --json verilirse önerilen düzeltmeler makine-okunur olarak da yazılır.

import { readFile, writeFile } from "node:fs/promises";
import { SUBJECT_TOPICS, SUBJECTS, isValidTopic } from "../src/data/subjectTopicSchema.js";

const args = process.argv.slice(2);
const inputPath = args.find((a) => !a.startsWith("--"));
const jsonOutIdx = args.indexOf("--json");
const jsonOut = jsonOutIdx >= 0 ? args[jsonOutIdx + 1] : null;

if (!inputPath) {
  console.error("Kullanım: node scripts/check-incoming-questions.mjs <soru.json> [--json cikti.json]");
  process.exit(2);
}

// --- Türkçe duyarlı normalizasyon (eşleştirme için) ---
function normalize(s) {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
  }
  return dp[n];
}

// Bir dersin (ya da tüm derslerin) konuları arasında en yakın eşleşmeyi bul.
function suggestTopic(konu, ders) {
  const target = normalize(konu);
  const pool = [];
  const derslerToScan = ders && SUBJECT_TOPICS[ders] ? [ders] : SUBJECTS;
  for (const d of derslerToScan) {
    for (const t of SUBJECT_TOPICS[d]) pool.push({ ders: d, konu: t });
  }
  let best = null;
  for (const cand of pool) {
    const nc = normalize(cand.konu);
    const dist = levenshtein(target, nc);
    const maxLen = Math.max(target.length, nc.length) || 1;
    const score = 1 - dist / maxLen; // 1 = birebir
    // içerme bonusu (biri diğerini kapsıyorsa)
    const contains = nc.includes(target) || target.includes(nc);
    const adj = contains ? Math.max(score, 0.85) : score;
    if (!best || adj > best.score) best = { ...cand, score: adj, dist };
  }
  return best;
}

function suggestDers(ders) {
  const target = normalize(ders);
  let best = null;
  for (const d of SUBJECTS) {
    const dist = levenshtein(target, normalize(d));
    const maxLen = Math.max(target.length, normalize(d).length) || 1;
    const score = 1 - dist / maxLen;
    if (!best || score > best.score) best = { ders: d, score };
  }
  return best;
}

// --- Girdiyi düzleştir ---
function flatten(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.QUESTIONS)) return data.QUESTIONS;
  if (data && Array.isArray(data.questions)) return data.questions;
  if (data && typeof data === "object") {
    // ders adına göre gruplanmış olabilir
    const out = [];
    for (const [key, val] of Object.entries(data)) {
      if (Array.isArray(val)) {
        for (const item of val) {
          out.push(item && item.ders ? item : { ...item, ders: key });
        }
      }
    }
    if (out.length) return out;
  }
  throw new Error("JSON biçimi tanınmadı (dizi / {QUESTIONS:[]} / {Ders:[]} bekleniyordu).");
}

const raw = await readFile(inputPath, "utf8");
let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  console.error(`JSON parse hatası: ${e.message}`);
  process.exit(2);
}

const questions = flatten(parsed);

const issues = [];
let okCount = 0;

questions.forEach((q, i) => {
  const ref = q?.id != null ? `id=${q.id}` : `#${i}`;
  const problems = [];
  let dersFix = null;
  let konuFix = null;

  const dersValid = SUBJECTS.includes(q?.ders);
  if (!dersValid) {
    const s = suggestDers(q?.ders ?? "");
    dersFix = s?.ders ?? null;
    problems.push(`geçersiz ders "${q?.ders}"` + (dersFix ? ` → öneri: "${dersFix}"` : ""));
  }

  const effectiveDers = dersValid ? q.ders : dersFix;
  if (q?.konu == null || String(q.konu).trim() === "") {
    problems.push("konu boş");
    const s = suggestTopic("", effectiveDers);
    if (s) konuFix = s.konu;
  } else if (!isValidTopic(effectiveDers, q.konu)) {
    const s = suggestTopic(q.konu, effectiveDers);
    konuFix = s?.konu ?? null;
    const conf = s ? ` (%${Math.round(s.score * 100)})` : "";
    problems.push(
      `geçersiz konu "${q.konu}"` +
        (s ? ` → öneri: "${s.ders}::${s.konu}"${conf}` : "")
    );
  }

  if (problems.length) {
    issues.push({
      ref,
      id: q?.id ?? null,
      ders: q?.ders ?? null,
      konu: q?.konu ?? null,
      dersFix,
      konuFix,
      dersFinal: dersFix ?? q?.ders ?? null,
      konuFinal: konuFix ?? q?.konu ?? null,
      problems,
    });
  } else {
    okCount++;
  }
});

// --- Rapor ---
console.log(`Toplam soru: ${questions.length}`);
console.log(`Uyumlu: ${okCount}`);
console.log(`Uyumsuz: ${issues.length}`);
if (issues.length) {
  console.log("\n--- Uyumsuz sorular ---");
  for (const it of issues) {
    console.log(`\n[${it.ref}] ders="${it.ders}" konu="${it.konu}"`);
    for (const p of it.problems) console.log(`  • ${p}`);
  }

  // ders bazlı özet
  const byBad = new Map();
  for (const it of issues) {
    const key = `${it.ders} :: ${it.konu}`;
    byBad.set(key, (byBad.get(key) || 0) + 1);
  }
  console.log("\n--- Uyumsuz (ders::konu) sıklığı ---");
  [...byBad.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, c]) => console.log(`  ${c.toString().padStart(4)}  ${k}`));
}

if (jsonOut) {
  await writeFile(jsonOut, JSON.stringify(issues, null, 2), "utf8");
  console.log(`\nÖnerilen düzeltmeler yazıldı: ${jsonOut}`);
}

process.exitCode = issues.length ? 1 : 0;
