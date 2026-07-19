// Soruları subagent batch dosyalarına böler.
// Çıktı: scratchpad/batches/<slug>-<nnn>.json  + scratchpad/batches/_index.json
import fs from "fs";
import path from "path";

const dir = "src/data/questionChunks";
const outDir = path.resolve("scratchpad/batches");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const BATCH = 10;
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js"));
const index = {}; // subject -> { slug, total, batches: [{path, count, ids:[...]}] }

for (const f of files) {
  const slug = f.replace(/\.js$/, "");
  const mod = await import(path.resolve(dir, f));
  const subject = mod.SUBJECT || slug;
  const qs = mod.QUESTIONS || [];
  const batches = [];
  for (let i = 0; i < qs.length; i += BATCH) {
    const chunk = qs.slice(i, i + BATCH).map((q) => ({
      id: q.id,
      ders: q.ders,
      konu: q.konu,
      diff: q.diff,
      q: q.q,
      options: q.options,
      correct: q.correct,
      exp: q.exp,
    }));
    const n = String(batches.length).padStart(3, "0");
    const p = path.join(outDir, `${slug}-${n}.json`);
    fs.writeFileSync(p, JSON.stringify(chunk));
    batches.push({ path: p, count: chunk.length, ids: chunk.map((c) => c.id) });
  }
  index[subject] = { slug, total: qs.length, batches };
  console.log(`${subject.padEnd(28)} ${qs.length} soru -> ${batches.length} batch`);
}

fs.writeFileSync(path.join(outDir, "_index.json"), JSON.stringify(index, null, 2));
const totalBatches = Object.values(index).reduce((a, s) => a + s.batches.length, 0);
console.log("\nToplam batch:", totalBatches, " | Dizin:", path.join(outDir, "_index.json"));