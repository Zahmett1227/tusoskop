import { readFile } from "node:fs/promises";
import { isValidTopic } from "../src/data/subjectTopicSchema.js";

const manifest = JSON.parse(
  await readFile(new URL("../src/data/questionChunks/_manifest.json", import.meta.url), "utf8")
);

const errors = [];
const warnings = [];
const seenIds = new Map();

const addError = (message) => errors.push(message);
const addWarning = (message) => warnings.push(message);
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

async function loadChunk(slug) {
  return import(new URL(`../src/data/questionChunks/${slug}.js`, import.meta.url).href);
}

function validateQuestion(question, context) {
  if (!question || typeof question !== "object") {
    addError(`${context}: question is not an object`);
    return;
  }

  if (!Number.isInteger(question.id)) {
    addError(`${context}: id must be an integer`);
  } else if (seenIds.has(question.id)) {
    addError(`${context}: duplicate id ${question.id} also used in ${seenIds.get(question.id)}`);
  } else {
    seenIds.set(question.id, context);
  }

  for (const field of ["ders", "konu", "q", "exp"]) {
    if (!isNonEmptyString(question[field])) {
      addError(`${context}: ${field} must be a non-empty string`);
    }
  }

  if (!Array.isArray(question.options) || question.options.length < 2) {
    addError(`${context}: options must contain at least 2 choices`);
  } else {
    question.options.forEach((option, index) => {
      if (!isNonEmptyString(option)) {
        addError(`${context}: options[${index}] must be a non-empty string`);
      }
    });
  }

  if (!Number.isInteger(question.correct)) {
    addError(`${context}: correct must be an integer option index`);
  } else if (Array.isArray(question.options) && (question.correct < 0 || question.correct >= question.options.length)) {
    addError(`${context}: correct index ${question.correct} is outside options length ${question.options.length}`);
  }

  if (question.diff !== undefined && (!Number.isFinite(Number(question.diff)) || Number(question.diff) < 1 || Number(question.diff) > 5)) {
    addWarning(`${context}: diff should be between 1 and 5`);
  }
}

for (const [slug, subjectName] of Object.entries(manifest.subjectBySlug || {})) {
  const mod = await loadChunk(slug);
  const questions = Array.isArray(mod.QUESTIONS) ? mod.QUESTIONS : null;
  if (!questions) {
    addError(`${slug}: QUESTIONS export must be an array`);
    continue;
  }

  if (mod.SUBJECT && mod.SUBJECT !== subjectName) {
    addError(`${slug}: SUBJECT "${mod.SUBJECT}" does not match manifest subject "${subjectName}"`);
  }

  const expectedCount = manifest.subjectCounts?.[subjectName];
  if (Number.isInteger(expectedCount) && questions.length !== expectedCount) {
    addError(`${slug}: expected ${expectedCount} questions, found ${questions.length}`);
  }

  questions.forEach((question, index) => {
    const context = `${slug}[${index}]`;
    if (question?.ders !== subjectName) {
      addError(`${context}: ders "${question?.ders}" does not match "${subjectName}"`);
    }
    if (isNonEmptyString(question?.konu) && !isValidTopic(subjectName, question.konu)) {
      addError(
        `${context}: konu "${question.konu}" is not a valid topic for "${subjectName}" (see src/data/subjectTopicSchema.js)`
      );
    }
    validateQuestion(question, context);
  });
}

if (warnings.length > 0) {
  console.warn(`Question bank warnings (${warnings.length}):`);
  warnings.slice(0, 50).forEach((warning) => console.warn(`- ${warning}`));
  if (warnings.length > 50) console.warn(`...and ${warnings.length - 50} more warnings`);
}

if (errors.length > 0) {
  console.error(`Question bank validation failed (${errors.length} errors):`);
  errors.slice(0, 100).forEach((error) => console.error(`- ${error}`));
  if (errors.length > 100) console.error(`...and ${errors.length - 100} more errors`);
  process.exit(1);
}

console.log(`Question bank validation passed: ${seenIds.size} questions across ${Object.keys(manifest.subjectBySlug || {}).length} subjects.`);
