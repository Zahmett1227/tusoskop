// Tanıdle veri pipeline'ı.
//
// Tusoskop soru bankasındaki klinik vignette'leri (çok cümleli hasta öyküsü)
// günlük tahmin oyununun ipucu setlerine dönüştürür.
//
// Her TUS vignette'i zaten "hasta öyküsü → ne soruluyor?" yapısında olduğu için
// AI'a gerek yoktur: cümleler sırayla ipucu olur, son cümle (soru) prompt olur.
//
// Kullanım:
//   node scripts/build-questions.mjs <tusoskop-questionChunks-dizini>
//   (varsayılan: ../src/data/questionChunks — yan yana klonlanmış tusoskop reposu)
//
// Çıktı: public/questions.json

import { pathToFileURL } from "url";
import { resolve, dirname, join } from "path";
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SRC = resolve(process.argv[2] || join(__dirname, "../../src/data/questionChunks"));
const OUT = resolve(join(__dirname, "../public/questions.json"));

// Vignette formatına en uygun klinik dersler.
const SLUGS = [
  "dahiliye",
  "pediatri",
  "genel_cerrahi",
  "kad_n_hastal_klar_ve_dogum",
  "kucuk_stajlar",
];

// TR-duyarlı cümle bölme. Ondalık sayıları (4.5) korur: nokta yalnızca
// boşluk + büyük harf geldiğinde cümle sonu sayılır.
function splitSentences(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Sabit tohumlu deterministik karıştırma (mulberry32) — günlük sıralamada
// dersleri dağıtır, her build'de aynı sırayı üretir.
function seededShuffle(arr, seed = 20250101) {
  let a = seed >>> 0;
  const rng = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

let total = 0;
const out = [];

for (const slug of SLUGS) {
  let mod;
  try {
    mod = await import(pathToFileURL(`${SRC}/${slug}.js`).href);
  } catch (e) {
    console.error(`UYARI: ${slug}.js okunamadı (${e.message}) — atlanıyor.`);
    continue;
  }
  const qs = mod.QUESTIONS || [];
  total += qs.length;
  for (const q of qs) {
    const sentences = splitSentences(q.q);
    const last = sentences[sentences.length - 1] || "";
    if (!last.endsWith("?")) continue; // son cümle gerçek soru olmalı
    const clues = sentences.slice(0, -1);
    if (clues.length < 2) continue; // en az 2 ipucu
    const body = clues.join(" ");
    if (!/(yaşında|hasta|olgu|başvur|getiril)/i.test(body)) continue; // vignette mi?
    if (!Array.isArray(q.options) || q.options.length < 2) continue;
    if (typeof q.correct !== "number") continue;

    out.push({
      id: q.id,
      ders: q.ders,
      konu: q.konu || "",
      prompt: last,
      clues: clues.slice(0, 5), // en fazla 5 ipucu
      options: q.options,
      correct: q.correct,
      exp: q.exp || "",
    });
  }
}

const shuffled = seededShuffle(out);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(shuffled));

const dist = {};
for (const o of shuffled) dist[o.clues.length] = (dist[o.clues.length] || 0) + 1;
const byDers = shuffled.reduce((a, o) => ((a[o.ders] = (a[o.ders] || 0) + 1), a), {});

console.log(`Kaynak taranan soru : ${total}`);
console.log(`Üretilen vaka       : ${shuffled.length}`);
console.log(`İpucu dağılımı      : ${JSON.stringify(dist)}`);
console.log(`Ders dağılımı       : ${JSON.stringify(byDers)}`);
console.log(`Yazıldı             : ${OUT}`);
