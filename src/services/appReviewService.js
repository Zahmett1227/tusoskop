import { APP_REVIEW_CONFIG, APP_STORE_ID } from "../config/appReview";
import { isNativePlatform } from "../utils/device";
import { readLocalStorageJson } from "../utils/safeLocalStorage";

/**
 * Nazik uygulama değerlendirme istemi — sıklık/uygunluk mantığı ve App Store
 * derin bağlantısı. Tamamen yerel; hiçbir sunucuya yazmaz.
 */

const REVIEW_KEY = "tusoskopAppReview";

const DEFAULT_STATE = {
  answeredTotal: 0,
  promptCount: 0,
  lastPromptAt: null,
  hasRated: false,
  dismissedForever: false,
};

function readState() {
  const parsed = readLocalStorageJson(REVIEW_KEY, { fallback: null, clearOnError: true });
  if (!parsed || typeof parsed !== "object") return { ...DEFAULT_STATE };
  return {
    answeredTotal: Math.max(0, Number(parsed.answeredTotal) || 0),
    promptCount: Math.max(0, Number(parsed.promptCount) || 0),
    lastPromptAt: typeof parsed.lastPromptAt === "string" ? parsed.lastPromptAt : null,
    hasRated: Boolean(parsed.hasRated),
    dismissedForever: Boolean(parsed.dismissedForever),
  };
}

function writeState(state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REVIEW_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

function patchState(patch) {
  const next = { ...readState(), ...patch };
  writeState(next);
  return next;
}

export function getAppReviewState() {
  return readState();
}

/** Çözülen soru sayacını artır; yeni toplamı döndürür. */
export function recordAnsweredForReview() {
  const state = readState();
  const answeredTotal = state.answeredTotal + 1;
  writeState({ ...state, answeredTotal });
  return answeredTotal;
}

function daysBetween(fromIso, now) {
  if (!fromIso) return Infinity;
  const from = new Date(fromIso).getTime();
  if (!Number.isFinite(from)) return Infinity;
  return (now.getTime() - from) / (1000 * 60 * 60 * 24);
}

/** Sıklık/uygunluk: daha önce değerlendirmediyse, vazgeçmediyse, tavan/gün aralığı uygunsa. */
export function isEligibleForPrompt(now = new Date()) {
  const state = readState();
  if (state.hasRated || state.dismissedForever) return false;
  if (state.promptCount >= APP_REVIEW_CONFIG.maxLifetimePrompts) return false;
  if (daysBetween(state.lastPromptAt, now) < APP_REVIEW_CONFIG.minDaysBetweenPrompts) return false;
  return true;
}

/**
 * Belirli bir tetik için istem gösterilmeli mi?
 * @param {"answered_threshold"|"topic_test_done"|"fsrs_daily"} trigger
 */
export function shouldPromptForTrigger(trigger, now = new Date()) {
  if (!isEligibleForPrompt(now)) return false;
  if (trigger === "answered_threshold") {
    return readState().answeredTotal >= APP_REVIEW_CONFIG.minAnsweredForPrompt;
  }
  // topic_test_done / fsrs_daily → pozitif tamamlanma anları, uygunluk yeterli.
  return true;
}

export function markPrompted(now = new Date()) {
  const state = readState();
  patchState({ promptCount: state.promptCount + 1, lastPromptAt: now.toISOString() });
}

export function markRated() {
  patchState({ hasRated: true });
}

export function markDismissedForever() {
  patchState({ dismissedForever: true });
}

/**
 * App Store "yorum yaz" sayfasını aç. APP_STORE_ID yoksa hiçbir şey yapmaz (false).
 */
export function openAppStoreReview() {
  if (!APP_STORE_ID) return false;
  const native = isNativePlatform();
  const url = native
    ? `itms-apps://itunes.apple.com/app/id${APP_STORE_ID}?action=write-review`
    : `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;
  try {
    const win = window.open(url, native ? "_system" : "_blank", "noopener,noreferrer");
    if (!win && !native) window.location.href = url;
  } catch {
    try {
      window.location.href = url;
    } catch {
      return false;
    }
  }
  return true;
}
