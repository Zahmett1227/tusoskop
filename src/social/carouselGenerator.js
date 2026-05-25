import { HOOKS, CTAS } from "./design/socialTheme.js";
import { renderSocialVisual } from "./visualGenerator.js";
import { summarizeForSlide, extractClinicalTip } from "./contentDensity.js";

function optionLabel(index) {
  return String.fromCharCode(65 + index);
}

/**
 * Soru için 5 slidelık carousel spec dizisi üretir.
 * Slide 1: Hook + soru
 * Slide 2: Mini bağlam / odak
 * Slide 3: Doğru cevap (cevap günü veya spoiler modunda)
 * Slide 4: Klinik püf nokta
 * Slide 5: CTA
 */
export function generateCarouselSlides(question, rng = Math.random, options = {}) {
  const hook = options.hook || pickHook(question, rng);
  const metaLine = `${question.ders} · ${question.konu}`;
  const qText = String(question.q || "").trim();
  const tip = extractClinicalTip(question.exp);
  const slideTotal = 5;
  const topicCtx = { ders: question.ders, konu: question.konu, metaLine };

  return [
    {
      templateType: "carousel_slide",
      slideRole: "hook_question",
      slideIndex: 0,
      slideTotal,
      format: "1080x1350",
      ...topicCtx,
      hook,
      metaLine,
      eyebrow: "GÜNÜN TUS SORUSU",
      questionText: qText,
      footerPrimary: CTAS.comment,
      footerSecondary: CTAS.tomorrow,
    },
    {
      templateType: "carousel_slide",
      slideRole: "context",
      slideIndex: 1,
      slideTotal,
      format: "1080x1350",
      ...topicCtx,
      hook: "Odak noktası",
      metaLine,
      title: "Ne soruluyor?",
      body: summarizeForSlide(qText, 200),
      bullets: question.options.slice(0, 3).map((o, i) => `${optionLabel(i)}) ${o}`),
      bulletsNote: question.options.length > 3 ? "Diğer seçenekler sonraki slaytta" : null,
    },
    {
      templateType: "carousel_slide",
      slideRole: "options",
      slideIndex: 2,
      slideTotal,
      format: "1080x1350",
      ...topicCtx,
      hook: "Seçenekleri incele",
      metaLine,
      questionText: summarizeForSlide(qText, 120),
      options: question.options.map((opt, i) => ({ letter: optionLabel(i), text: opt })),
      footerPrimary: CTAS.comment,
    },
    {
      templateType: "carousel_slide",
      slideRole: "tip",
      slideIndex: 3,
      slideTotal,
      format: "1080x1350",
      ...topicCtx,
      hook: "Klinik püf nokta",
      metaLine,
      title: "Unutma",
      body: tip,
      bullets: toMechanismBullets(question.exp),
      footerPrimary: CTAS.save,
    },
    {
      templateType: "carousel_slide",
      slideRole: "cta",
      slideIndex: 4,
      slideTotal,
      format: "1080x1350",
      ...topicCtx,
      hook: "Tusoskop",
      title: "Daha fazla soru çöz",
      body: "Konu testleri, yanlış tekrarı ve TUS odaklı soru bankası.",
      bullets: ["Kaydet · tekrar et", "Arkadaşına gönder", "Benzer sorular uygulamada"],
      footerPrimary: CTAS.app,
      footerSecondary: "tusoskop.com",
    },
  ];
}

/** Cevap açıklama carousel'i (answer reveal için) */
export function generateAnswerCarouselSlides(question) {
  const letter = optionLabel(question.correct);
  const metaLine = `${question.ders} · cevap`;
  return [
    {
      templateType: "carousel_slide",
      slideRole: "answer",
      slideIndex: 0,
      slideTotal: 3,
      format: "1080x1350",
      hook: "Dünün sorusu · cevap",
      metaLine,
      title: "Doğru cevap",
      answerLine: `${letter}) ${question.options[question.correct]}`,
      footerPrimary: CTAS.save,
    },
    {
      templateType: "carousel_slide",
      slideRole: "explain",
      slideIndex: 1,
      slideTotal: 3,
      format: "1080x1350",
      hook: "Neden?",
      metaLine,
      title: "Açıklama",
      body: summarizeForSlide(question.exp, 280),
      bullets: toMechanismBullets(question.exp),
    },
    {
      templateType: "carousel_slide",
      slideRole: "cta",
      slideIndex: 2,
      slideTotal: 3,
      format: "1080x1350",
      hook: "Tusoskop",
      title: "Benzer sorular",
      body: "Aynı konudan onlarca TUS sorusu.",
      footerPrimary: CTAS.app,
    },
  ];
}

function toMechanismBullets(exp) {
  const parts = String(exp || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12 && s.length < 100);
  return parts.slice(0, 3);
}

function pickHook(question, rng) {
  const dersHooks = {
    Farmakoloji: ["Farmakolojide sık hata", "Bu bilgi soru getirir"],
    Dahiliye: ["Klinikte karşına çıkar", "TUS'ta çok karışan nokta"],
    Pediatri: ["Pediatride klasik tuzak", "1 dakikada öğren"],
  };
  const pool = dersHooks[question.ders] || HOOKS;
  return pool[Math.floor(rng() * pool.length)];
}

/**
 * Carousel slidelarını render eder.
 * @returns {{ slides: object[], primary: object, slideCount: number }}
 */
export function renderCarousel(slideSpecs) {
  const slides = (slideSpecs || []).map((spec) => renderSocialVisual(spec));
  return {
    slides,
    primary: slides[0] || null,
    slideCount: slides.length,
  };
}

export function pickHookForContent(rng = Math.random, ders) {
  const dersHooks = {
    Farmakoloji: ["Farmakolojide sık hata", "Bu bilgi soru getirir"],
    Mikrobiyoloji: ["Son yıllarda tekrar soruldu", "Mini ama kritik bilgi"],
  };
  const pool = (ders && dersHooks[ders]) || HOOKS;
  return pool[Math.floor(rng() * pool.length)];
}
