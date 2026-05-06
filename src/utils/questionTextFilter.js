const ACRONYM_PATTERN = /^[A-Z0-9ÇĞİÖŞÜ+\-/]{2,12}$/;

function shouldKeepParentheses(content) {
  const trimmed = String(content || "").trim();
  if (!trimmed) return false;
  // Kısaltmalar ve sembolik klinik ifadeler kalsın: (RAAS), (PDA), (PPHN)
  return ACRONYM_PATTERN.test(trimmed);
}

export function stripExplanatoryParentheses(text) {
  if (typeof text !== "string" || !text.includes("(")) return text;

  let out = text.replace(/\s*\(([^()]{2,90})\)/g, (match, content) => {
    if (shouldKeepParentheses(content)) return match;
    return "";
  });

  // Temizlik: çift boşluklar
  out = out.replace(/\s{2,}/g, " ").trim();
  // Noktalama öncesi kalan boşluklar
  out = out.replace(/\s+([,.;:!?])/g, "$1");
  return out;
}

export function applyQuestionTextFilter(question) {
  if (!question || typeof question !== "object") return question;

  return {
    ...question,
    q: stripExplanatoryParentheses(question.q),
    exp: stripExplanatoryParentheses(question.exp),
    options: Array.isArray(question.options)
      ? question.options.map((opt) => stripExplanatoryParentheses(opt))
      : question.options,
  };
}
