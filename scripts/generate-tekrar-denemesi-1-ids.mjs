/**
 * One-off generator for Tekrar Denemesi 1 fixed question IDs.
 * Run: node scripts/generate-tekrar-denemesi-1-ids.mjs
 */
import { readFile, writeFile } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile(new URL("../src/data/questionChunks/_manifest.json", import.meta.url), "utf8")
);

const TEMEL_ORDER = [
  "Fizyoloji",
  "Patoloji",
  "Farmakoloji",
  "Mikrobiyoloji",
  "Anatomi",
  "Biyokimya",
];
const KLINIK_ORDER = [
  "Dahiliye",
  "Pediatri",
  "Genel Cerrahi",
  "Kadın Hastalıkları ve Doğum",
  "Küçük Stajlar",
];

const FALLBACK_QUOTA = {
  Anatomi: 14,
  Fizyoloji: 18,
  Biyokimya: 18,
  Mikrobiyoloji: 18,
  Patoloji: 22,
  Farmakoloji: 10,
  Dahiliye: 24,
  Pediatri: 20,
  "Genel Cerrahi": 18,
  "Kadın Hastalıkları ve Doğum": 14,
  "Küçük Stajlar": 24,
};

const BLUEPRINT = manifest.subjectCounts
  ? Object.fromEntries(
      [...TEMEL_ORDER, ...KLINIK_ORDER].map((ders) => {
        const total = manifest.subjectCounts[ders] || 0;
        const temelSum = TEMEL_ORDER.reduce((s, d) => s + (manifest.subjectCounts[d] || 0), 0);
        const klinikSum = KLINIK_ORDER.reduce((s, d) => s + (manifest.subjectCounts[d] || 0), 0);
        const isTemel = TEMEL_ORDER.includes(ders);
        const blockTotal = isTemel ? 100 : 100;
        const subjectTotal = isTemel ? temelSum : klinikSum;
        const count = manifest.subjectCounts[ders] || 0;
        const quota = subjectTotal > 0 ? Math.round((count / subjectTotal) * blockTotal) : 0;
        return [ders, quota];
      })
    )
  : FALLBACK_QUOTA;

// Use project FULL_EXAM blueprint totals (sums to 200) when available via hardcoded match
const FULL_EXAM = {
  Anatomi: 13,
  Fizyoloji: 15,
  Biyokimya: 18,
  Mikrobiyoloji: 18,
  Patoloji: 18,
  Farmakoloji: 18,
  Dahiliye: 23,
  Pediatri: 25,
  "Genel Cerrahi": 20,
  "Kadın Hastalıkları ve Doğum": 10,
  "Küçük Stajlar": 22,
};

const quotaBySubject = FULL_EXAM;

async function loadChunk(slug) {
  return import(new URL(`../src/data/questionChunks/${slug}.js`, import.meta.url).href);
}

const bySubject = {};
for (const [slug, subjectName] of Object.entries(manifest.subjectBySlug)) {
  const mod = await loadChunk(slug);
  const list = mod.QUESTIONS || [];
  bySubject[subjectName] = [...list].sort((a, b) => a.id - b.id);
}

const ids = [];
const pick = (ders, count) => {
  const pool = bySubject[ders] || [];
  if (pool.length < count) {
    throw new Error(`${ders}: need ${count}, have ${pool.length}`);
  }
  for (let i = 0; i < count; i += 1) {
    ids.push(pool[i].id);
  }
};

// Temel block: blueprint order matching examBlueprints.js temel subjects
const TEMEL_BLUEPRINT_ORDER = [
  "Anatomi",
  "Fizyoloji",
  "Biyokimya",
  "Mikrobiyoloji",
  "Patoloji",
  "Farmakoloji",
];
for (const ders of TEMEL_BLUEPRINT_ORDER) {
  pick(ders, quotaBySubject[ders]);
}

const KLINIK_BLUEPRINT_ORDER = [
  "Dahiliye",
  "Pediatri",
  "Genel Cerrahi",
  "Kadın Hastalıkları ve Doğum",
  "Küçük Stajlar",
];
for (const ders of KLINIK_BLUEPRINT_ORDER) {
  pick(ders, quotaBySubject[ders]);
}

if (ids.length !== 200) throw new Error(`Expected 200 ids, got ${ids.length}`);
if (new Set(ids).size !== 200) throw new Error("Duplicate ids in fixed exam");

const outPath = new URL("../src/data/tekrarDenemesi1QuestionIds.js", import.meta.url);
const content = `/** Sabit 200 soru — Tekrar Denemesi 1 (otomatik üretilmez; scripts/generate-tekrar-denemesi-1-ids.mjs) */\nexport const TEKRAR_DENEMESI_1_QUESTION_IDS = ${JSON.stringify(ids)};\n`;
await writeFile(outPath, content, "utf8");
console.log(`Wrote ${ids.length} ids to src/data/tekrarDenemesi1QuestionIds.js`);
