/**
 * Sosyal medya görsel şablonları — visualGenerator.js ile eşleşir.
 */
export const VISUAL_TEMPLATE_TYPES = {
  QUESTION_POST: "question_post",
  MINI_INFO_POST: "mini_info_post",
  FEATURE_POST: "feature_post",
  STORY_QUESTION: "story_question",
  STORY_ANSWER: "story_answer",
  ANSWER_POST: "answer_post",
  CAROUSEL_SLIDE: "carousel_slide",
};

export const POST_TEMPLATES = {
  daily_question: {
    templateType: VISUAL_TEMPLATE_TYPES.QUESTION_POST,
    format: "1080x1080",
  },
  mini_tip: {
    templateType: VISUAL_TEMPLATE_TYPES.MINI_INFO_POST,
    format: "1080x1080",
  },
  feature_promo: {
    templateType: VISUAL_TEMPLATE_TYPES.FEATURE_POST,
    format: "1080x1350",
  },
  answer_reveal: {
    templateType: VISUAL_TEMPLATE_TYPES.ANSWER_POST,
    format: "1080x1080",
  },
  story: {
    templateType: VISUAL_TEMPLATE_TYPES.STORY_QUESTION,
    format: "1080x1920",
  },
};
