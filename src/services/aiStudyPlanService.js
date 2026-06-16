/**
 * Frontend service for AI-powered daily study plan.
 * Calls the generateDailyStudyPlan Cloud Function and normalizes the result.
 * The API key is never exposed here — it lives in Firebase Functions secrets.
 */

import { getFunctions, httpsCallable } from "firebase/functions";

let _generateFn = null;

function getGenerateFn() {
  if (!_generateFn) {
    const functions = getFunctions(undefined, "us-central1");
    _generateFn = httpsCallable(functions, "generateDailyStudyPlan");
  }
  return _generateFn;
}

/**
 * Returns today's AI study plan. Uses cached Firestore result when available.
 *
 * @returns {Promise<{
 *   date: string,
 *   recommendation: {
 *     dailyPlan: Array<{
 *       type: string,
 *       title: string,
 *       lesson: string|null,
 *       topic: string|null,
 *       questionCount: number,
 *       estimatedMinutes: number,
 *       reason: string
 *     }>,
 *     summary: string,
 *     motivationMessage: string,
 *     risk: string
 *   },
 *   status: "success"|"fallback",
 *   cached: boolean
 * }>}
 */
export async function getDailyStudyPlan() {
  const fn = getGenerateFn();
  try {
    const result = await fn({});
    return normalizePlanResponse(result.data);
  } catch (err) {
    if (err?.code === "functions/permission-denied") {
      throw Object.assign(new Error("premium_required"), { isPremiumRequired: true });
    }
    throw err;
  }
}

function normalizePlanResponse(raw) {
  const rec = raw?.recommendation ?? {};
  return {
    date: raw?.date ?? "",
    cached: Boolean(raw?.cached),
    status: raw?.status ?? "success",
    recommendation: {
      dailyPlan: Array.isArray(rec.dailyPlan) ? rec.dailyPlan : [],
      summary: rec.summary ?? "",
      motivationMessage: rec.motivationMessage ?? "",
      risk: rec.risk ?? "none",
    },
  };
}
