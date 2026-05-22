import { SOCIAL_CONTENT_TYPES } from "./socialTypes.js";
import { SOCIAL_CONFIG } from "./socialConfig.js";
import { pickHashtags } from "../data/socialHashtags.js";
import {
  FEATURE_PROMO_ITEMS,
  MINI_TIP_TOPICS,
  MOTIVATION_LINES,
} from "../data/socialContentRules.js";
import { pickHookForContent, generateCarouselSlides } from "./carouselGenerator.js";
import { structureMiniTipContent, optimizeForInstagram } from "./contentDensity.js";
import { CTAS } from "./design/socialTheme.js";

function optionLabel(index) {
  return String.fromCharCode(65 + index);
}

function buildQuestionOptions(question) {
  return question.options.map((opt, i) => ({
    letter: optionLabel(i),
    text: String(opt).trim(),
  }));
}

function buildQuestionVisualSpec(question, rng = Math.random) {
  return {
    templateType: "question_post",
    format: "1080x1080",
    hook: pickHookForContent(rng, question.ders),
    badge: "GÜNÜN TUS SORUSU",
    metaLine: `${question.ders} · ${question.konu}`,
    questionText: String(question.q || "").trim(),
    options: buildQuestionOptions(question),
    footerLeft: CTAS.comment,
    footerSecondary: CTAS.tomorrow,
  };
}

function buildQuestionStorySpec(question, rng = Math.random) {
  return {
    templateType: "story_question",
    format: "1080x1920",
    hook: pickHookForContent(rng, question.ders),
    badge: "BUGÜNÜN SORUSU",
    metaLine: `${question.ders} · ${question.konu}`,
    questionText: String(question.q || "").trim(),
    storyVariant: "quiz",
    footerPrimary: CTAS.comment,
    footer: "↑ Kaydır · yorumlara yaz",
  };
}

/**
 * Plan maddesinden tam içerik paketi üretir.
 * @param {object} planItem
 * @param {{ question?: object, feature?: object, rng?: () => number }} ctx
 */
export function generateContentPackage(planItem, ctx = {}) {
  const rng = ctx.rng || Math.random;
  switch (planItem.type) {
    case SOCIAL_CONTENT_TYPES.DAILY_QUESTION:
      return generateDailyQuestion(ctx.question, rng);
    case SOCIAL_CONTENT_TYPES.MINI_TIP:
      return generateMiniTip(rng);
    case SOCIAL_CONTENT_TYPES.FEATURE_PROMO:
      return generateFeaturePromo(planItem.feature || ctx.feature, rng);
    case SOCIAL_CONTENT_TYPES.MOTIVATION:
      return generateMotivation(rng);
    case SOCIAL_CONTENT_TYPES.STORY:
      return generateStory(planItem, rng);
    case SOCIAL_CONTENT_TYPES.ANSWER_REVEAL:
      return generateAnswerReveal(ctx.question, rng);
    default:
      throw new Error(`Bilinmeyen içerik tipi: ${planItem.type}`);
  }
}

function generateDailyQuestion(question, rng) {
  if (!question) {
    throw new Error("Günün sorusu için soru bankasından kayıt gerekli.");
  }
  const qFull = String(question.q || "").trim();
  const optionsText = question.options
    .map((opt, i) => `${optionLabel(i)}) ${opt}`)
    .join("\n");

  const intro = pickOne(
    [
      "Bugünün mini TUS sorusu geldi.",
      "Kısa mola ver, bir soru çöz.",
      "TUS temposunda küçük bir soru.",
    ],
    rng
  );

  const caption = [
    intro,
    "",
    qFull,
    "",
    optionsText,
    "",
    "Cevabını yorumlara yaz; yarın açıklamayı paylaşırız.",
    "Benzer sorular için Tusoskop'ta çalışmaya devam et.",
    "",
    pickHashtags({ ders: question.ders, max: SOCIAL_CONFIG.maxHashtags }).join(" "),
  ].join("\n");

  return {
    type: SOCIAL_CONTENT_TYPES.DAILY_QUESTION,
    title: `Günün Sorusu — ${question.ders}`,
    caption,
    hashtags: pickHashtags({ ders: question.ders }),
    sourceQuestionId: question.id,
    sourceDers: question.ders,
    sourceKonu: question.konu,
    answerPayload: {
      correctIndex: question.correct,
      correctText: question.options[question.correct],
      explanation: question.exp,
      revealCaption: buildAnswerRevealCaption(question),
    },
    visual: buildQuestionVisualSpec(question, rng),
    storyVisual: buildQuestionStorySpec(question, rng),
    carousel: generateCarouselSlides(question, rng),
  };
}

function buildAnswerRevealCaption(question) {
  const letter = optionLabel(question.correct);
  return [
    "Dünün sorusunun cevabı:",
    "",
    `Doğru cevap: ${letter}) ${question.options[question.correct]}`,
    "",
    question.exp,
    "",
    pickHashtags({ ders: question.ders }).join(" "),
  ].join("\n");
}

function generateAnswerReveal(question) {
  if (!question) throw new Error("Cevap paylaşımı için kaynak soru gerekli.");
  const letter = optionLabel(question.correct);
  return {
    type: SOCIAL_CONTENT_TYPES.ANSWER_REVEAL,
    title: "Cevap Paylaşımı",
    caption: buildAnswerRevealCaption(question),
    hashtags: pickHashtags({ ders: question.ders }),
    sourceQuestionId: question.id,
    visual: {
      templateType: "answer_post",
      format: "1080x1080",
      hook: "CEVAP AÇIKLANDI",
      subline: `${question.ders} · dünün sorusu`,
      answerLine: `Doğru cevap: ${letter}) ${question.options[question.correct]}`,
      explanation: optimizeForInstagram(String(question.exp || "").trim()),
    },
  };
}

function generateMiniTip(rng) {
  const topic = MINI_TIP_TOPICS[Math.floor(rng() * MINI_TIP_TOPICS.length)];
  const fillers = miniTipFillers(rng);
  const structured = structureMiniTipContent({
    title: topic.title,
    point: fillers.point,
    mechanism: fillers.drug ? `${fillers.drug} → ${fillers.mechanism}` : fillers.point,
    hint: fillers.hint,
    contrast: fillers.contrast,
  });

  const caption = [
    pickHookForContent(rng, fillers.topic),
    "",
    structured.captionBody,
    "",
    CTAS.app,
    "",
    pickHashtags({ ders: fillers.topic, extra: ["#TUSBilgi"] }).join(" "),
  ].join("\n");

  return {
    type: SOCIAL_CONTENT_TYPES.MINI_TIP,
    title: topic.title,
    caption,
    hashtags: pickHashtags({ ders: fillers.topic, extra: ["#TUSBilgi"] }),
    visual: {
      templateType: "mini_info_post",
      format: "1080x1080",
      hook: pickHookForContent(rng, fillers.topic),
      headline: "Mini TUS Bilgisi",
      subline: topic.title,
      bullets: structured.bullets,
      footerPrimary: CTAS.save,
    },
    storyVisual: {
      templateType: "story_question",
      format: "1080x1920",
      hook: "1 DAKİKADA ÖĞREN",
      storyVariant: "poll",
      questionText: structured.bullets[0] || topic.title,
      footer: CTAS.save,
    },
  };
}

function miniTipFillers(rng) {
  const pool = [
    {
      topic: "Farmakoloji",
      point: "ACE inhibitörü + bilateral renal arter stenozu → AKI riski",
      hint: "kreatinin artışı ve bilateral stenoz öyküsü",
      contrast: "ARB",
      drug: "Metformin",
      mechanism: "hepatik glukoneogenez inhibisyonu",
    },
    {
      topic: "Dahiliye",
      point: "Addison krizinde önce sıvı, sonra glukokortikoid",
      hint: "hipotansiyon + hiperpigmentasyon + hiponatremi",
      contrast: "SIADH",
      drug: "Warfarin",
      mechanism: "K vitamini epoksit reduktaz inhibisyonu",
    },
    {
      topic: "Pediatri",
      point: "Febril konvülsiyon vs menenjit: ense sertliği / letarji alarm",
      hint: "postiktal kısa ve tek atak genelde basit febril konvülsiyon",
      contrast: "kompleks febril konvülsiyon",
      drug: "Salbutamol",
      mechanism: "beta-2 agonizm → bronkodilatasyon",
    },
    {
      topic: "Mikrobiyoloji",
      point: "Grup A strep tonsillit → penisilin; direnç nadirdir",
      hint: "eksüdatif tonsillit + hızlı antijen",
      contrast: "viral farenjit",
      drug: "Penisilin",
      mechanism: "hücre duvarı sentez inhibisyonu",
    },
  ];
  return pool[Math.floor(rng() * pool.length)];
}

function generateFeaturePromo(feature, rng) {
  const f = feature || FEATURE_PROMO_ITEMS[Math.floor(rng() * FEATURE_PROMO_ITEMS.length)];
  const caption = [
    f.hook,
    "",
    f.body,
    "",
    f.cta,
    "",
    pickHashtags({ extra: ["#TUSÇalışması"] }).join(" "),
  ].join("\n");

  return {
    type: SOCIAL_CONTENT_TYPES.FEATURE_PROMO,
    title: f.title,
    caption,
    hashtags: pickHashtags({ extra: ["#TUSÇalışması"] }),
    featureId: f.id,
    visual: {
      templateType: "feature_post",
      format: "1080x1350",
      hook: f.hook,
      featureTitle: f.title,
      body: optimizeForInstagram(f.body),
      footer: f.cta,
      cta: f.cta,
    },
  };
}

function generateMotivation(rng) {
  const line = pickOne(MOTIVATION_LINES, rng);
  return {
    type: SOCIAL_CONTENT_TYPES.MOTIVATION,
    title: "Motivasyon",
    caption: [line, "", pickHashtags().join(" ")].join("\n"),
    hashtags: pickHashtags(),
    visual: {
      templateType: "mini_info_post",
      format: "1080x1080",
      hook: "TUS yolculuğu",
      headline: "TUS yolculuğu",
      body: line,
      footerPrimary: CTAS.app,
    },
  };
}

function generateStory(planItem, rng) {
  const pollQuestion = pickOne(
    [
      "Bugün kaç soru çözdün?",
      "Bu hafta en zorlandığın ders hangisi?",
      "Deneme mi konu testi mi?",
    ],
    rng
  );
  return {
    type: SOCIAL_CONTENT_TYPES.STORY,
    title: planItem.title || "Story",
    caption: "",
    hashtags: [],
    storyText: pollQuestion,
    storySuggestions: {
      poll: pollQuestion,
      linkSticker: SOCIAL_CONFIG.siteUrl,
      quizIdea: "Mini TUS: ACE inhibitörü yan etkisi?",
    },
    storyVisual: {
      templateType: "story_question",
      format: "1080x1920",
      hook: "ANKET",
      storyVariant: "poll",
      questionText: pollQuestion,
      footer: "↑ Kaydır · oy ver",
    },
  };
}

function pickOne(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

export {
  buildQuestionVisualSpec,
  buildQuestionOptions,
  optionLabel,
};
