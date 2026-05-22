import { SOCIAL_CONFIG } from "./socialConfig.js";
import {
  escapeXml,
  fitTextToBox,
  renderMultilineText,
  wrapTextByWidth,
  splitLongText,
} from "./textLayout.js";
import {
  FORMATS,
  CTAS,
  fonts,
  typography,
  fontSizeMin,
  fontSizeMax,
  measureContentDensity,
  chooseLayoutVariant,
  layoutSpacing,
  colors,
} from "./design/socialTheme.js";
import {
  makeUid,
  svgDocument,
  renderHookChip,
  renderGlassCard,
  renderOptionPill,
  renderCtaBar,
  renderBrandMark,
  renderSlideDots,
  renderMetaLine,
  renderDisplayText,
  renderBulletCards,
  finishVisual,
} from "./design/svgCompositor.js";

export function renderSocialVisual(visualSpec = {}) {
  const type = visualSpec.templateType || inferTemplateType(visualSpec);
  switch (type) {
    case "question_post":
      return renderQuestionPost(visualSpec);
    case "mini_info_post":
      return renderMiniInfoPost(visualSpec);
    case "feature_post":
      return renderFeaturePost(visualSpec);
    case "answer_post":
      return renderAnswerPost(visualSpec);
    case "story_question":
      return renderStoryQuestion(visualSpec);
    case "carousel_slide":
      return renderCarouselSlide(visualSpec);
    default:
      return renderLegacyCard(visualSpec);
  }
}

export function renderStoryVisual(storySpec = {}) {
  const spec = { ...storySpec, templateType: storySpec.templateType || "story_question" };
  return renderSocialVisual({ ...spec, format: "1080x1920" });
}

function inferTemplateType(spec) {
  if (spec.slideRole) return "carousel_slide";
  if (spec.options?.length) return "question_post";
  if (spec.bullets?.length) return "mini_info_post";
  if (spec.featureTitle || spec.hook) return "feature_post";
  if (spec.answerLine) return "answer_post";
  return "legacy";
}

function getFormat(spec) {
  const key = spec.format || "1080x1080";
  return { key, ...FORMATS[key] };
}

function innerWidth(pad, width = 1080) {
  return width - pad * 2;
}

function renderCarouselSlide(spec) {
  const { width, height, pad } = getFormat(spec);
  const uid = makeUid(`c${spec.slideIndex ?? 0}`);
  const contentW = innerWidth(pad, width);
  const ls = layoutSpacing("balanced");
  let y = pad + 8;
  const parts = [];

  if (spec.hook) {
    parts.push(renderHookChip(spec.hook, pad, y, { uid }));
    y += 44 + ls.hookMarginBottom;
  }

  if (spec.eyebrow) {
    parts.push(
      renderMultilineText({
        lines: [spec.eyebrow],
        x: pad,
        y: y + typography.eyebrow.size,
        fontSize: typography.eyebrow.size,
        lineHeight: 16,
        fill: colors.accentBright,
        fontWeight: "700",
        fontFamily: fonts.display,
        letterSpacing: typography.eyebrow.letterSpacing,
      })
    );
    y += 28;
  }

  if (spec.metaLine) {
    parts.push(renderMetaLine(spec.metaLine, pad, y));
    y += 32;
  }

  const role = spec.slideRole || "context";

  if (role === "hook_question" || role === "options") {
    const qFit = fitTextToBox(spec.questionText || "", {
      maxWidthPx: contentW - ls.cardPad * 2,
      maxLines: role === "options" ? 4 : 7,
      fontSizeMax: 32,
      fontSizeMin: fontSizeMin,
    });
    const cardH = qFit.lines.length * qFit.fontSize * 1.28 + ls.cardPad * 2 + 16;
    parts.push(renderGlassCard(pad, y, contentW, cardH, uid));
    parts.push(
      renderDisplayText(qFit.lines, pad + ls.cardPad, y + ls.cardPad, {
        fontSize: qFit.fontSize,
        weight: 700,
      })
    );
    y += cardH + ls.sectionGap;

    if (role === "options" && spec.options?.length) {
      let optSize = fontSizeMax.option;
      let shown = [...spec.options];
      while (shown.length > 0) {
        const trial = layoutOptionsPremium(shown, y, pad, contentW, optSize, uid, height - pad - 120);
        if (trial.fits || optSize <= fontSizeMin) {
          parts.push(trial.svg);
          y = trial.endY;
          break;
        }
        if (shown.length > 3) shown = shown.slice(0, 3);
        else optSize -= 2;
      }
    }
  } else if (role === "answer") {
    parts.push(
      renderMultilineText({
        lines: [spec.title || "Doğru cevap"],
        x: pad,
        y: y + 28,
        fontSize: 26,
        lineHeight: 32,
        fill: colors.text,
        fontWeight: "700",
        fontFamily: fonts.display,
      })
    );
    y += 48;
    const ansFit = fitTextToBox(spec.answerLine || "", {
      maxWidthPx: contentW - 40,
      maxLines: 4,
      fontSizeMax: 30,
      fontSizeMin: 22,
    });
    const cardH = ansFit.lines.length * ansFit.fontSize * 1.3 + 48;
    parts.push(renderGlassCard(pad, y, contentW, cardH, uid));
    parts.push(
      renderMultilineText({
        lines: ansFit.lines,
        x: pad + 24,
        y: y + 36 + ansFit.fontSize,
        fontSize: ansFit.fontSize,
        lineHeight: Math.round(ansFit.fontSize * 1.3),
        fill: colors.accentBright,
        fontWeight: "700",
        fontFamily: fonts.display,
      })
    );
    y += cardH + ls.sectionGap;
  } else {
    if (spec.title) {
      parts.push(
        renderMultilineText({
          lines: [spec.title],
          x: pad,
          y: y + 30,
          fontSize: 28,
          lineHeight: 34,
          fill: colors.text,
          fontWeight: "700",
          fontFamily: fonts.display,
        })
      );
      y += 44;
    }
    if (spec.body) {
      const bodyFit = fitTextToBox(spec.body, {
        maxWidthPx: contentW - 40,
        maxLines: 6,
        fontSizeMax: 22,
        fontSizeMin: fontSizeMin,
      });
      const cardH = bodyFit.lines.length * bodyFit.fontSize * 1.4 + 40;
      parts.push(renderGlassCard(pad, y, contentW, cardH, uid));
      parts.push(
        renderMultilineText({
          lines: bodyFit.lines,
          x: pad + 24,
          y: y + 28 + bodyFit.fontSize,
          fontSize: bodyFit.fontSize,
          lineHeight: Math.round(bodyFit.fontSize * 1.4),
          fill: colors.textSecondary,
          fontWeight: "500",
          fontFamily: fonts.body,
        })
      );
      y += cardH + ls.sectionGap;
    }
    if (spec.bullets?.length) {
      const { svg, endY } = renderBulletCards(spec.bullets, pad, y, contentW, uid);
      parts.push(svg);
      y = endY;
    }
    if (spec.bulletsNote) {
      parts.push(renderMetaLine(spec.bulletsNote, pad, y));
      y += 28;
    }
  }

  parts.push(renderBrandMark(width, pad, pad + 4));
  parts.push(
    renderCtaBar(width, height, pad, uid, {
      primary: spec.footerPrimary || CTAS.save,
      secondary: spec.footerSecondary || "",
    })
  );
  if (spec.slideTotal > 1) {
    parts.push(renderSlideDots(width, height, pad, spec.slideIndex ?? 0, spec.slideTotal));
  }

  return finishVisual(svgDocument({ width, height, uid, body: parts.join("\n") }), width, height, spec.format || "1080x1350", {
    slideIndex: spec.slideIndex,
    slideRole: spec.slideRole,
  });
}

function layoutOptionsPremium(options, startY, pad, contentW, fontSize, uid, maxY) {
  let y = startY;
  const blocks = [];
  for (const opt of options) {
    const letter = opt.letter || "A";
    const text = opt.text || String(opt);
    let wrapped = wrapTextByWidth(text, contentW - 72, fontSize);
    if (wrapped.length > 2) wrapped = splitLongText(wrapped, 2, "…").lines;
    const pill = renderOptionPill(letter, wrapped, pad, y, contentW, fontSize, uid);
    blocks.push(pill.svg);
    y += pill.height;
  }
  return { svg: blocks.join("\n"), endY: y, fits: y <= maxY };
}

function renderQuestionPost(spec) {
  const fmt = getFormat(spec);
  const { width, height, pad } = fmt;
  const uid = makeUid("q");
  const density = measureContentDensity(spec);
  const variant = chooseLayoutVariant(density, fmt.key);
  const ls = layoutSpacing(variant);
  const contentW = innerWidth(pad, width);

  let optionFont = fontSizeMax.option;
  let showOptions = [...(spec.options || [])];
  let optionsNote = null;

  let questionFit = fitTextToBox(spec.questionText || spec.body || "", {
    maxWidthPx: contentW - ls.cardPad * 2,
    maxLines: variant === "compact" ? 6 : 7,
    fontSizeMax: fontSizeMax.question,
    fontSizeMin: 24,
  });

  const maxContentY = height - pad - 100;
  const measure = () => {
    let y = pad + (spec.hook ? 52 : 0) + (spec.metaLine ? 36 : 0) + 24;
    y += questionFit.lines.length * questionFit.fontSize * 1.26 + ls.cardPad * 2 + ls.sectionGap;
    if (questionFit.truncated) y += 28;
    const trial = layoutOptionsPremium(showOptions, y, pad, contentW, optionFont, uid, maxContentY);
    return trial.fits;
  };

  while (!measure() && optionFont > fontSizeMin) optionFont -= 2;
  while (!measure() && questionFit.fontSize > 24) {
    questionFit = fitTextToBox(spec.questionText || "", {
      maxWidthPx: contentW - ls.cardPad * 2,
      maxLines: 6,
      fontSizeMax: questionFit.fontSize - 2,
      fontSizeMin: 24,
    });
  }
  if (!measure() && showOptions.length > 3) {
    showOptions = showOptions.slice(0, 3);
    optionsNote = "Tüm seçenekler caption'da";
  }

  let y = pad + (variant === "centered" ? 24 : 8);
  const parts = [];

  parts.push(renderHookChip(spec.hook || spec.badge || "GÜNÜN TUS SORUSU", pad, y, { uid }));
  y += 48 + ls.hookMarginBottom;

  if (spec.metaLine || spec.subline) {
    parts.push(renderMetaLine(spec.metaLine || spec.subline, pad, y));
    y += 34;
  }

  const qCardH = questionFit.lines.length * questionFit.fontSize * 1.26 + ls.cardPad * 2 + 12;
  parts.push(renderGlassCard(pad, y, contentW, qCardH, uid));
  parts.push(
    renderDisplayText(questionFit.lines, pad + ls.cardPad, y + ls.cardPad - 4, {
      fontSize: questionFit.fontSize,
      weight: 700,
    })
  );
  y += qCardH + ls.sectionGap;

  if (questionFit.truncated) {
    parts.push(
      renderMultilineText({
        lines: ["Devamı caption'da"],
        x: pad,
        y: y + 16,
        fontSize: typography.micro.size,
        lineHeight: 18,
        fill: colors.accentBright,
        fontWeight: "600",
        fontFamily: fonts.body,
      })
    );
    y += 28;
  }

  const optLayout = layoutOptionsPremium(showOptions, y, pad, contentW, optionFont, uid, maxContentY);
  parts.push(optLayout.svg);
  y = optLayout.endY;

  if (optionsNote) {
    parts.push(renderMetaLine(optionsNote, pad, y + 4));
  }

  parts.push(renderBrandMark(width, pad, pad));
  parts.push(
    renderCtaBar(width, height, pad, uid, {
      primary: spec.footerLeft || spec.footerPrimary || CTAS.comment,
      secondary: spec.footerCenter || spec.footerSecondary || CTAS.tomorrow,
    })
  );

  return finishVisual(svgDocument({ width, height, uid, body: parts.join("\n") }), width, height, fmt.key);
}

function renderMiniInfoPost(spec) {
  const fmt = getFormat(spec);
  const { width, height, pad } = fmt;
  const uid = makeUid("m");
  const contentW = innerWidth(pad, width);
  const ls = layoutSpacing("balanced");
  let y = pad + 8;
  const parts = [];

  parts.push(renderHookChip(spec.hook || "1 DAKİKADA ÖĞREN", pad, y, { uid }));
  y += 48 + ls.hookMarginBottom;

  if (spec.subline || spec.headline) {
    parts.push(
      renderMultilineText({
        lines: [spec.subline || spec.headline],
        x: pad,
        y: y + 26,
        fontSize: 24,
        lineHeight: 30,
        fill: colors.text,
        fontWeight: "700",
        fontFamily: fonts.display,
      })
    );
    y += 40;
  }

  const bullets = spec.bullets?.length
    ? spec.bullets
    : spec.body
      ? spec.body.split(/\n+/).filter(Boolean)
      : [];

  if (bullets.length) {
    const { svg, endY } = renderBulletCards(bullets, pad, y, contentW, uid, 20);
    parts.push(svg);
    y = endY;
  } else if (spec.body) {
    const bodyFit = fitTextToBox(spec.body, {
      maxWidthPx: contentW - 40,
      maxLines: 5,
      fontSizeMax: 22,
      fontSizeMin: fontSizeMin,
    });
    const cardH = bodyFit.lines.length * bodyFit.fontSize * 1.4 + 40;
    parts.push(renderGlassCard(pad, y, contentW, cardH, uid));
    parts.push(
      renderMultilineText({
        lines: bodyFit.lines,
        x: pad + 24,
        y: y + 28 + bodyFit.fontSize,
        fontSize: bodyFit.fontSize,
        lineHeight: Math.round(bodyFit.fontSize * 1.4),
        fill: colors.textSecondary,
        fontWeight: "500",
        fontFamily: fonts.body,
      })
    );
  }

  parts.push(renderBrandMark(width, pad, pad));
  parts.push(
    renderCtaBar(width, height, pad, uid, {
      primary: spec.footer || spec.footerPrimary || CTAS.save,
      secondary: "tusoskop.com",
    })
  );

  return finishVisual(svgDocument({ width, height, uid, body: parts.join("\n") }), width, height, fmt.key);
}

function renderFeaturePost(spec) {
  const fmt = getFormat({ format: spec.format || "1080x1350" });
  const { width, height, pad } = fmt;
  const uid = makeUid("f");
  const contentW = innerWidth(pad, width);
  let y = pad + 16;
  const parts = [];

  parts.push(renderHookChip(spec.hook || "TUSOSKOP", pad, y, { uid, maxWidth: 360 }));
  y += 52;

  if (spec.featureTitle) {
    parts.push(renderMetaLine(spec.featureTitle, pad, y));
    y += 36;
  }

  const hookFit = fitTextToBox(spec.hook || spec.headline || "", {
    maxWidthPx: contentW - 40,
    maxLines: 2,
    fontSizeMax: 34,
    fontSizeMin: 26,
  });
  const hookCardH = hookFit.lines.length * hookFit.fontSize * 1.25 + 48;
  parts.push(renderGlassCard(pad, y, contentW, hookCardH, uid));
  parts.push(
    renderDisplayText(hookFit.lines, pad + 24, y + 20, { fontSize: hookFit.fontSize, weight: 700 })
  );
  y += hookCardH + 20;

  const bodyFit = fitTextToBox(spec.body || "", {
    maxWidthPx: contentW - 40,
    maxLines: 5,
    fontSizeMax: 21,
    fontSizeMin: fontSizeMin,
  });
  if (bodyFit.lines.length) {
    const bodyCardH = bodyFit.lines.length * bodyFit.fontSize * 1.4 + 40;
    parts.push(renderGlassCard(pad, y, contentW, bodyCardH, uid, { elevated: false }));
    parts.push(
      renderMultilineText({
        lines: bodyFit.lines,
        x: pad + 24,
        y: y + 28 + bodyFit.fontSize,
        fontSize: bodyFit.fontSize,
        lineHeight: Math.round(bodyFit.fontSize * 1.4),
        fill: colors.textSecondary,
        fontWeight: "500",
        fontFamily: fonts.body,
      })
    );
  }

  parts.push(renderBrandMark(width, pad, pad));
  parts.push(
    renderCtaBar(width, height, pad, uid, {
      primary: spec.footer || spec.cta || CTAS.app,
      secondary: "tusoskop.com",
    })
  );

  return finishVisual(svgDocument({ width, height, uid, body: parts.join("\n") }), width, height, fmt.key);
}

function renderAnswerPost(spec) {
  const fmt = getFormat(spec);
  const { width, height, pad } = fmt;
  const uid = makeUid("a");
  const contentW = innerWidth(pad, width);
  let y = pad + 8;
  const parts = [];

  parts.push(renderHookChip(spec.hook || "CEVAP AÇIKLANDI", pad, y, { uid }));
  y += 50;
  if (spec.subline) {
    parts.push(renderMetaLine(spec.subline, pad, y));
    y += 34;
  }

  const ansFit = fitTextToBox(spec.answerLine || "", {
    maxWidthPx: contentW - 40,
    maxLines: 3,
    fontSizeMax: 28,
    fontSizeMin: 22,
  });
  const ansCardH = ansFit.lines.length * ansFit.fontSize * 1.3 + 44;
  parts.push(renderGlassCard(pad, y, contentW, ansCardH, uid));
  parts.push(
    renderMultilineText({
      lines: ansFit.lines,
      x: pad + 24,
      y: y + 32 + ansFit.fontSize,
      fontSize: ansFit.fontSize,
      lineHeight: Math.round(ansFit.fontSize * 1.3),
      fill: colors.accentBright,
      fontWeight: "700",
      fontFamily: fonts.display,
    })
  );
  y += ansCardH + 18;

  const expFit = fitTextToBox(spec.explanation || "", {
    maxWidthPx: contentW - 40,
    maxLines: 5,
    fontSizeMax: 20,
    fontSizeMin: fontSizeMin,
  });
  if (expFit.lines.length) {
    const expCardH = expFit.lines.length * expFit.fontSize * 1.4 + 40;
    parts.push(renderGlassCard(pad, y, contentW, expCardH, uid, { elevated: false }));
    parts.push(
      renderMultilineText({
        lines: expFit.lines,
        x: pad + 24,
        y: y + 28 + expFit.fontSize,
        fontSize: expFit.fontSize,
        lineHeight: Math.round(expFit.fontSize * 1.4),
        fill: colors.textSecondary,
        fontWeight: "500",
        fontFamily: fonts.body,
      })
    );
  }

  parts.push(renderBrandMark(width, pad, pad));
  parts.push(
    renderCtaBar(width, height, pad, uid, {
      primary: CTAS.save,
      secondary: CTAS.app,
    })
  );

  return finishVisual(svgDocument({ width, height, uid, body: parts.join("\n") }), width, height, fmt.key);
}

function renderStoryQuestion(spec) {
  const fmt = getFormat({ format: "1080x1920" });
  const { width, height, pad } = fmt;
  const uid = makeUid("st");
  const contentW = innerWidth(pad, width);
  const ls = layoutSpacing("story");
  const parts = [];

  parts.push(renderHookChip(spec.hook || spec.badge || "QUIZ", pad, pad + 40, { uid, maxWidth: 320 }));

  if (spec.metaLine) {
    parts.push(renderMetaLine(spec.metaLine, pad, pad + 100));
  }

  const qFit = fitTextToBox(spec.questionText || spec.body || "", {
    maxWidthPx: contentW - 48,
    maxLines: 8,
    fontSizeMax: typography.storyHero.size,
    fontSizeMin: 32,
  });

  const cardY = pad + 140;
  const cardH = qFit.lines.length * qFit.fontSize * 1.22 + ls.cardPad * 2 + 24;
  parts.push(renderGlassCard(pad, cardY, contentW, cardH, uid));

  const textY =
    spec.storyVariant === "poll" ? cardY + cardH / 2 - (qFit.lines.length * qFit.fontSize * 1.22) / 2 : cardY + ls.cardPad;
  parts.push(
    renderDisplayText(qFit.lines, pad + ls.cardPad, textY, {
      fontSize: qFit.fontSize,
      weight: 700,
      centered: spec.storyVariant === "poll",
      width: spec.storyVariant === "poll" ? width : undefined,
    })
  );

  if (spec.options?.length && spec.storyVariant === "quiz") {
    let oy = cardY + cardH + 24;
    for (const opt of spec.options.slice(0, 3)) {
      const wrapped = wrapTextByWidth(opt.text || opt, contentW - 80, 20);
      const pill = renderOptionPill(opt.letter || "?", wrapped, pad, oy, contentW, 20, uid);
      parts.push(pill.svg);
      oy += pill.height;
    }
  }

  parts.push(renderBrandMark(width, pad, pad + 36, { size: 36 }));

  parts.push(
    renderCtaBar(width, height, pad, uid, {
      primary: spec.footer || spec.footerPrimary || CTAS.swipe,
      secondary: spec.footerSecondary || "",
      variant: "story",
    })
  );

  return finishVisual(svgDocument({ width, height, uid, body: parts.join("\n") }), width, height, "1080x1920");
}

function renderLegacyCard(visualSpec) {
  return renderMiniInfoPost({
    ...visualSpec,
    templateType: "mini_info_post",
    hook: visualSpec.headline,
    body: visualSpec.body,
    subline: visualSpec.subline,
  });
}

export async function svgToPngDataUrl(svg, width, height) {
  if (typeof document === "undefined") return null;
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = SOCIAL_CONFIG.colors.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG PNG dönüşümü başarısız"));
    };
    img.src = url;
  });
}

export function renderQuestionPostSample() {
  return renderQuestionPost({
    templateType: "question_post",
    hook: "TUS'ta çok karışan nokta",
    badge: "GÜNÜN TUS SORUSU",
    metaLine: "Dahiliye · Hepatoloji",
    questionText:
      "Kronik hepatit B izlenen hastada HBeAg pozitif ve HBV DNA çok yüksek seviyede saptanıyor. Aşağıdaki ifadelerden hangisi yanlıştır?",
    options: [
      { letter: "A", text: "Nükleoz(t)id analog tedavisi önerilir." },
      { letter: "B", text: "Entekavir ilk basamak tedavide kullanılabilir." },
      { letter: "C", text: "Pegile interferon alfa tedavisi kesin kontrendikedir." },
      { letter: "D", text: "Karaciğer biyopsisi tedavi kararı için şarttır." },
      { letter: "E", text: "Tedavi yanıtı ALT ve HBV DNA ile izlenir." },
    ],
  });
}
