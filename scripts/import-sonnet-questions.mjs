/**
 * sonnet.sorular.txt içindeki soruları ders chunk'larına ekler.
 * Kullanım: node scripts/import-sonnet-questions.mjs "C:\path\sonnet.sorular.txt"
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const chunkDir = join(root, "src", "data", "questionChunks");
const manifestPath = join(chunkDir, "_manifest.json");

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error("Kaynak dosya yolu gerekli.");
  process.exit(1);
}

const raw = readFileSync(sourcePath, "utf8");
let incoming;
try {
  const wrapped = `[${raw.replace(/\]\s*\[/g, "],[")}]`;
  incoming = JSON.parse(wrapped).flat();
} catch (e) {
  console.error("JSON parse hatası:", e.message);
  process.exit(1);
}
if (!incoming.length) {
  console.error("Hiç soru bulunamadı.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const slugBySubject = Object.fromEntries(
  Object.entries(manifest.subjectBySlug).map(([slug, ders]) => [ders, slug])
);

const existingIds = new Set();
const chunkCache = new Map();

for (const file of readdirSync(chunkDir)) {
  if (!file.endsWith(".js")) continue;
  const slug = file.replace(/\.js$/, "");
  const mod = await import(new URL(`../src/data/questionChunks/${file}`, import.meta.url));
  const questions = [...mod.QUESTIONS];
  chunkCache.set(slug, { ders: mod.SUBJECT, questions });
  for (const q of questions) existingIds.add(q.id);
}

const report = {
  incoming: incoming.length,
  added: 0,
  skippedDuplicateId: [],
  skippedUnknownDers: [],
  bySlug: {},
};

for (const q of incoming) {
  const slug = slugBySubject[q.ders];
  if (!slug) {
    report.skippedUnknownDers.push({ id: q.id, ders: q.ders });
    continue;
  }
  if (existingIds.has(q.id)) {
    report.skippedDuplicateId.push(q.id);
    continue;
  }
  if (!chunkCache.has(slug)) {
    chunkCache.set(slug, { ders: q.ders, questions: [] });
  }
  chunkCache.get(slug).questions.push(q);
  existingIds.add(q.id);
  report.added += 1;
  report.bySlug[slug] = (report.bySlug[slug] || 0) + 1;
}

for (const [slug, { ders, questions }] of chunkCache.entries()) {
  questions.sort((a, b) => a.id - b.id);
  const filePath = join(chunkDir, `${slug}.js`);
  const src = `export const SUBJECT = ${JSON.stringify(ders)};
export const QUESTIONS = ${JSON.stringify(questions)};
`;
  writeFileSync(filePath, src, "utf8");
}

for (const ders of manifest.subjects) {
  const slug = slugBySubject[ders];
  manifest.subjectCounts[ders] = chunkCache.get(slug)?.questions.length ?? 0;
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

const allIds = [...existingIds].sort((a, b) => a - b);
const gaps = [];
for (let i = 1; i < allIds.length; i++) {
  const prev = allIds[i - 1];
  const cur = allIds[i];
  if (cur - prev > 1) {
    for (let g = prev + 1; g < cur; g++) gaps.push(g);
  }
}

console.log(JSON.stringify({
  ...report,
  totalIds: allIds.length,
  minId: allIds[0],
  maxId: allIds[allIds.length - 1],
  gapCount: gaps.length,
  gapsSample: gaps.slice(0, 30),
}, null, 2));
