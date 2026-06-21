import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chunkPath = path.join(root, "src/data/questionChunks/anatomi.js");

const { QUESTIONS } = await import(
  new URL("../src/data/questionChunks/anatomi.js", import.meta.url).href
);

const targetIds = new Set([6933, 6934, 6935]);
const updated = QUESTIONS.map((q) => {
  if (!targetIds.has(q.id)) return q;
  if (q.exp?.trim()) return q;
  const exp = q.q_exp?.trim();
  if (!exp) throw new Error(`No exp source for id ${q.id}`);
  const { q_exp, ...rest } = q;
  return { ...rest, exp };
});

for (const id of targetIds) {
  const q = updated.find((item) => item.id === id);
  if (!q?.exp?.trim()) throw new Error(`Missing exp after fix for id ${id}`);
}

const out = `export const SUBJECT = "Anatomi";\nexport const QUESTIONS = ${JSON.stringify(updated)};\n`;
writeFileSync(chunkPath, out, "utf8");
console.log("Fixed exp for ids:", [...targetIds].join(", "));
