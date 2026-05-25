/**
 * Soru bankasını scripts/instagram/questions.json olarak dışa aktarır.
 * GitHub Actions workflow'unun ilk adımında çalışır.
 *
 * Kullanım: node scripts/export-questions.mjs
 */

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const CHUNKS_DIR = join(ROOT, "src", "data", "questionChunks");
const OUT_DIR = join(__dir, "instagram");
const OUT_FILE = join(OUT_DIR, "questions.json");

const KEEP_FIELDS = ["id", "ders", "konu", "soru", "option_1", "option_2", "option_3", "option_4", "option_5", "cevap", "difficulty"];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(CHUNKS_DIR)).filter(
    (f) => f.endsWith(".js") && !f.startsWith("_")
  );

  const allQuestions = [];

  for (const file of files) {
    const filePath = join(CHUNKS_DIR, file);
    const raw = await readFile(filePath, "utf8");

    // Extract the exported array — supports `export default [...]` and `export const questions = [...]`
    const match = raw.match(/export\s+(?:default\s+|const\s+\w+\s*=\s*)\[[\s\S]*?\];?/);
    if (!match) {
      console.warn(`[skip] ${file}: no exportable array found`);
      continue;
    }

    // Use Function constructor to evaluate the array literal safely
    const arrayStr = match[0]
      .replace(/^export\s+(default\s+)?/, "")
      .replace(/^const\s+\w+\s*=\s*/, "")
      .replace(/;$/, "");

    let questions;
    try {
      questions = Function(`"use strict"; return (${arrayStr})`)();
    } catch (err) {
      console.warn(`[skip] ${file}: parse error — ${err.message}`);
      continue;
    }

    if (!Array.isArray(questions)) {
      console.warn(`[skip] ${file}: not an array`);
      continue;
    }

    for (const q of questions) {
      if (!q || typeof q !== "object") continue;
      const slim = {};
      for (const k of KEEP_FIELDS) {
        if (k in q) slim[k] = q[k];
      }
      if (slim.id !== undefined && slim.soru) allQuestions.push(slim);
    }
  }

  await writeFile(OUT_FILE, JSON.stringify(allQuestions, null, 2), "utf8");
  console.log(`✓ ${allQuestions.length} soru → ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
