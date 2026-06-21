import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "c:/Users/ahmet/OneDrive/Masaüstü/tusoskop_kutuphane_646soru.json";
const chunkDir = path.join(root, "src/data/questionChunks");
const manifestPath = path.join(chunkDir, "_manifest.json");
const reportPath = path.join(root, "scripts/kutuphane-646-id-report.json");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const slugBySubject = Object.fromEntries(
  Object.entries(manifest.subjectBySlug).map(([slug, name]) => [name, slug])
);

const sourceQuestions = JSON.parse(readFileSync(sourcePath, "utf8"));
if (!Array.isArray(sourceQuestions) || sourceQuestions.length !== 646) {
  throw new Error(`Expected 646 questions, got ${sourceQuestions?.length ?? "invalid"}`);
}

let maxExistingId = 0;
const existingBySlug = {};

for (const [slug, subjectName] of Object.entries(manifest.subjectBySlug)) {
  const mod = await import(new URL(`../src/data/questionChunks/${slug}.js`, import.meta.url).href);
  const questions = mod.QUESTIONS;
  if (!Array.isArray(questions)) throw new Error(`${slug}: QUESTIONS missing`);
  if (mod.SUBJECT !== subjectName) {
    throw new Error(`${slug}: SUBJECT mismatch`);
  }
  existingBySlug[slug] = questions;
  for (const q of questions) {
    if (q.id > maxExistingId) maxExistingId = q.id;
  }
}

let nextId = maxExistingId + 1;
const idReport = {
  generatedAt: new Date().toISOString(),
  sourceFile: sourcePath,
  previousMaxId: maxExistingId,
  firstNewId: nextId,
  lastNewId: nextId + sourceQuestions.length - 1,
  totalAdded: sourceQuestions.length,
  bySubject: {},
  mappings: [],
};

const additionsBySlug = {};

for (let index = 0; index < sourceQuestions.length; index += 1) {
  const source = sourceQuestions[index];
  const slug = slugBySubject[source.ders];
  if (!slug) {
    throw new Error(`Unknown ders at index ${index}: ${source.ders}`);
  }

  const newId = nextId;
  nextId += 1;

  const question = { ...source, id: newId };
  if (!additionsBySlug[slug]) additionsBySlug[slug] = [];
  additionsBySlug[slug].push(question);

  idReport.mappings.push({
    index,
    oldId: sourceQuestions[index].id,
    newId,
    ders: source.ders,
    konu: source.konu,
  });

  const summary = idReport.bySubject[source.ders] || {
    slug,
    count: 0,
    oldIdRange: [sourceQuestions[index].id, sourceQuestions[index].id],
    newIdRange: [newId, newId],
  };
  summary.count += 1;
  summary.oldIdRange[0] = Math.min(summary.oldIdRange[0], sourceQuestions[index].id);
  summary.oldIdRange[1] = Math.max(summary.oldIdRange[1], sourceQuestions[index].id);
  summary.newIdRange[0] = Math.min(summary.newIdRange[0], newId);
  summary.newIdRange[1] = Math.max(summary.newIdRange[1], newId);
  idReport.bySubject[source.ders] = summary;
}

for (const [slug, additions] of Object.entries(additionsBySlug)) {
  const subjectName = manifest.subjectBySlug[slug];
  const existing = existingBySlug[slug];
  const existingIds = new Set(existing.map((q) => q.id));

  for (const q of additions) {
    if (existingIds.has(q.id)) throw new Error(`Duplicate id ${q.id} in ${slug}`);
    if (q.ders !== subjectName) throw new Error(`Wrong ders for new id ${q.id}: ${q.ders}`);
  }

  const merged = [...existing, ...additions];
  const out = `export const SUBJECT = ${JSON.stringify(subjectName)};\nexport const QUESTIONS = ${JSON.stringify(merged)};\n`;
  writeFileSync(path.join(chunkDir, `${slug}.js`), out, "utf8");

  const prev = manifest.subjectCounts[subjectName];
  manifest.subjectCounts[subjectName] = prev + additions.length;
  console.log(`${slug}: ${prev} -> ${manifest.subjectCounts[subjectName]} (+${additions.length})`);
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
writeFileSync(reportPath, `${JSON.stringify(idReport, null, 2)}\n`, "utf8");

console.log("Previous max ID:", maxExistingId);
console.log("New ID range:", idReport.firstNewId, "-", idReport.lastNewId);
console.log("Report written to:", reportPath);
