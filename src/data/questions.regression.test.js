import { beforeAll, describe, expect, it } from "vitest";
import manifest from "./questionChunks/_manifest.json";
import { loadAllQuestions, SUBJECT_QUESTION_COUNTS } from "./questions";

const KNOWN_SUBJECTS = new Set(Object.keys(SUBJECT_QUESTION_COUNTS || {}));
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

describe("question bank regression", () => {
  let allQuestions = [];

  beforeAll(async () => {
    allQuestions = await loadAllQuestions();
  }, 60_000);

  it("loads the full question bank", () => {
    expect(allQuestions.length).toBeGreaterThan(0);
  });

  it("has unique question ids", () => {
    const seenIds = new Map();
    const duplicates = [];

    for (let index = 0; index < allQuestions.length; index += 1) {
      const question = allQuestions[index];
      const id = question?.id;
      const context = `index=${index} ders=${question?.ders ?? "?"}`;

      if (!Number.isInteger(id)) {
        duplicates.push(`${context}: id must be an integer, got ${String(id)}`);
        continue;
      }

      if (seenIds.has(id)) {
        duplicates.push(
          `duplicate id ${id}: ${seenIds.get(id)} and ${context}`
        );
      } else {
        seenIds.set(id, context);
      }
    }

    expect(duplicates, duplicates.slice(0, 50).join("\n")).toEqual([]);
  });

  it("enforces required fields and structural shape", () => {
    const failures = [];

    for (let index = 0; index < allQuestions.length; index += 1) {
      const question = allQuestions[index];
      const id = question?.id;
      const context = `id=${id ?? "?"} index=${index} ders=${question?.ders ?? "?"}`;

      if (!question || typeof question !== "object") {
        failures.push(`${context}: question is not an object`);
        continue;
      }

      if (!Number.isInteger(id)) {
        failures.push(`${context}: id must be an integer`);
      }

      for (const field of ["ders", "konu", "q", "exp"]) {
        if (!isNonEmptyString(question[field])) {
          failures.push(`${context}: ${field} must be a non-empty string`);
        }
      }

      if (question.diff === undefined || question.diff === null) {
        failures.push(`${context}: diff is required`);
      } else if (
        !Number.isFinite(Number(question.diff)) ||
        Number(question.diff) < 1 ||
        Number(question.diff) > 5
      ) {
        failures.push(`${context}: diff must be a number between 1 and 5`);
      }

      if (!Array.isArray(question.options)) {
        failures.push(`${context}: options must be an array`);
      } else if (question.options.length !== 5) {
        failures.push(
          `${context}: options must contain exactly 5 choices, found ${question.options.length}`
        );
      } else {
        question.options.forEach((option, optionIndex) => {
          if (!isNonEmptyString(option)) {
            failures.push(
              `${context}: options[${optionIndex}] must be a non-empty string`
            );
          }
        });
      }

      if (!Number.isInteger(question.correct)) {
        failures.push(`${context}: correct must be an integer`);
      } else if (question.correct < 0 || question.correct > 4) {
        failures.push(
          `${context}: correct must be between 0 and 4, got ${question.correct}`
        );
      }

      if (!KNOWN_SUBJECTS.has(question.ders)) {
        failures.push(
          `${context}: ders "${question.ders}" is not in SUBJECT_QUESTION_COUNTS (${[...KNOWN_SUBJECTS].join(", ")})`
        );
      }
    }

    expect(failures, failures.slice(0, 50).join("\n")).toEqual([]);
  });

  it("matches manifest subject counts per chunk", async () => {
    const mismatches = [];

    for (const [slug, subjectName] of Object.entries(manifest.subjectBySlug || {})) {
      const mod = await import(`./questionChunks/${slug}.js`);
      const questions = Array.isArray(mod.QUESTIONS) ? mod.QUESTIONS : [];
      const expected = SUBJECT_QUESTION_COUNTS[subjectName];

      if (!Number.isInteger(expected)) {
        mismatches.push(`${slug}: missing manifest count for "${subjectName}"`);
        continue;
      }

      if (questions.length !== expected) {
        mismatches.push(
          `${slug} (${subjectName}): manifest expects ${expected}, found ${questions.length}`
        );
      }

      questions.forEach((question, index) => {
        if (question?.ders !== subjectName) {
          mismatches.push(
            `${slug}[${index}] id=${question?.id}: ders "${question?.ders}" does not match manifest subject "${subjectName}"`
          );
        }
      });
    }

    expect(mismatches, mismatches.slice(0, 50).join("\n")).toEqual([]);
  }, 60_000);

  it("matches total question count to manifest sum", () => {
    const expectedTotal = Object.values(SUBJECT_QUESTION_COUNTS).reduce(
      (sum, count) => sum + Number(count || 0),
      0
    );

    expect(
      allQuestions.length,
      `loaded ${allQuestions.length} questions, manifest sum is ${expectedTotal}`
    ).toBe(expectedTotal);
  });
});
