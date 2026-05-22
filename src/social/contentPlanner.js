import { SOCIAL_CONTENT_TYPES } from "./socialTypes.js";
import { SOCIAL_CONFIG } from "./socialConfig.js";
import { FEATURE_PROMO_ITEMS } from "../data/socialContentRules.js";

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/**
 * Haftalık / günlük içerik planı üretir.
 * @param {{ date?: Date, recentTypes?: string[], usedQuestionIds?: number[], usedFeatureIds?: string[] }} opts
 */
export function planContentForDay(opts = {}) {
  const date = opts.date || new Date();
  const dow = date.getDay(); // 0 Pazar
  const week = isoWeek(date);
  const items = [];

  items.push({
    type: SOCIAL_CONTENT_TYPES.DAILY_QUESTION,
    slot: "morning",
    scheduledAt: scheduleAt(date, 9, 0),
    title: "Günün TUS Sorusu",
  });

  items.push({
    type: SOCIAL_CONTENT_TYPES.MINI_TIP,
    slot: "afternoon",
    scheduledAt: scheduleAt(date, 18, 30),
    title: "Mini TUS Bilgisi",
  });

  // Haftada 2 özellik tanıtımı: Salı + Cuma
  if (dow === 2 || dow === 5) {
    const feature = pickFeaturePromo(opts.usedFeatureIds || [], week + dow);
    items.push({
      type: SOCIAL_CONTENT_TYPES.FEATURE_PROMO,
      slot: "evening",
      scheduledAt: scheduleAt(date, 20, 0),
      title: "Tusoskop Özellik Tanıtımı",
      featureId: feature.id,
      feature,
    });
  }

  // Perşembe: ekstra motivasyon story önerisi (MVP metin olarak)
  if (dow === 4) {
    items.push({
      type: SOCIAL_CONTENT_TYPES.STORY,
      slot: "story",
      scheduledAt: scheduleAt(date, 12, 0),
      title: "Story — Etkileşim",
      storyKind: "poll",
    });
  }

  return {
    dayKey: dayKey(date),
    week,
    items,
  };
}

export function planWeek(date = new Date()) {
  const plans = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() + i);
    plans.push(planContentForDay({ date: d }));
  }
  return plans;
}

function scheduleAt(date, hour, minute) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function pickFeaturePromo(usedIds, seed) {
  const available = FEATURE_PROMO_ITEMS.filter((f) => !usedIds.includes(f.id));
  const pool = available.length ? available : FEATURE_PROMO_ITEMS;
  return pool[seed % pool.length];
}

/**
 * Son 30 günde kullanılan soru/konu tekrarını azaltmak için filtre.
 */
export function filterUnusedQuestions(questions, usedQuestionIds = new Set()) {
  return questions.filter((q) => !usedQuestionIds.has(q.id));
}

export function pickRandomQuestion(questions, rng = Math.random) {
  if (!questions.length) return null;
  return questions[Math.floor(rng() * questions.length)];
}

export { dayKey };
