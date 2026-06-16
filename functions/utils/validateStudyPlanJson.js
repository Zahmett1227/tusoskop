/**
 * Validates the AI-generated daily study plan JSON against the expected schema.
 * Returns { valid: true, data } or { valid: false, error }.
 */

const ALLOWED_TYPES = new Set([
  "fsrs_review",
  "weak_topic_test",
  "mixed_test",
  "rest_or_light_review",
]);

const ALLOWED_RISKS = new Set([
  "none",
  "overdue_fsrs_accumulation",
  "weak_topic_neglect",
  "low_activity",
]);

/**
 * @param {unknown} raw - Parsed JSON object from AI response
 * @returns {{ valid: boolean, data?: object, error?: string }}
 */
function validateStudyPlanJson(raw) {
  if (!raw || typeof raw !== "object") {
    return { valid: false, error: "Yanıt bir nesne değil." };
  }

  const { dailyPlan, summary, motivationMessage, risk } = raw;

  if (!Array.isArray(dailyPlan)) {
    return { valid: false, error: "dailyPlan bir dizi olmalı." };
  }
  if (dailyPlan.length === 0) {
    return { valid: false, error: "dailyPlan boş olamaz." };
  }
  if (dailyPlan.length > 4) {
    return { valid: false, error: "dailyPlan en fazla 4 madde içerebilir." };
  }

  for (let i = 0; i < dailyPlan.length; i++) {
    const item = dailyPlan[i];
    if (!item || typeof item !== "object") {
      return { valid: false, error: `dailyPlan[${i}] bir nesne değil.` };
    }
    if (!ALLOWED_TYPES.has(item.type)) {
      return {
        valid: false,
        error: `dailyPlan[${i}].type geçersiz: "${item.type}".`,
      };
    }
    if (typeof item.title !== "string" || !item.title.trim()) {
      return { valid: false, error: `dailyPlan[${i}].title string olmalı.` };
    }
    if (item.lesson !== null && typeof item.lesson !== "string") {
      return {
        valid: false,
        error: `dailyPlan[${i}].lesson string veya null olmalı.`,
      };
    }
    if (item.topic !== null && typeof item.topic !== "string") {
      return {
        valid: false,
        error: `dailyPlan[${i}].topic string veya null olmalı.`,
      };
    }
    if (typeof item.questionCount !== "number" || item.questionCount <= 0) {
      return {
        valid: false,
        error: `dailyPlan[${i}].questionCount pozitif sayı olmalı.`,
      };
    }
    if (
      typeof item.estimatedMinutes !== "number" ||
      item.estimatedMinutes <= 0
    ) {
      return {
        valid: false,
        error: `dailyPlan[${i}].estimatedMinutes pozitif sayı olmalı.`,
      };
    }
    if (typeof item.reason !== "string" || !item.reason.trim()) {
      return { valid: false, error: `dailyPlan[${i}].reason string olmalı.` };
    }
  }

  if (typeof summary !== "string" || !summary.trim()) {
    return { valid: false, error: "summary string olmalı." };
  }
  if (typeof motivationMessage !== "string" || !motivationMessage.trim()) {
    return { valid: false, error: "motivationMessage string olmalı." };
  }
  if (!ALLOWED_RISKS.has(risk)) {
    return { valid: false, error: `risk geçersiz: "${risk}".` };
  }

  return { valid: true, data: raw };
}

module.exports = { validateStudyPlanJson };
