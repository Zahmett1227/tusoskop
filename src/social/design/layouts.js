/**
 * İçerik yoğunluğuna göre layout varyantı seçimi.
 */
export function measureContentDensity(spec = {}) {
  const questionLen = (spec.questionText || spec.body || "").length;
  const optionCount = spec.options?.length || 0;
  const optionLen = (spec.options || []).reduce((s, o) => s + (o.text?.length || 0), 0);
  const bulletCount = spec.bullets?.length || 0;
  const total = questionLen + optionLen + bulletCount * 40;

  if (total < 180) return "sparse";
  if (total < 420) return "balanced";
  if (total < 700) return "dense";
  return "compact";
}

/**
 * @returns {'centered' | 'balanced' | 'compact'}
 */
export function chooseLayoutVariant(density, format = "1080x1080") {
  if (format === "1080x1920") return "story";
  switch (density) {
    case "sparse":
      return "centered";
    case "compact":
    case "dense":
      return "compact";
    default:
      return "balanced";
  }
}

export function layoutSpacing(variant) {
  const base = {
    pad: 52,
    sectionGap: 20,
    cardPad: 24,
    optionGap: 8,
    hookMarginBottom: 16,
  };
  if (variant === "compact") {
    return { ...base, sectionGap: 14, cardPad: 18, optionGap: 6, hookMarginBottom: 12 };
  }
  if (variant === "centered") {
    return { ...base, sectionGap: 28, cardPad: 32, hookMarginBottom: 20 };
  }
  if (variant === "story") {
    return { pad: 64, sectionGap: 32, cardPad: 36, optionGap: 12, hookMarginBottom: 24 };
  }
  return base;
}
