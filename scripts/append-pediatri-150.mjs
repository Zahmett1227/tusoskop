import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const draftPath =
  "c:/Users/ahmet/OneDrive/Masaüstü/TUSOSKOP informations/pediatri_150_taslak.json";
const chunkPath = path.join(root, "src/data/questionChunks/pediatri.js");
const manifestPath = path.join(root, "src/data/questionChunks/_manifest.json");

const draft = JSON.parse(readFileSync(draftPath, "utf8"));
const newQs = draft.questions;

const expectedIds = Array.from({ length: 150 }, (_, i) => 5538 + i);
const gotIds = newQs.map((q) => q.id).sort((a, b) => a - b);
for (let i = 0; i < expectedIds.length; i++) {
  if (gotIds[i] !== expectedIds[i]) {
    throw new Error(`ID mismatch at index ${i}: expected ${expectedIds[i]}, got ${gotIds[i]}`);
  }
}

const { QUESTIONS: existing } = await import(
  new URL("../src/data/questionChunks/pediatri.js", import.meta.url).href
);

const existingIds = new Set(existing.map((q) => q.id));
for (const q of newQs) {
  if (existingIds.has(q.id)) {
    throw new Error(`Duplicate id in pediatri chunk: ${q.id}`);
  }
}

for (const q of newQs) {
  if (q.ders !== "Pediatri") throw new Error(`Wrong ders for id ${q.id}: ${q.ders}`);
  if (!Array.isArray(q.options) || q.options.length !== 5) {
    throw new Error(`Bad options for id ${q.id}`);
  }
}

const merged = [...existing, ...newQs];
const out = `export const SUBJECT = "Pediatri";\nexport const QUESTIONS = ${JSON.stringify(merged)};\n`;
writeFileSync(chunkPath, out, "utf8");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const prev = manifest.subjectCounts.Pediatri;
manifest.subjectCounts.Pediatri = prev + newQs.length;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log("Added", newQs.length, "questions to pediatri.js");
console.log("Pediatri count:", prev, "->", manifest.subjectCounts.Pediatri);
console.log("ID range:", newQs[0].id, "-", newQs[newQs.length - 1].id);
