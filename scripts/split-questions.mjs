/**
 * Bir kerelik (veya soru bankası güncellenince) çalıştırın:
 * node scripts/split-questions.mjs
 *
 * src/data/questions.js içindeki QUESTIONS dizisini derse göre parçalar.
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(root, "src", "data");
const chunkDir = join(dataDir, "questionChunks");

export function subjectToChunkBasename(ders) {
  return (
    String(ders || "")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .toLowerCase() || "unknown"
  );
}

const questionsUrl = pathToFileURL(join(dataDir, "questions.js")).href;
const { QUESTIONS } = await import(questionsUrl);

if (!Array.isArray(QUESTIONS)) {
  console.error("QUESTIONS bulunamadı.");
  process.exit(1);
}

mkdirSync(chunkDir, { recursive: true });

const bySlug = new Map();
for (const q of QUESTIONS) {
  const ders = q.ders;
  const slug = subjectToChunkBasename(ders);
  if (!bySlug.has(slug)) bySlug.set(slug, { ders, items: [] });
  bySlug.get(slug).items.push(q);
}

const manifest = { subjects: [], subjectBySlug: {} };

for (const [slug, { ders, items }] of bySlug.entries()) {
  manifest.subjects.push(ders);
  manifest.subjectBySlug[slug] = ders;
  const filePath = join(chunkDir, `${slug}.js`);
  const src = `export const SUBJECT = ${JSON.stringify(ders)};
export const QUESTIONS = ${JSON.stringify(items)};
`;
  writeFileSync(filePath, src, "utf8");
  console.log("wrote", slug, items.length);
}

writeFileSync(join(chunkDir, "_manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log("done, chunks:", bySlug.size);
