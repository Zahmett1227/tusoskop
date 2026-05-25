/**
 * Sosyal medya içerik üretim orkestrasyonu (MVP).
 * Soru bankası + plan + metin + görsel + güvenlik → Firestore taslağı.
 */
import { planContentForDay, filterUnusedQuestions, pickRandomQuestion } from "./contentPlanner.js";
import { generateContentPackage } from "./contentGenerator.js";
import { renderSocialVisual, renderStoryVisual } from "./visualGenerator.js";
import { renderCarousel } from "./carouselGenerator.js";
import { runSafetyCheck } from "./safetyChecker.js";
import { SOCIAL_CONTENT_STATUS } from "./socialTypes.js";

function attachCarouselToDraft(draft, carouselSpecs) {
  if (!carouselSpecs?.length) return;
  const carousel = renderCarousel(carouselSpecs);
  draft.carouselSpecs = carouselSpecs;
  draft.carouselSlideCount = carousel.slideCount;
  draft.carouselSlides = carousel.slides.map((s, i) => ({
    index: i,
    svgUrl: s.svgUrl,
    svg: s.svg,
    width: s.width,
    height: s.height,
    format: s.format,
    slideRole: carouselSpecs[i]?.slideRole,
  }));
  // Carousel birincil görsel — Instagram kaydetmelik akış
  const primary = carousel.primary;
  if (primary) {
    draft.visualUrl = primary.svgUrl;
    draft.visualSvg = primary.svg;
    draft.visualWidth = primary.width;
    draft.visualHeight = primary.height;
    draft.visualFormat = primary.format;
    draft.visualMode = "carousel";
  }
}

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
        visualSpec: pkg.visual ?? null,
        storyVisualSpec: pkg.storyVisual ?? null,
        storyAnswerVisualSpec: pkg.storyAnswerVisual ?? null,
        visualMode: "single",
        createdBy: "auto",
      };

      if (pkg.carousel?.length) {
        attachCarouselToDraft(draft, pkg.carousel);
      } else {
        const visual = renderSocialVisual(pkg.visual);
        draft.visualUrl = visual.svgUrl;
        draft.visualSvg = visual.svg;
        draft.visualWidth = visual.width;
        draft.visualHeight = visual.height;
        draft.visualFormat = visual.format;
      }

      const storyVisual = pkg.storyVisual ? renderStoryVisual(pkg.storyVisual) : null;
      draft.storyVisualUrl = storyVisual?.svgUrl ?? null;
      draft.storyVisualSvg = storyVisual?.svg ?? null;
      draft.storyVisualWidth = storyVisual?.width ?? null;
      draft.storyVisualHeight = storyVisual?.height ?? null;
      draft.storyVisualFormat = storyVisual?.format ?? null;

      const storyAnswerVisual = pkg.storyAnswerVisual ? renderSocialVisual(pkg.storyAnswerVisual) : null;
      draft.storyAnswerVisualUrl = storyAnswerVisual?.svgUrl ?? null;
      draft.storyAnswerVisualSvg = storyAnswerVisual?.svg ?? null;
      draft.storyAnswerVisualWidth = storyAnswerVisual?.width ?? null;
      draft.storyAnswerVisualHeight = storyAnswerVisual?.height ?? null;
      draft.storyAnswerVisualFormat = storyAnswerVisual?.format ?? null;

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
