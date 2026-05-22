import {
  FORBIDDEN_CLAIM_PATTERNS,
  FORBIDDEN_SPAM_HASHTAGS,
  MAX_EMOJI_COUNT,
} from "../data/socialContentRules.js";
import { SOCIAL_CONFIG } from "./socialConfig.js";

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

/**
 * Paylaşım öncesi içerik güvenlik denetimi.
 * @param {object} content — caption, hashtags, title, type
 * @param {{ recentCaptions?: string[] }} ctx
 */
export function runSafetyCheck(content, ctx = {}) {
  const issues = [];
  const warnings = [];
  const text = [content.title, content.caption, content.storyText].filter(Boolean).join("\n");
  const hashtagLine = (content.hashtags || []).join(" ");

  for (const re of FORBIDDEN_CLAIM_PATTERNS) {
    if (re.test(text)) {
      issues.push({ code: "forbidden_claim", message: `Yasaklı iddia kalıbı: ${re}` });
    }
  }

  for (const tag of FORBIDDEN_SPAM_HASHTAGS) {
    if (hashtagLine.toLowerCase().includes(tag.toLowerCase())) {
      issues.push({ code: "spam_hashtag", message: `Spam hashtag: ${tag}` });
    }
  }

  const emojiCount = (text.match(EMOJI_RE) || []).length;
  if (emojiCount > MAX_EMOJI_COUNT) {
    warnings.push({ code: "too_many_emoji", message: `Çok fazla emoji: ${emojiCount}` });
  }

  if (text.length > SOCIAL_CONFIG.maxCaptionLength) {
    issues.push({ code: "caption_too_long", message: "Caption çok uzun" });
  }

  if ((content.hashtags || []).length > SOCIAL_CONFIG.maxHashtags) {
    warnings.push({ code: "too_many_hashtags", message: "Hashtag sayısı yüksek" });
  }

  const recent = ctx.recentCaptions || [];
  const norm = normalize(text);
  for (const prev of recent) {
    if (similarity(norm, normalize(prev)) >= 0.92) {
      issues.push({ code: "duplicate_recent", message: "Son 30 gün içinde benzer içerik" });
      break;
    }
  }

  if (!text.trim() && content.type !== "story") {
    issues.push({ code: "empty_caption", message: "Boş caption" });
  }

  const passed = issues.length === 0;
  return {
    passed,
    issues,
    warnings,
    checkedAt: new Date().toISOString(),
  };
}

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a, b) {
  const wa = new Set(a.split(" ").filter((w) => w.length > 3));
  const wb = new Set(b.split(" ").filter((w) => w.length > 3));
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / (wa.size + wb.size - inter || 1);
}

export function safetyBlocksPublish(report) {
  return !report?.passed;
}
