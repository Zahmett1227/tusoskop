import { SOCIAL_CONFIG } from "./socialConfig.js";
import {
  fitTextToBox,
  renderMultilineText,
  wrapTextByWidth,
  splitLongText,
  escapeXml,
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
  resolveThemeContext,
} from "./design/svgCompositor.js";
import { cardShadowFilter } from "./design/shadows.js";

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
    case "story_answer":
      return renderStoryAnswer(visualSpec);
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
  if (spec.format === "1080x1920" && (spec.answerPayload || spec.correctText)) return "story_answer";
  if (spec.format === "1080x1920") return "story_question";
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
  const { theme, palette } = resolveThemeContext(spec);
  const contentW = innerWidth(pad, width);
  const ls = layoutSpacing("balanced");
  let y = pad + 8;
  const parts = [];

  if (spec.hook) {
    parts.push(renderHookChip(spec.hook, pad, y, { uid, palette }));
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
        fill: palette.accentBright,
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
    parts.push(renderGlassCard(pad, y, contentW, cardH, uid, { palette }));
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
        const trial = layoutOptionsPremium(shown, y, pad, contentW, optSize, uid, height - pad - 120, palette);
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
    parts.push(renderGlassCard(pad, y, contentW, cardH, uid, { palette }));
    parts.push(
      renderMultilineText({
        lines: ansFit.lines,
        x: pad + 24,
        y: y + 36 + ansFit.fontSize,
        fontSize: ansFit.fontSize,
        lineHeight: Math.round(ansFit.fontSize * 1.3),
        fill: palette.accentBright,
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
      parts.push(renderGlassCard(pad, y, contentW, cardH, uid, { palette }));
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
      const { svg, endY } = renderBulletCards(spec.bullets, pad, y, contentW, uid, 19, palette);
      parts.push(svg);
      y = endY;
    }
    if (spec.bulletsNote) {
      parts.push(renderMetaLine(spec.bulletsNote, pad, y));
      y += 28;
    }
  }

  parts.push(renderBrandMark(width, pad, pad + 4, { palette, theme }));
  parts.push(
    renderCtaBar(width, height, pad, uid, {
      primary: spec.footerPrimary || CTAS.save,
      secondary: spec.footerSecondary || "",
      palette,
    })
  );
  if (spec.slideTotal > 1) {
    parts.push(renderSlideDots(width, height, pad, spec.slideIndex ?? 0, spec.slideTotal, palette));
  }

  return themedFinish(spec, width, height, spec.format || "1080x1350", uid, parts.join("\n"), theme, {
    slideIndex: spec.slideIndex,
    slideRole: spec.slideRole,
  });
}

function layoutOptionsPremium(options, startY, pad, contentW, fontSize, uid, maxY, palette) {
  let y = startY;
  const blocks = [];
  for (const opt of options) {
    const letter = opt.letter || "A";
    const text = opt.text || String(opt);
    let wrapped = wrapTextByWidth(text, contentW - 72, fontSize);
    if (wrapped.length > 2) wrapped = splitLongText(wrapped, 2, "…").lines;
    const pill = renderOptionPill(letter, wrapped, pad, y, contentW, fontSize, uid, palette);
    blocks.push(pill.svg);
    y += pill.height;
  }
  return { svg: blocks.join("\n"), endY: y, fits: y <= maxY };
}

function themedFinish(spec, width, height, format, uid, body, theme, extra = {}) {
  return finishVisual(
    svgDocument({ width, height, uid, body, theme }),
    width,
    height,
    format,
    { themeId: theme.id, ...extra }
  );
}

function renderQuestionPost(spec) {
  const fmt = getFormat(spec);
  const { width, height, pad } = fmt;
  const uid = makeUid("q");
  const { theme, palette } = resolveThemeContext(spec);
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
    const trial = layoutOptionsPremium(showOptions, y, pad, contentW, optionFont, uid, maxContentY, palette);
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

  parts.push(renderHookChip(spec.hook || spec.badge || "GÜNÜN TUS SORUSU", pad, y, { uid, palette }));
  y += 48 + ls.hookMarginBottom;

  if (spec.metaLine || spec.subline) {
    parts.push(renderMetaLine(spec.metaLine || spec.subline, pad, y));
    y += 34;
  }

  const qCardH = questionFit.lines.length * questionFit.fontSize * 1.26 + ls.cardPad * 2 + 12;
  parts.push(renderGlassCard(pad, y, contentW, qCardH, uid, { palette }));
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
        fill: palette.accentBright,
        fontWeight: "600",
        fontFamily: fonts.body,
      })
    );
    y += 28;
  }

  const optLayout = layoutOptionsPremium(showOptions, y, pad, contentW, optionFont, uid, maxContentY, palette);
  parts.push(optLayout.svg);
  y = optLayout.endY;

  if (optionsNote) {
    parts.push(renderMetaLine(optionsNote, pad, y + 4));
  }

  parts.push(renderBrandMark(width, pad, pad, { palette, theme }));
  parts.push(
    renderCtaBar(width, height, pad, uid, {
      primary: spec.footerLeft || spec.footerPrimary || CTAS.comment,
      secondary: spec.footerCenter || spec.footerSecondary || CTAS.tomorrow,
      palette,
    })
  );

  return themedFinish(spec, width, height, fmt.key, uid, parts.join("\n"), theme);
}

function renderMiniInfoPost(spec) {
  const fmt = getFormat(spec);
  const { width, height, pad } = fmt;
  const uid = makeUid("m");
  const { theme, palette } = resolveThemeContext(spec);
  const contentW = innerWidth(pad, width);
  const ls = layoutSpacing("balanced");
  let y = pad + 8;
  const parts = [];

  parts.push(renderHookChip(spec.hook || "1 DAKİKADA ÖĞREN", pad, y, { uid, palette }));
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
    const { svg, endY } = renderBulletCards(bullets, pad, y, contentW, uid, 20, palette);
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
    parts.push(renderGlassCard(pad, y, contentW, cardH, uid, { palette }));
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

  parts.push(renderBrandMark(width, pad, pad, { palette, theme }));
  parts.push(
    renderCtaBar(width, height, pad, uid, {
      primary: spec.footer || spec.footerPrimary || CTAS.save,
      secondary: "tusoskop.com",
      palette,
    })
  );

  return themedFinish(spec, width, height, fmt.key, uid, parts.join("\n"), theme);
}

function renderFeaturePost(spec) {
  const fmt = getFormat({ format: spec.format || "1080x1350" });
  const { width, height, pad } = fmt;
  const uid = makeUid("f");
  const { theme, palette } = resolveThemeContext(spec);
  const contentW = innerWidth(pad, width);
  let y = pad + 16;
  const parts = [];

  parts.push(renderHookChip(spec.hook || "TUSOSKOP", pad, y, { uid, maxWidth: 360, palette }));
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
  parts.push(renderGlassCard(pad, y, contentW, hookCardH, uid, { palette }));
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
    parts.push(renderGlassCard(pad, y, contentW, bodyCardH, uid, { elevated: false, palette }));
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

  parts.push(renderBrandMark(width, pad, pad, { palette, theme }));
  parts.push(
    renderCtaBar(width, height, pad, uid, {
      primary: spec.footer || spec.cta || CTAS.app,
      secondary: "tusoskop.com",
      palette,
    })
  );

  return themedFinish(spec, width, height, fmt.key, uid, parts.join("\n"), theme);
}

function renderAnswerPost(spec) {
  const fmt = getFormat(spec);
  const { width, height, pad } = fmt;
  const uid = makeUid("a");
  const { theme, palette } = resolveThemeContext(spec);
  const contentW = innerWidth(pad, width);
  let y = pad + 8;
  const parts = [];

  parts.push(renderHookChip(spec.hook || "CEVAP AÇIKLANDI", pad, y, { uid, palette }));
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
  parts.push(renderGlassCard(pad, y, contentW, ansCardH, uid, { palette }));
  parts.push(
    renderMultilineText({
      lines: ansFit.lines,
      x: pad + 24,
      y: y + 32 + ansFit.fontSize,
      fontSize: ansFit.fontSize,
      lineHeight: Math.round(ansFit.fontSize * 1.3),
      fill: palette.accentBright,
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
    parts.push(renderGlassCard(pad, y, contentW, expCardH, uid, { elevated: false, palette }));
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

  parts.push(renderBrandMark(width, pad, pad, { palette, theme }));
  parts.push(
    renderCtaBar(width, height, pad, uid, {
      primary: CTAS.save,
      secondary: CTAS.app,
      palette,
    })
  );

  return themedFinish(spec, width, height, fmt.key, uid, parts.join("\n"), theme);
}

function renderStoryQuestion(spec) {
  const fmt = getFormat({ format: "1080x1920" });
  const { width, height } = fmt;
  const uid = makeUid("st");
  const { theme, palette } = resolveThemeContext(spec);
  const safe = getStorySafeLayout();
  const options = normalizeOptions(spec.options || []);
  const parts = [renderStoryBackdrop(width, height, uid, theme, palette)];

  parts.push(renderStorySubjectBadge(theme.label || spec.ders || spec.badge, width / 2, 840, uid, palette));
  parts.push(renderStoryKicker("SORU", width / 2, 930));

  const qFit = fitTextToBox(spec.questionText || spec.body || "", {
    maxWidthPx: 1010,
    maxLines: options.length >= 5 ? 4 : 5,
    fontSizeMax: 46,
    fontSizeMin: 30,
  });
  parts.push(
    renderMultilineText({
      lines: qFit.lines,
      x: width / 2,
      y: 1010,
      fontSize: qFit.fontSize,
      lineHeight: Math.round(qFit.fontSize * 1.28),
      fill: colors.text,
      fontWeight: "800",
      fontFamily: fonts.display,
      textAnchor: "middle",
    })
  );

  if (options.length && spec.storyVariant !== "poll") {
    const optLayout = layoutStoryOptions({
      options,
      x: safe.x,
      y: Math.max(1220, 1030 + qFit.lines.length * qFit.fontSize * 1.28),
      w: safe.contentW,
      maxY: safe.optionsBottom,
      uid,
      palette,
    });
    parts.push(optLayout.svg);
  } else if (spec.storyVariant === "poll") {
    const pollFit = fitTextToBox(spec.footer || spec.footerPrimary || CTAS.comment, {
      maxWidthPx: safe.contentW - 40,
      maxLines: 2,
      fontSizeMax: 26,
      fontSizeMin: 20,
    });
    parts.push(renderStoryGlassBox(safe.x, 1250, safe.contentW, 108, uid, palette));
    parts.push(
      renderMultilineText({
        lines: pollFit.lines,
        x: width / 2 - 12,
        y: 1310,
        fontSize: pollFit.fontSize,
        lineHeight: Math.round(pollFit.fontSize * 1.3),
        fill: palette.accentBright,
        fontWeight: "800",
        fontFamily: fonts.display,
        textAnchor: "middle",
      })
    );
  }

  return themedFinish(spec, width, height, "1080x1920", uid, parts.join("\n"), theme);
}

function renderStoryAnswer(spec) {
  const fmt = getFormat({ format: "1080x1920" });
  const { width, height } = fmt;
  const uid = makeUid("sa");
  const { theme, palette } = resolveThemeContext(spec);
  const safe = getStorySafeLayout();
  const options = normalizeOptions(spec.options || []);
  const correctIndex = Number.isFinite(spec.correctIndex) ? spec.correctIndex : 0;
  const correctLetter = optionLabelFromIndex(correctIndex);
  const answerText = spec.correctText || spec.answerPayload?.correctText || options[correctIndex]?.text || "";
  const explanation = spec.explanation || spec.answerPayload?.explanation || "";
  const parts = [renderStoryBackdrop(width, height, uid, theme, palette, { dim: 0.72 })];

  parts.push(renderStoryKicker("DOĞRU CEVAP", width / 2, 840));

  if (options.length) {
    const optLayout = layoutStoryOptions({
      options,
      x: safe.x,
      y: 940,
      w: safe.contentW,
      maxY: 1480,
      uid,
      palette,
      correctIndex,
      answerMode: true,
    });
    parts.push(optLayout.svg);
  } else if (answerText) {
    parts.push(
      renderCorrectAnswerRow({
        letter: correctLetter,
        lines: wrapTextByWidth(answerText, safe.contentW - 92, 25).slice(0, 2),
        x: safe.x,
        y: 980,
        w: safe.contentW,
        h: 96,
        uid,
      })
    );
  }

  const expFit = fitTextToBox(explanation, {
    maxWidthPx: safe.contentW - 72,
    maxLines: 5,
    fontSizeMax: 26,
    fontSizeMin: 19,
  });
  if (expFit.lines.length) {
    const expY = 1510;
    const expH = Math.max(150, expFit.lines.length * expFit.fontSize * 1.34 + 64);
    parts.push(renderStoryGlassBox(safe.x, expY, safe.contentW, expH, uid, palette, { border: "#34d399" }));
    parts.push(`<rect x="${safe.x + 26}" y="${expY + 24}" width="4" height="${expH - 48}" rx="2" fill="#5eead4"/>`);
    parts.push(
      renderMultilineText({
        lines: expFit.lines,
        x: safe.x + 52,
        y: expY + 44 + expFit.fontSize,
        fontSize: expFit.fontSize,
        lineHeight: Math.round(expFit.fontSize * 1.34),
        fill: colors.text,
        fontWeight: "700",
        fontFamily: fonts.body,
      })
    );
  }

  return themedFinish(spec, width, height, "1080x1920", uid, parts.join("\n"), theme);
}

function getStorySafeLayout() {
  return { x: 42, contentW: 870, optionsBottom: 1880 };
}

function normalizeOptions(options) {
  return options.map((opt, index) => ({
    letter: opt?.letter || optionLabelFromIndex(index),
    text: String(opt?.text || opt || "").trim(),
  }));
}

function optionLabelFromIndex(index) {
  return String.fromCharCode(65 + Math.max(0, index));
}

function renderStoryBackdrop(width, height, uid, theme, palette, { dim = 0.62 } = {}) {
  const image = theme.storyBackgroundImage || "/social/story-backgrounds/dahiliye.svg";
  return `
<defs>
  <filter id="storyBlur-${uid}"><feGaussianBlur stdDeviation="0.5"/></filter>
  <radialGradient id="storyFocus-${uid}" cx="50%" cy="35%" r="60%">
    <stop offset="0%" stop-color="${palette.accentBright}" stop-opacity="0.14"/>
    <stop offset="50%" stop-color="${palette.accent}" stop-opacity="0.05"/>
    <stop offset="100%" stop-color="#010209" stop-opacity="0.60"/>
  </radialGradient>
  <linearGradient id="storyShade-${uid}" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0%" stop-color="#010209" stop-opacity="0.72"/>
    <stop offset="12%" stop-color="#010209" stop-opacity="0.08"/>
    <stop offset="42%" stop-color="#010209" stop-opacity="0.05"/>
    <stop offset="60%" stop-color="#010209" stop-opacity="${dim * 0.55}"/>
    <stop offset="80%" stop-color="#010209" stop-opacity="${dim * 0.88}"/>
    <stop offset="100%" stop-color="#010209" stop-opacity="${Math.min(dim + 0.28, 0.96)}"/>
  </linearGradient>
</defs>
<rect width="${width}" height="${height}" fill="#010209"/>
<image href="${escapeXml(image)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" opacity="0.88" filter="url(#storyBlur-${uid})"/>
<rect width="${width}" height="${height}" fill="url(#storyFocus-${uid})"/>
<rect width="${width}" height="${height}" fill="url(#storyShade-${uid})"/>`;
}

function renderStorySubjectBadge(label, cx, y, uid, palette) {
  const text = storyUpper(label || "TUSOSKOP");
  const w = Math.min(360, Math.max(156, text.length * 16 + 44));
  return `
<g filter="${cardShadowFilter(uid)}">
  <rect x="${cx - w / 2}" y="${y}" width="${w}" height="42" rx="21" fill="#050712" fill-opacity="0.78" stroke="${palette.borderGlow}" stroke-width="1"/>
  <rect x="${cx - w / 2 + 3}" y="${y + 3}" width="${w - 6}" height="36" rx="18" fill="${palette.accentMuted}" opacity="0.55"/>
  <text x="${cx}" y="${y + 28}" text-anchor="middle" fill="${palette.accentBright}" font-family="${fonts.display}" font-size="18" font-weight="900" letter-spacing="0.08em">${escapeXml(text)}</text>
</g>`;
}

function storyUpper(text) {
  return String(text || "").toLocaleUpperCase("tr-TR");
}

function renderStoryKicker(text, cx, y) {
  return `<text x="${cx}" y="${y}" text-anchor="middle" fill="${colors.text}" font-family="${fonts.display}" font-size="32" font-weight="900" letter-spacing="0.16em">${escapeXml(text)}</text>`;
}

function layoutStoryOptions({ options, x, y, w, maxY, uid, palette, correctIndex = -1, answerMode = false }) {
  let fontSize = answerMode ? 23 : 25;
  let gap = answerMode ? 15 : 18;
  let measured = [];
  const measure = () => {
    measured = options.map((opt) => {
      let lines = wrapTextByWidth(opt.text, w - 98, fontSize);
      if (lines.length > 2) lines = splitLongText(lines, 2).lines;
      const h = Math.max(answerMode ? 74 : 82, lines.length * Math.round(fontSize * 1.28) + 28);
      return { opt, lines, h };
    });
    return y + measured.reduce((sum, row) => sum + row.h + gap, 0) - gap <= maxY;
  };
  while (!measure() && fontSize > 18) {
    fontSize -= 2;
    gap = Math.max(8, gap - 2);
  }

  let cursor = y;
  const rows = measured.map((row, index) => {
    const active = index === correctIndex;
    const svg = active
      ? renderCorrectAnswerRow({ letter: row.opt.letter, lines: row.lines, x, y: cursor, w, h: row.h, uid })
      : renderStoryOptionRow({
          letter: row.opt.letter,
          lines: row.lines,
          x,
          y: cursor,
          w,
          h: row.h,
          uid,
          palette,
          dimmed: answerMode,
          fontSize,
        });
    cursor += row.h + gap;
    return svg;
  });
  return { svg: rows.join("\n"), endY: cursor - gap };
}

function renderStoryOptionRow({ letter, lines, x, y, w, h, uid, palette, dimmed = false, fontSize = 24 }) {
  const opacity = dimmed ? 0.28 : 1;
  const textOpacity = dimmed ? 0.42 : 1;
  const lineHeight = Math.round(fontSize * 1.28);
  return `
<g filter="${cardShadowFilter(uid)}" opacity="${opacity}">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#050712" fill-opacity="0.62" stroke="${colors.glassBorder}" stroke-width="1"/>
  <rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="11" fill="url(#glassGrad-${uid})" opacity="0.18"/>
  <rect x="${x + 28}" y="${y + h / 2 - 23}" width="50" height="46" rx="12" fill="${palette.accent}" fill-opacity="0.75" stroke="${palette.borderGlow}" stroke-width="1"/>
  <text x="${x + 53}" y="${y + h / 2 + 8}" text-anchor="middle" fill="${colors.text}" font-family="${fonts.display}" font-size="20" font-weight="900">${escapeXml(letter)}</text>
  ${renderMultilineText({
    lines,
    x: x + 98,
    y: y + Math.max(24, (h - lines.length * lineHeight) / 2 + fontSize),
    fontSize,
    lineHeight,
    fill: colors.text,
    fontWeight: "800",
    fontFamily: fonts.body,
  }).replace(/<text /, `<text opacity="${textOpacity}" `)}
</g>`;
}

function renderCorrectAnswerRow({ letter, lines, x, y, w, h, uid }) {
  return `
<g filter="${cardShadowFilter(uid)}">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#0f7a43" fill-opacity="0.82" stroke="#5eead4" stroke-width="2"/>
  <rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="13" fill="#22c55e" opacity="0.18"/>
  <rect x="${x + 28}" y="${y + h / 2 - 23}" width="50" height="46" rx="12" fill="#22c55e" stroke="#86efac" stroke-width="1"/>
  <text x="${x + 53}" y="${y + h / 2 + 8}" text-anchor="middle" fill="#ffffff" font-family="${fonts.display}" font-size="23" font-weight="900">✓</text>
  <text x="${x + 93}" y="${y + h / 2 + 8}" fill="#d1fae5" font-family="${fonts.display}" font-size="18" font-weight="900">${escapeXml(letter)}</text>
  ${renderMultilineText({
    lines,
    x: x + 126,
    y: y + Math.max(25, (h - lines.length * 31) / 2 + 23),
    fontSize: 24,
    lineHeight: 31,
    fill: colors.text,
    fontWeight: "900",
    fontFamily: fonts.body,
  })}
</g>`;
}

function renderStoryGlassBox(x, y, w, h, uid, palette, { border = null } = {}) {
  return `
<g filter="${cardShadowFilter(uid)}">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#050712" fill-opacity="0.72" stroke="${border || palette.borderGlow}" stroke-width="1.5"/>
  <rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="15" fill="url(#glassGrad-${uid})" opacity="0.22"/>
</g>`;
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
    ders: "Dahiliye",
    konu: "Hepatoloji",
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
