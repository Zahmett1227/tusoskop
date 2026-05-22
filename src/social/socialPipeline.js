/**
 * Sosyal medya içerik üretim orkestrasyonu (MVP).
 * Soru bankası + plan + metin + görsel + güvenlik → Firestore taslağı.
 */
import { planContentForDay, filterUnusedQuestions, pickRandomQuestion } from "./contentPlanner.js";
import { generateContentPackage } from "./contentGenerator.js";
import { renderSocialVisual, renderStoryVisual } from "./visualGenerator.js";
import { runSafetyCheck } from "./safetyChecker.js";
import { SOCIAL_CONTENT_STATUS } from "./socialTypes.js";

/**
 * @param {{ questions: object[], recentQuestionIds?: number[], recentFeatureIds?: string[], recentCaptions?: string[], date?: Date }} input
 */
export function buildSocialContentBatch(input) {
  const plan = planContentForDay({
    date: input.date,
    usedQuestionIds: input.recentQuestionIds,
    usedFeatureIds: input.recentFeatureIds,
  });

  const usedQ = new Set(input.recentQuestionIds || []);
  const pool = filterUnusedQuestions(input.questions || [], usedQ);
  const outputs = [];

  for (const item of plan.items) {
    try {
      const ctx = { rng: Math.random };
      if (item.type === "daily_question") {
        ctx.question = pickRandomQuestion(pool.length ? pool : input.questions);
        if (ctx.question) usedQ.add(ctx.question.id);
      }
      if (item.type === "feature_promo" && item.feature) {
        ctx.feature = item.feature;
      }

      const pkg = generateContentPackage(item, ctx);
      const visual = renderSocialVisual(pkg.visual);
      const storyVisual = pkg.storyVisual ? renderStoryVisual(pkg.storyVisual) : null;

      const draft = {
        type: pkg.type,
        status: SOCIAL_CONTENT_STATUS.PENDING_REVIEW,
        title: pkg.title,
        caption: pkg.caption,
        hashtags: pkg.hashtags,
        platform: "instagram",
        scheduledAt: item.scheduledAt,
        sourceQuestionId: pkg.sourceQuestionId ?? null,
        sourceDers: pkg.sourceDers ?? null,
        sourceKonu: pkg.sourceKonu ?? null,
        featureId: pkg.featureId ?? null,
        answerPayload: pkg.answerPayload ?? null,
        storyText: pkg.storyText ?? null,
        storySuggestions: pkg.storySuggestions ?? null,
        visualUrl: visual.svgUrl,
        visualSvg: visual.svg,
        visualWidth: visual.width,
        visualHeight: visual.height,
        visualFormat: visual.format,
        storyVisualUrl: storyVisual?.svgUrl ?? null,
        storyVisualSvg: storyVisual?.svg ?? null,
        createdBy: "auto",
      };

      const safetyReport = runSafetyCheck(draft, {
        recentCaptions: input.recentCaptions || [],
      });
      draft.safetyReport = safetyReport;
      if (!safetyReport.passed) {
        draft.status = SOCIAL_CONTENT_STATUS.DRAFT;
        draft.safetyBlocked = true;
      }

      outputs.push({ planItem: item, content: draft });
    } catch (err) {
      outputs.push({
        planItem: item,
        error: err?.message || String(err),
      });
    }
  }

  return { plan, outputs };
}

export { planContentForDay };
