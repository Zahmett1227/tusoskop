/**
 * Sabit deneme questionId üretimi.
 *
 * Diğer 9 deneme (TD1 hariç): node scripts/generate-fixed-exam-ids.mjs
 * Yalnızca Tekrar Denemesi 1: node scripts/generate-fixed-exam-ids.mjs --only-tekrar-denemesi-1
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import {
  buildFixedExamQuestionList,
  validateFixedExamQuestions,
} from "./lib/fixedExamGenerator.mjs";
import { KAMP_DENEMESI_1_QUESTION_IDS } from "../src/data/fixedExams/kampDenemesi1QuestionIds.js";
import { KAMP_DENEMESI_2_QUESTION_IDS } from "../src/data/fixedExams/kampDenemesi2QuestionIds.js";
import { KAMP_DENEMESI_3_QUESTION_IDS } from "../src/data/fixedExams/kampDenemesi3QuestionIds.js";
import { BAHAR_DENEMESI_1_QUESTION_IDS } from "../src/data/fixedExams/baharDenemesi1QuestionIds.js";
import { BAHAR_DENEMESI_2_QUESTION_IDS } from "../src/data/fixedExams/baharDenemesi2QuestionIds.js";
import { BAHAR_DENEMESI_3_QUESTION_IDS } from "../src/data/fixedExams/baharDenemesi3QuestionIds.js";
import { TEKRAR_DENEMESI_2_QUESTION_IDS } from "../src/data/fixedExams/tekrarDenemesi2QuestionIds.js";
import { TEKRAR_DENEMESI_3_QUESTION_IDS } from "../src/data/fixedExams/tekrarDenemesi3QuestionIds.js";
import { TEKRAR_DENEMESI_4_QUESTION_IDS } from "../src/data/fixedExams/tekrarDenemesi4QuestionIds.js";

const TEKRAR_DENEMESI_1_EXAM_ID = 7;
const ONLY_TD1 = process.argv.includes("--only-tekrar-denemesi-1");

const OTHER_NINE_IDS = [
  KAMP_DENEMESI_1_QUESTION_IDS,
  KAMP_DENEMESI_2_QUESTION_IDS,
  KAMP_DENEMESI_3_QUESTION_IDS,
  BAHAR_DENEMESI_1_QUESTION_IDS,
  BAHAR_DENEMESI_2_QUESTION_IDS,
  BAHAR_DENEMESI_3_QUESTION_IDS,
  TEKRAR_DENEMESI_2_QUESTION_IDS,
  TEKRAR_DENEMESI_3_QUESTION_IDS,
  TEKRAR_DENEMESI_4_QUESTION_IDS,
];

const FIXED_EXAM_SPECS = [
  { id: 1, slug: "kampDenemesi1", constName: "KAMP_DENEMESI_1_QUESTION_IDS", title: "Kamp Denemesi 1" },
  { id: 2, slug: "kampDenemesi2", constName: "KAMP_DENEMESI_2_QUESTION_IDS", title: "Kamp Denemesi 2" },
  { id: 3, slug: "kampDenemesi3", constName: "KAMP_DENEMESI_3_QUESTION_IDS", title: "Kamp Denemesi 3" },
  { id: 4, slug: "baharDenemesi1", constName: "BAHAR_DENEMESI_1_QUESTION_IDS", title: "Bahar Denemesi 1" },
  { id: 5, slug: "baharDenemesi2", constName: "BAHAR_DENEMESI_2_QUESTION_IDS", title: "Bahar Denemesi 2" },
  { id: 6, slug: "baharDenemesi3", constName: "BAHAR_DENEMESI_3_QUESTION_IDS", title: "Bahar Denemesi 3" },
  { id: 8, slug: "tekrarDenemesi2", constName: "TEKRAR_DENEMESI_2_QUESTION_IDS", title: "Tekrar Denemesi 2" },
  { id: 9, slug: "tekrarDenemesi3", constName: "TEKRAR_DENEMESI_3_QUESTION_IDS", title: "Tekrar Denemesi 3" },
  { id: 10, slug: "tekrarDenemesi4", constName: "TEKRAR_DENEMESI_4_QUESTION_IDS", title: "Tekrar Denemesi 4" },
];

const manifest = JSON.parse(
  await readFile(new URL("../src/data/questionChunks/_manifest.json", import.meta.url), "utf8")
);

async function loadChunk(slug) {
  return import(new URL(`../src/data/questionChunks/${slug}.js`, import.meta.url).href);
}

const bySubject = {};
for (const [slug, subjectName] of Object.entries(manifest.subjectBySlug)) {
  const mod = await loadChunk(slug);
  bySubject[subjectName] = mod.QUESTIONS || [];
}

function idsFromOtherNine() {
  const used = new Set();
  for (const list of OTHER_NINE_IDS) {
    for (const id of list) used.add(Number(id));
  }
  return used;
}

async function writeTd1(ids, check) {
  const outPath = new URL("../src/data/tekrarDenemesi1QuestionIds.js", import.meta.url);
  const content = `/** Sabit 200 soru — Tekrar Denemesi 1 (scripts/generate-fixed-exam-ids.mjs --only-tekrar-denemesi-1) */\nexport const TEKRAR_DENEMESI_1_QUESTION_IDS = ${JSON.stringify(ids)};\n`;
  await writeFile(outPath, content, "utf8");
  console.log(`Tekrar Denemesi 1: ${ids.length} id → src/data/tekrarDenemesi1QuestionIds.js`);
  console.log(`  İlk id: ${ids[0]}, son id: ${ids[199]}`);
  console.log(`  En uzun ders+konu art arda: ${check.topicStreak}, ders art arda: ${check.dersStreak}`);
}

if (ONLY_TD1) {
  const reservedFromOtherNine = idsFromOtherNine();
  const globalUsed = new Set(reservedFromOtherNine);
  const ordered = buildFixedExamQuestionList(bySubject, {
    usedIds: globalUsed,
    topicStartOffset: TEKRAR_DENEMESI_1_EXAM_ID * 3,
  });
  const check = validateFixedExamQuestions(ordered);
  if (!check.ok) {
    throw new Error(`Tekrar Denemesi 1: doğrulama başarısız (${check.reason})`);
  }

  const ids = ordered.map((q) => q.id);
  const overlap = ids.filter((id) => reservedFromOtherNine.has(Number(id)));
  if (overlap.length > 0) {
    throw new Error(`Tekrar Denemesi 1: diğer 9 denemeyle ${overlap.length} id çakışması`);
  }

  await writeTd1(ids, check);

  const allIds = [...reservedFromOtherNine, ...ids];
  const uniqueGlobal = new Set(allIds);
  console.log(`\nDiğer 9 deneme: değiştirilmedi (${reservedFromOtherNine.size} id)`);
  console.log(`Toplam kullanılan id: ${allIds.length}, benzersiz: ${uniqueGlobal.size}`);
  if (allIds.length !== uniqueGlobal.size) {
    console.warn(`UYARI: Denemeler arası ${allIds.length - uniqueGlobal.size} id tekrarı var.`);
  }
  process.exit(0);
}

const outDir = new URL("../src/data/fixedExams/", import.meta.url);
await mkdir(outDir, { recursive: true });

const { TEKRAR_DENEMESI_1_QUESTION_IDS } = await import(
  "../src/data/tekrarDenemesi1QuestionIds.js"
);

const globalUsed = new Set(TEKRAR_DENEMESI_1_QUESTION_IDS.map(Number));
const generated = [];

for (const spec of FIXED_EXAM_SPECS) {
  const ordered = buildFixedExamQuestionList(bySubject, {
    usedIds: globalUsed,
    topicStartOffset: spec.id * 3,
  });
  const check = validateFixedExamQuestions(ordered);
  if (!check.ok) {
    throw new Error(`${spec.title}: doğrulama başarısız (${check.reason})`);
  }

  const ids = ordered.map((q) => q.id);
  const filePath = new URL(`${spec.slug}QuestionIds.js`, outDir);
  const content = `/** Sabit 200 soru — ${spec.title} (scripts/generate-fixed-exam-ids.mjs) */\nexport const ${spec.constName} = ${JSON.stringify(ids)};\n`;
  await writeFile(filePath, content, "utf8");
  generated.push({ ...spec, ids, topicStreak: check.topicStreak, dersStreak: check.dersStreak });
  console.log(
    `${spec.title}: ${ids.length} id → src/data/fixedExams/${spec.slug}QuestionIds.js (konu:${check.topicStreak}, ders:${check.dersStreak})`
  );
}

const allIds = [...globalUsed];
const uniqueGlobal = new Set(allIds);
console.log(`\nTekrar Denemesi 1: ${TEKRAR_DENEMESI_1_QUESTION_IDS.length} id (değiştirilmedi)`);
console.log(`Yeni üretilen deneme: ${generated.length}`);
console.log(`Toplam kullanılan id: ${allIds.length + generated.reduce((s, g) => s + g.ids.length, 0)}, benzersiz: ${uniqueGlobal.size + generated.reduce((s, g) => s + g.ids.length, 0) - allIds.length}`);
