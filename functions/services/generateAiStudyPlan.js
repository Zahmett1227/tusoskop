/**
 * Calls Google Gemini API to generate a daily study plan.
 * API key is injected via Firebase Functions secret (GEMINI_API_KEY).
 *
 * @param {object} studySummary - Output of buildUserStudySummary()
 * @param {string} apiKey       - Gemini API key (from secret)
 * @returns {Promise<object>}   - Parsed and validated recommendation object
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { systemPrompt, buildUserPrompt } = require("../prompts/dailyStudyPlanPrompt");
const { validateStudyPlanJson } = require("../utils/validateStudyPlanJson");

const MODEL_NAME = "gemini-2.5-flash";

async function generateAiStudyPlan(studySummary, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      // gemini-2.5-* modelleri "thinking" token harcar; kapatınca tüm bütçe
      // gerçek JSON çıktısına ayrılır ve yanıt yarıda kesilmez.
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  });

  const userPrompt = buildUserPrompt(studySummary);
  const result = await model.generateContent(userPrompt);

  const finishReason = result.response?.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== "STOP") {
    console.warn("[AI_PLAN] beklenmeyen finishReason:", finishReason);
  }

  const text = result.response.text();

  // Strip any accidental markdown code fences before parsing
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`AI JSON parse hatası: ${err.message}. Ham yanıt: ${text.slice(0, 200)}`);
  }

  const { valid, data, error } = validateStudyPlanJson(parsed);
  if (!valid) {
    throw new Error(`AI JSON şema hatası: ${error}`);
  }

  return { recommendation: data, model: MODEL_NAME };
}

module.exports = { generateAiStudyPlan };
