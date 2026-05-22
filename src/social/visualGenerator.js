import { SOCIAL_CONFIG } from "./socialConfig.js";
import {
  escapeXml,
  fitTextToBox,
  renderMultilineText,
  wrapTextByWidth,
  splitLongText,
} from "./textLayout.js";

const FORMATS = {
  "1080x1080": { width: 1080, height: 1080 },
  "1080x1350": { width: 1080, height: 1350 },
  "1080x1920": { width: 1080, height: 1920 },
};

const PAD = 56;
const INNER_W = 1080 - PAD * 2;

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
    default:
      return renderLegacyCard(visualSpec);
  }
}

export function renderStoryVisual(storySpec = {}) {
  const spec = { ...storySpec, templateType: storySpec.templateType || "story_question" };
  if (spec.templateType === "story_question") return renderStoryQuestion(spec);
  return renderSocialVisual({ ...spec, format: "1080x1920" });
}

function inferTemplateType(spec) {
  if (spec.options?.length) return "question_post";
  if (spec.bullets?.length) return "mini_info_post";
  if (spec.featureTitle || spec.hook) return "feature_post";
  if (spec.answerLine) return "answer_post";
  return "legacy";
}

function brandColors() {
  return {
    ...SOCIAL_CONFIG.colors,
    bg2: "#0b1220",
    optionBg: "#1e293b",
    optionBorder: "#334155",
  };
}

function finishSvg(svg, width, height, format) {
  return {
    svg,
    svgUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    width,
    height,
    format,
  };
}

function svgShell(width, height, inner) {
  const c = brandColors();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${c.bg}"/>
      <stop offset="100%" stop-color="${c.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="${PAD - 8}" y="${PAD - 8}" width="${width - (PAD - 8) * 2}" height="${height - (PAD - 8) * 2}" rx="28" fill="${c.card}" stroke="${c.border}" stroke-width="2"/>
  <rect x="${PAD - 8}" y="${PAD - 8}" width="${width - (PAD - 8) * 2}" height="6" rx="3" fill="${c.accent}"/>
  ${inner}
</svg>`;
}

function brandLogo(width, c) {
  return `
  <circle cx="${width - PAD - 28}" cy="${PAD + 36}" r="28" fill="${c.accent}" opacity="0.18"/>
  <text x="${width - PAD - 28}" y="${PAD + 44}" text-anchor="middle" fill="${c.accentSoft}" font-family="Segoe UI, system-ui, sans-serif" font-size="22" font-weight="800">T</text>`;
}

function footerBar(width, height, c, { left, center }) {
  const y = height - PAD + 4;
  return `
  ${renderMultilineText({ lines: [left], x: PAD, y, fontSize: 22, lineHeight: 28, fill: c.accent, fontWeight: "700" })}
  ${center ? renderMultilineText({ lines: [center], x: width / 2, y, fontSize: 20, lineHeight: 26, fill: c.muted, fontWeight: "500", textAnchor: "middle" }) : ""}
  <circle cx="${width - PAD - 16}" cy="${y - 8}" r="18" fill="${c.accent}" opacity="0.25"/>
  <text x="${width - PAD - 16}" y="${y - 2}" text-anchor="middle" fill="${c.accentSoft}" font-family="Segoe UI, system-ui, sans-serif" font-size="16" font-weight="800">T</text>`;
}

function layoutOptionsAbsolute(options, startY, contentW, fontSize, maxLinesPerOption) {
  const c = brandColors();
  const layouts = [];
  let y = startY;

  for (const opt of options) {
    const letter = opt.letter || "A";
    const text = opt.text || String(opt);
    let wrapped = wrapTextByWidth(text, contentW - 88, fontSize);
    if (wrapped.length > maxLinesPerOption) {
      wrapped = splitLongText(wrapped, maxLinesPerOption, "…").lines;
    }
    const lineH = Math.round(fontSize * 1.32);
    const cardH = Math.max(52, wrapped.length * lineH + 24);

    layouts.push({
      height: cardH + 10,
      svg: [
        `<rect x="${PAD}" y="${y}" width="${contentW}" height="${cardH}" rx="14" fill="${c.optionBg}" stroke="${c.optionBorder}" stroke-width="1.5"/>`,
        `<circle cx="${PAD + 28}" cy="${y + cardH / 2}" r="18" fill="${c.accent}" opacity="0.22"/>`,
        `<text x="${PAD + 28}" y="${y + cardH / 2 + 7}" text-anchor="middle" fill="${c.accentSoft}" font-family="Segoe UI, system-ui, sans-serif" font-size="${Math.round(fontSize * 0.85)}" font-weight="800">${escapeXml(letter)}</text>`,
        renderMultilineText({
          lines: wrapped,
          x: PAD + 56,
          y: y + 18 + fontSize,
          fontSize,
          lineHeight: lineH,
          fill: c.text,
          fontWeight: "500",
        }),
      ].join("\n"),
    });
    y += cardH + 10;
  }

  return { layouts, endY: y };
}

function measureQuestionPost(height, showOptions, optionFont, questionFit, optionsNote) {
  const headerEnd = PAD + 108;
  const qH = questionFit.lines.length * questionFit.fontSize * 1.38;
  const truncH = questionFit.truncated ? 32 : 0;
  let y = headerEnd + qH + 18 + truncH;
  const { layouts } = layoutOptionsAbsolute(showOptions, y, INNER_W, optionFont, 2);
  const optsH = layouts.reduce((s, l) => s + l.height, 0);
  const noteH = optionsNote ? 36 : 0;
  return headerEnd + qH + 18 + truncH + optsH + noteH + 88 <= height;
}

function renderQuestionPost(spec) {
  const format = spec.format || "1080x1080";
  const { width, height } = FORMATS[format] || FORMATS["1080x1080"];
  const c = brandColors();

  let optionFont = 28;
  let showOptions = [...(spec.options || [])];
  let optionsNote = null;

  let questionFit = fitTextToBox(spec.questionText || spec.body || "", {
    maxWidthPx: INNER_W,
    maxLines: 7,
    fontSizeMax: 40,
    fontSizeMin: 28,
  });

  const fitLoop = () =>
    measureQuestionPost(height, showOptions, optionFont, questionFit, optionsNote);

  while (!fitLoop() && optionFont > 22) optionFont -= 2;
  while (!fitLoop() && questionFit.fontSize > 28) {
    questionFit = fitTextToBox(spec.questionText || "", {
      maxWidthPx: INNER_W,
      maxLines: 7,
      fontSizeMax: questionFit.fontSize - 2,
      fontSizeMin: 28,
    });
  }
  if (!fitLoop() && showOptions.length > 3) {
    showOptions = (spec.options || []).slice(0, 3);
    optionsNote = "Tüm seçenekler caption'da";
  }
  if (!fitLoop() && showOptions.length > 2) {
    showOptions = (spec.options || []).slice(0, 2);
    optionsNote = "Tüm seçenekler caption'da";
  }

  const parts = [];
  parts.push(
    renderMultilineText({
      lines: [spec.badge || "GÜNÜN TUS SORUSU"],
      x: PAD,
      y: PAD + 32,
      fontSize: 22,
      lineHeight: 28,
      fill: c.accent,
      fontWeight: "800",
    })
  );
  if (spec.metaLine || spec.subline) {
    parts.push(
      renderMultilineText({
        lines: [spec.metaLine || spec.subline],
        x: PAD,
        y: PAD + 70,
        fontSize: 24,
        lineHeight: 30,
        fill: c.muted,
        fontWeight: "600",
      })
    );
  }

  let y = PAD + 108;
  parts.push(
    renderMultilineText({
      lines: questionFit.lines,
      x: PAD,
      y: y + questionFit.fontSize,
      fontSize: questionFit.fontSize,
      lineHeight: Math.round(questionFit.fontSize * 1.38),
      fill: c.text,
      fontWeight: "600",
    })
  );
  y += questionFit.lines.length * questionFit.fontSize * 1.38 + 18;

  if (questionFit.truncated) {
    parts.push(
      renderMultilineText({
        lines: ["Soru metninin devamı caption'da"],
        x: PAD,
        y: y + 20,
        fontSize: 20,
        lineHeight: 26,
        fill: c.accentSoft,
        fontWeight: "600",
      })
    );
    y += 32;
  }

  const { layouts } = layoutOptionsAbsolute(showOptions, y, INNER_W, optionFont, 2);
  for (const block of layouts) parts.push(block.svg);

  if (optionsNote) {
    const noteY = y + layouts.reduce((s, l) => s + l.height, 0) + 8;
    parts.push(
      renderMultilineText({
        lines: [optionsNote],
        x: PAD,
        y: noteY + 20,
        fontSize: 22,
        lineHeight: 28,
        fill: c.muted,
        fontWeight: "600",
      })
    );
  }

  parts.push(brandLogo(width, c));
  parts.push(
    footerBar(width, height, c, {
      left: spec.footerLeft || "Cevabını yorumlara yaz",
      center: spec.footerCenter || "Tusoskop ile daha fazla soru çöz.",
    })
  );

  return finishSvg(svgShell(width, height, parts.join("\n")), width, height, format);
}

function renderMiniInfoPost(spec) {
  const format = spec.format || "1080x1080";
  const { width, height } = FORMATS[format] || FORMATS["1080x1080"];
  const c = brandColors();

  const bodyFit = fitTextToBox(spec.body || "", {
    maxWidthPx: INNER_W,
    maxLines: 8,
    fontSizeMax: 36,
    fontSizeMin: 24,
  });

  const parts = [];
  parts.push(
    renderMultilineText({
      lines: [(spec.headline || "Mini TUS Bilgisi").toUpperCase()],
      x: PAD,
      y: PAD + 40,
      fontSize: 24,
      lineHeight: 30,
      fill: c.accent,
      fontWeight: "800",
    })
  );
  if (spec.subline) {
    parts.push(
      renderMultilineText({
        lines: [spec.subline],
        x: PAD,
        y: PAD + 76,
        fontSize: 26,
        lineHeight: 32,
        fill: c.muted,
        fontWeight: "600",
      })
    );
  }
  parts.push(
    renderMultilineText({
      lines: bodyFit.lines,
      x: PAD,
      y: PAD + 130 + bodyFit.fontSize,
      fontSize: bodyFit.fontSize,
      lineHeight: Math.round(bodyFit.fontSize * 1.4),
      fill: c.text,
      fontWeight: "500",
    })
  );

  let by = PAD + 130 + bodyFit.lines.length * bodyFit.fontSize * 1.4 + 32;
  for (const b of (spec.bullets || []).slice(0, 5)) {
    parts.push(
      renderMultilineText({
        lines: [`• ${b}`],
        x: PAD + 8,
        y: by + 26,
        fontSize: 26,
        lineHeight: 34,
        fill: c.text,
        fontWeight: "500",
      })
    );
    by += 42;
  }

  parts.push(brandLogo(width, c));
  parts.push(
    footerBar(width, height, c, {
      left: spec.footer || "Tusoskop · tusoskop.com",
      center: "",
    })
  );

  return finishSvg(svgShell(width, height, parts.join("\n")), width, height, format);
}

function renderFeaturePost(spec) {
  const format = spec.format || "1080x1350";
  const { width, height } = FORMATS[format] || FORMATS["1080x1350"];
  const c = brandColors();

  const hookFit = fitTextToBox(spec.hook || spec.headline || "", {
    maxWidthPx: INNER_W,
    maxLines: 2,
    fontSizeMax: 44,
    fontSizeMin: 32,
  });
  const bodyFit = fitTextToBox(spec.body || "", {
    maxWidthPx: INNER_W,
    maxLines: 6,
    fontSizeMax: 32,
    fontSizeMin: 24,
  });

  const parts = [
    renderMultilineText({
      lines: ["TUSOSKOP"],
      x: PAD,
      y: PAD + 48,
      fontSize: 22,
      lineHeight: 28,
      fill: c.accent,
      fontWeight: "800",
    }),
    renderMultilineText({
      lines: [spec.featureTitle || spec.subline || ""],
      x: PAD,
      y: PAD + 82,
      fontSize: 26,
      lineHeight: 32,
      fill: c.muted,
      fontWeight: "600",
    }),
    renderMultilineText({
      lines: hookFit.lines,
      x: PAD,
      y: PAD + 140 + hookFit.fontSize,
      fontSize: hookFit.fontSize,
      lineHeight: Math.round(hookFit.fontSize * 1.3),
      fill: c.text,
      fontWeight: "700",
    }),
    renderMultilineText({
      lines: bodyFit.lines,
      x: PAD,
      y: PAD + 200 + hookFit.lines.length * hookFit.fontSize * 1.3 + bodyFit.fontSize,
      fontSize: bodyFit.fontSize,
      lineHeight: Math.round(bodyFit.fontSize * 1.38),
      fill: c.text,
      fontWeight: "500",
    }),
    brandLogo(width, c),
    footerBar(width, height, c, {
      left: spec.footer || spec.cta || "tusoskop.com",
      center: "",
    }),
  ];

  return finishSvg(svgShell(width, height, parts.join("\n")), width, height, format);
}

function renderAnswerPost(spec) {
  const format = spec.format || "1080x1080";
  const { width, height } = FORMATS[format] || FORMATS["1080x1080"];
  const c = brandColors();

  const answerFit = fitTextToBox(spec.answerLine || "", {
    maxWidthPx: INNER_W,
    maxLines: 3,
    fontSizeMax: 36,
    fontSizeMin: 26,
  });
  const expFit = fitTextToBox(spec.explanation || "", {
    maxWidthPx: INNER_W,
    maxLines: 6,
    fontSizeMax: 28,
    fontSizeMin: 22,
  });

  const parts = [
    renderMultilineText({
      lines: ["CEVAP"],
      x: PAD,
      y: PAD + 36,
      fontSize: 24,
      lineHeight: 30,
      fill: c.accent,
      fontWeight: "800",
    }),
    renderMultilineText({
      lines: [spec.subline || "Dünün sorusu"],
      x: PAD,
      y: PAD + 72,
      fontSize: 24,
      lineHeight: 30,
      fill: c.muted,
      fontWeight: "600",
    }),
    renderMultilineText({
      lines: answerFit.lines,
      x: PAD,
      y: PAD + 130 + answerFit.fontSize,
      fontSize: answerFit.fontSize,
      lineHeight: Math.round(answerFit.fontSize * 1.35),
      fill: c.accentSoft,
      fontWeight: "700",
    }),
    renderMultilineText({
      lines: expFit.lines,
      x: PAD,
      y: PAD + 200 + answerFit.lines.length * answerFit.fontSize * 1.35 + expFit.fontSize,
      fontSize: expFit.fontSize,
      lineHeight: Math.round(expFit.fontSize * 1.38),
      fill: c.text,
      fontWeight: "500",
    }),
    brandLogo(width, c),
    footerBar(width, height, c, {
      left: "Tusoskop'ta benzer sorular",
      center: "tusoskop.com",
    }),
  ];

  return finishSvg(svgShell(width, height, parts.join("\n")), width, height, format);
}

function renderStoryQuestion(spec) {
  const { width, height } = FORMATS["1080x1920"];
  const c = brandColors();
  const qFit = fitTextToBox(spec.questionText || spec.body || "", {
    maxWidthPx: INNER_W,
    maxLines: 10,
    fontSizeMax: 42,
    fontSizeMin: 30,
  });

  const parts = [
    renderMultilineText({
      lines: [spec.badge || "BUGÜNÜN SORUSU"],
      x: PAD,
      y: PAD + 80,
      fontSize: 26,
      lineHeight: 32,
      fill: c.accent,
      fontWeight: "800",
    }),
    renderMultilineText({
      lines: qFit.lines,
      x: PAD,
      y: PAD + 160 + qFit.fontSize,
      fontSize: qFit.fontSize,
      lineHeight: Math.round(qFit.fontSize * 1.4),
      fill: c.text,
      fontWeight: "600",
    }),
    renderMultilineText({
      lines: [spec.footer || "Yorumlara cevap yaz →"],
      x: PAD,
      y: height - PAD - 20,
      fontSize: 28,
      lineHeight: 34,
      fill: c.accentSoft,
      fontWeight: "700",
    }),
    brandLogo(width, c),
  ];

  return finishSvg(svgShell(width, height, parts.join("\n")), width, height, "1080x1920");
}

function renderLegacyCard(visualSpec) {
  const format = visualSpec.format || "1080x1080";
  const { width, height } = FORMATS[format] || FORMATS["1080x1080"];
  const c = brandColors();
  const bodyFit = fitTextToBox(visualSpec.body || "", {
    maxWidthPx: INNER_W,
    maxLines: 10,
    fontSizeMax: 32,
    fontSizeMin: 22,
  });

  const parts = [
    renderMultilineText({
      lines: [visualSpec.headline || "Tusoskop"],
      x: PAD,
      y: PAD + 48,
      fontSize: 36,
      lineHeight: 42,
      fill: c.accentSoft,
      fontWeight: "700",
    }),
    visualSpec.subline
      ? renderMultilineText({
          lines: [visualSpec.subline],
          x: PAD,
          y: PAD + 96,
          fontSize: 26,
          lineHeight: 32,
          fill: c.muted,
          fontWeight: "600",
        })
      : "",
    renderMultilineText({
      lines: bodyFit.lines,
      x: PAD,
      y: PAD + 150 + bodyFit.fontSize,
      fontSize: bodyFit.fontSize,
      lineHeight: Math.round(bodyFit.fontSize * 1.38),
      fill: c.text,
      fontWeight: "500",
    }),
    footerBar(width, height, c, {
      left: visualSpec.footer || "tusoskop.com",
      center: "",
    }),
  ];

  return finishSvg(svgShell(width, height, parts.join("\n")), width, height, format);
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
