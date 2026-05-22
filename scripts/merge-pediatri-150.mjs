import { readFileSync, writeFileSync } from "node:fs";

const base = "c:/Users/ahmet/OneDrive/Masaüstü/TUSOSKOP informations";

const header = `import { writeFileSync } from "node:fs";

const START_ID = 5538;
const questions = [];
let idx = 0;

function add(konu, diff, q, options, correct, exp, type = "standard") {
  const rot = type === "yanlis" ? 0 : idx % 5;
  const rotated = rot ? [...options.slice(rot), ...options.slice(0, rot)] : options;
  const newCorrect = rot ? (correct + rot) % 5 : correct;
  questions.push({
    id: START_ID + idx,
    ders: "Pediatri",
    konu,
    diff,
    q,
    options: rotated,
    correct: newCorrect,
    exp,
    _type: type,
  });
  idx += 1;
}

`;

const footer = `
// ========== EXPORT ==========
if (questions.length !== 150) {
  throw new Error(\`Expected 150 questions, got \${questions.length}\`);
}

const konuCounts = {};
const diffCounts = { 3: 0, 4: 0, 5: 0 };
let yanlisCount = 0;
let vakaEstimate = 0;
const correctCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

for (const q of questions) {
  konuCounts[q.konu] = (konuCounts[q.konu] || 0) + 1;
  diffCounts[q.diff] += 1;
  if (q._type === "yanlis") yanlisCount += 1;
  if (
    q.q.includes("yaş") ||
    q.q.includes("yaşında") ||
    q.q.includes("yenidoğan") ||
    q.q.includes("hasta") ||
    q.q.includes("bebek") ||
    q.q.includes("çocuk")
  ) {
    vakaEstimate += 1;
  }
  correctCounts[q.correct] += 1;
}

const cleanQuestions = questions.map(({ _type, ...rest }) => rest);

const output = {
  meta: {
    ders: "Pediatri",
    count: 150,
    idRange: [START_ID, START_ID + 149],
    generatedAt: "2026-05-22",
    status: "taslak-rev3-tus-vaka",
    not: "Bankaya eklenmedi. TUS/USMLE tarzı uzun vaka kökleri (rev3).",
  },
  distribution: {
    konu: konuCounts,
    diff: diffCounts,
    yanlisTarzi: yanlisCount,
    vakaTahmini: vakaEstimate,
    spotTahmini: 150 - vakaEstimate,
    correctIndex: correctCounts,
  },
  questions: cleanQuestions,
};

const OUT =
  "c:/Users/ahmet/OneDrive/Masaüstü/TUSOSKOP informations/pediatri_150_taslak.json";
writeFileSync(OUT, JSON.stringify(output, null, 2), "utf8");
console.log("Yazildi:", OUT);
console.log("Soru sayisi:", cleanQuestions.length);
console.log("Konu:", konuCounts);
console.log("Diff:", diffCounts);
console.log("Yanlis tarzi:", yanlisCount);
console.log("Vaka tahmini:", vakaEstimate);
`;

function extractAdds(filePath) {
  const raw = readFileSync(filePath, "utf8");
  const lines = raw.split("\n");
  const adds = [];
  let buf = "";
  let depth = 0;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("add(") || buf) {
      buf += (buf ? "\n" : "") + line;
      depth += (line.match(/\(/g) || []).length;
      depth -= (line.match(/\)/g) || []).length;
      if (buf && depth <= 0 && t.endsWith(");")) {
        adds.push(buf.trim());
        buf = "";
        depth = 0;
      }
    }
  }
  return adds;
}

const allAdds = ["part1", "part2", "part3"].flatMap((p) =>
  extractAdds(`${base}/pediatri_150_${p}.mjs`)
);

if (allAdds.length !== 150) {
  throw new Error(`Expected 150 add() calls, got ${allAdds.length}`);
}

writeFileSync(`${base}/generate_pediatri_150.mjs`, `${header}${allAdds.join("\n\n")}\n${footer}`, "utf8");
console.log("Merged", allAdds.length, "questions");
