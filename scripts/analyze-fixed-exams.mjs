/**
 * Tüm sabit denemeler — kalite / dağılım raporu.
 * Run: node scripts/analyze-fixed-exams.mjs
 */
import { readFile } from "node:fs/promises";
import FULL_EXAM_BLUEPRINT from "../src/data/examBlueprints.js";
import { EXAM_SETS } from "../src/data/exams.js";
import { maxStreak, TEMEL_ORDER, KLINIK_ORDER } from "./lib/fixedExamGenerator.mjs";

const TEMEL = new Set(TEMEL_ORDER);
const KLINIK = new Set(KLINIK_ORDER);
const manifest = JSON.parse(
  await readFile(new URL("../src/data/questionChunks/_manifest.json", import.meta.url), "utf8")
);

async function loadChunk(slug) {
  return import(new URL(`../src/data/questionChunks/${slug}.js`, import.meta.url).href);
}

const byId = new Map();
for (const [slug] of Object.entries(manifest.subjectBySlug)) {
  const mod = await loadChunk(slug);
  for (const q of mod.QUESTIONS || []) {
    byId.set(Number(q.id), q);
  }
}

const line = (c = "─", n = 72) => c.repeat(n);
const pad = (s, n) => String(s).padEnd(n);

function analyzeExam(exam) {
  const ids = exam.questionIds || [];
  const ordered = ids.map((id, index) => ({
    index,
    soruNo: index + 1,
    id: Number(id),
    q: byId.get(Number(id)),
  }));
  const missing = ordered.filter((r) => !r.q);
  const resolved = ordered.filter((r) => r.q);

  const dersCounts = {};
  const topicCounts = new Map();
  for (const r of resolved) {
    dersCounts[r.q.ders] = (dersCounts[r.q.ders] || 0) + 1;
    const tk = `${r.q.ders} :: ${r.q.konu || "—"}`;
    topicCounts.set(tk, (topicCounts.get(tk) || 0) + 1);
  }

  const topicStreak = maxStreak(resolved.map((r) => r.q), (q) => `${q.ders}::${q.konu || "—"}`);
  const dersStreak = maxStreak(resolved.map((r) => r.q), (q) => q.ders);
  const first100Temel = resolved.slice(0, 100).every((r) => TEMEL.has(r.q.ders));
  const last100Klinik = resolved.slice(100, 200).every((r) => KLINIK.has(r.q.ders));

  let blueprintOk = true;
  for (const [ders, quota] of Object.entries(FULL_EXAM_BLUEPRINT)) {
    if (dersCounts[ders] !== quota) blueprintOk = false;
  }

  const warnings = [];
  if (topicStreak >= 5) warnings.push(`Aynı ders+konu art arda ${topicStreak} (≥5)`);
  if (dersStreak >= 5) warnings.push(`Aynı ders art arda ${dersStreak} (≥5)`);
  if (!blueprintOk) warnings.push("Blueprint kotası uyumsuz");
  if (!first100Temel) warnings.push("İlk 100 Temel değil");
  if (!last100Klinik) warnings.push("Son 100 Klinik değil");
  if (missing.length) warnings.push(`Eksik id: ${missing.length}`);

  let quality = "İyi";
  if (warnings.some((w) => w.includes("≥5") || w.includes("uyumsuz"))) {
    quality = "Yeniden dengelenmeli";
  } else if (warnings.length) {
    quality = "Uyarı var";
  }

  return {
    exam,
    ids,
    missing,
    resolved,
    dersCounts,
    topicCounts,
    topicStreak,
    dersStreak,
    first100Temel,
    last100Klinik,
    blueprintOk,
    warnings,
    quality,
  };
}

const fixedExams = EXAM_SETS.filter((e) => e.fixedSet && Array.isArray(e.questionIds));
const idUsage = new Map();

console.log("");
console.log("╔══════════════════════════════════════════════════════════════════════╗");
console.log("║              SABİT DENEMELER — TOPLU KALİTE / DAĞILIM RAPORU         ║");
console.log("╚══════════════════════════════════════════════════════════════════════╝\n");

for (const exam of fixedExams) {
  const r = analyzeExam(exam);
  for (const id of r.ids) {
    const n = Number(id);
    if (!idUsage.has(n)) idUsage.set(n, []);
    idUsage.get(n).push(exam.title);
  }

  console.log(`▶ ${exam.title} (id=${exam.id}, setVersion=${exam.setVersion || "—"})`);
  console.log(line());
  console.log(`   Toplam / unique / eksik: ${r.ids.length} / ${new Set(r.ids).size} / ${r.missing.length}`);
  console.log(`   İlk 100 Temel: ${r.first100Temel ? "EVET" : "HAYIR"} | Son 100 Klinik: ${r.last100Klinik ? "EVET" : "HAYIR"}`);
  console.log(`   Blueprint: ${r.blueprintOk ? "UYUMLU" : "UYUMSUZ"}`);
  console.log(`   En uzun ders+konu art arda: ${r.topicStreak} | En uzun ders art arda: ${r.dersStreak}`);
  console.log(`   Kalite: ${r.quality}`);
  if (r.warnings.length) r.warnings.forEach((w) => console.log(`   ⚠ ${w}`));

  const critical = [1, 50, 100, 101, 150, 200];
  console.log("   Kritik sorular:");
  for (const soruNo of critical) {
    const row = r.resolved[soruNo - 1];
    if (!row?.q) {
      console.log(`      S${soruNo}: EKSİK`);
      continue;
    }
    const tip = TEMEL.has(row.q.ders) ? "Temel" : KLINIK.has(row.q.ders) ? "Klinik" : "?";
    console.log(
      `      S${String(soruNo).padStart(3)} | id=${String(row.id).padStart(4)} | ${pad(row.q.ders, 28)} | ${row.q.konu} [${tip}]`
    );
  }
  console.log("");
}

const allUsed = [];
for (const exam of fixedExams) {
  allUsed.push(...exam.questionIds.map(Number));
}
const uniqueUsed = new Set(allUsed);
const repeats = [...idUsage.entries()].filter(([, exams]) => exams.length > 1);

console.log(line("═"));
console.log("DENEMELER ARASI GLOBAL ANALİZ");
console.log(line());
console.log(`   Sabit deneme sayısı     : ${fixedExams.length}`);
console.log(`   Toplam id kullanımı     : ${allUsed.length}`);
console.log(`   Benzersiz id            : ${uniqueUsed.size}`);
const overlapPct =
  allUsed.length > 0
    ? (((allUsed.length - uniqueUsed.size) / allUsed.length) * 100).toFixed(2)
    : "0";
console.log(`   Denemeler arası overlap : ${allUsed.length - uniqueUsed.size} id (%${overlapPct})`);

if (repeats.length) {
  console.log(`\n   Tekrar eden id sayısı: ${repeats.length}`);
  repeats
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20)
    .forEach(([id, exams], i) => {
      console.log(`   ${String(i + 1).padStart(2)}. id ${id} → ${exams.length}× (${exams.join(", ")})`);
    });
} else {
  console.log("\n   Denemeler arası id tekrarı yok.");
}

console.log("\n" + line("═") + "\n");

const criticalExams = fixedExams.filter((e) => {
  const r = analyzeExam(e);
  return r.quality === "Yeniden dengelenmeli" || r.warnings.some((w) => w.includes("≥5"));
});
if (criticalExams.length) {
  console.log("KRİTİK: Bazı denemelerde uyarı var — yukarıdaki detaylara bakın.\n");
  process.exitCode = 1;
}
