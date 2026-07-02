/**
 * /coz mikro deneme oturum katmanı.
 *
 * - Her ziyaret için benzersiz sessionId üretir.
 * - Reklam URL parametrelerini (utm_*, campaign_code, Meta id'leri) yakalar.
 * - İlerlemeyi sessionStorage'da KAMPANYA SLUG'INA göre namespace'leyerek saklar,
 *   böylece sayfa yenilenirse kullanıcı aynı kampanyada kaldığı yerden devam eder ve
 *   başka bir kampanyanın verisi yanlış yerde kullanılmaz.
 * - Firestore yazımı YOKTUR; oturum özeti gerektiğinde serverless endpoint'e gönderilir.
 */

const KEY_PREFIX = "tusoskop_quiz_";

/** Meta reklam URL'sinden okunacak parametreler. */
export const QUIZ_PARAM_KEYS = [
  "campaign_code",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "campaign_id",
  "adset_id",
  "ad_id",
  "placement",
];

function inBrowser() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function nsKey(slug) {
  return `${KEY_PREFIX}${slug}`;
}

function genSessionId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* noop */
  }
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * URL query string'inden kampanya/UTM parametrelerini okur.
 * @returns {Record<string, string>}
 */
export function captureQuizParamsFromUrl() {
  if (!inBrowser()) return {};
  const out = {};
  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of QUIZ_PARAM_KEYS) {
      const value = params.get(key);
      if (value) out[key] = String(value).slice(0, 160);
    }
  } catch {
    /* noop */
  }
  return out;
}

function readSession(slug) {
  if (!inBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(nsKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || parsed.campaignSlug !== slug) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(slug, session) {
  if (!inBrowser()) return;
  try {
    window.sessionStorage.setItem(nsKey(slug), JSON.stringify(session));
  } catch {
    /* kota / private mode — sessizce yut, akış bozulmasın */
  }
}

/**
 * Var olan oturumu döner ya da yeni oturum oluşturur (kampanyaya özel).
 * @param {string} slug
 * @param {{ campaignCode?: string }} [campaign]
 */
export function initQuizSession(slug, campaign = {}) {
  const existing = readSession(slug);
  if (existing) return existing;

  const params = captureQuizParamsFromUrl();
  const session = {
    sessionId: genSessionId(),
    campaignSlug: slug,
    campaignCode: campaign.campaignCode || params.campaign_code || "",
    params,
    answers: [],
    currentIndex: 0,
    score: 0,
    startedAt: new Date().toISOString(),
    completedAt: null,
    firstAnswerTracked: false,
    landingTracked: false,
    completeTracked: false,
    appStoreClicked: false,
    webContinueClicked: false,
    registered: false,
  };
  writeSession(slug, session);
  return session;
}

export function getQuizSession(slug) {
  return readSession(slug);
}

/**
 * Oturuma kısmi güncelleme uygular ve saklar.
 * @param {string} slug
 * @param {Record<string, unknown>} patch
 */
export function updateQuizSession(slug, patch) {
  const current = readSession(slug) || initQuizSession(slug);
  const next = { ...current, ...patch };
  writeSession(slug, next);
  return next;
}
