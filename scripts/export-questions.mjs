/**
 * Soru bankasını scripts/instagram/questions.json olarak dışa aktarır.
 * GitHub Actions workflow'unun ilk adımında çalışır.
 *
 * Kullanım: node scripts/export-questions.mjs
 */

import { readdir, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

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
    let mod;
    try {
      mod = await import(pathToFileURL(filePath).href);
    } catch (err) {
      console.warn(`[skip] ${file}: import hatası — ${err.message}`);
      continue;
    }

    // QUESTIONS (büyük) veya questions (küçük) veya default export
    const raw = mod.QUESTIONS || mod.questions || mod.default;
    if (!Array.isArray(raw)) {
      console.warn(`[skip] ${file}: dizi bulunamadı`);
      continue;
    }

    for (const q of raw) {
      if (!q || typeof q !== "object") continue;

      // Dosya formatı: q/options/correct  →  soru/option_1.../cevap formatına çevir
      const slim = {};

      slim.id   = q.id;
      slim.ders = q.ders;
      slim.konu = q.konu;
      slim.soru = q.soru || q.q;

      if (Array.isArray(q.options)) {
        q.options.forEach((opt, i) => {
          slim[`option_${i + 1}`] = opt;
        });
      } else {
        for (const k of ["option_1","option_2","option_3","option_4","option_5"]) {
          if (k in q) slim[k] = q[k];
        }
      }

      // correct (0-bazlı index) → cevap (0-bazlı, aynı)
      slim.cevap = q.cevap ?? q.correct ?? 0;
      slim.difficulty = q.difficulty || q.diff;

      if (slim.id !== undefined && slim.soru) allQuestions.push(slim);
    }

    console.log(`  ${file}: ${raw.length} soru`);
  }

  await writeFile(OUT_FILE, JSON.stringify(allQuestions, null, 2), "utf8");
  console.log(`✓ Toplam ${allQuestions.length} soru → ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
