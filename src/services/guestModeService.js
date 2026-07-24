import { GUEST_LIMITS } from "../config/limits";

/**
 * Misafir (hesapsız) mod — tamamen yerel.
 * Buluta hiçbir şey yazılmaz; tek global soru sayacı 10'a kadar sayar.
 * Aşınca çağıran taraf giriş pop-up'ı gösterir.
 */

const GUEST_USAGE_KEY = "tusoskopGuestUsage";
const GUEST_MODE_KEY = "tusoskopGuestMode";

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function getGuestAnsweredCount() {
  if (!canUseStorage()) return 0;
  try {
    const n = Number(window.localStorage.getItem(GUEST_USAGE_KEY));
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function getGuestRemaining() {
  return Math.max(0, GUEST_LIMITS.totalQuestions - getGuestAnsweredCount());
}

export function isGuestLimitReached() {
  return getGuestAnsweredCount() >= GUEST_LIMITS.totalQuestions;
}

/** Bir soru cevaplandığında sayacı artır; yeni toplamı döndürür. */
export function recordGuestAnswer() {
  if (!canUseStorage()) return getGuestAnsweredCount();
  const next = getGuestAnsweredCount() + 1;
  try {
    window.localStorage.setItem(GUEST_USAGE_KEY, String(next));
  } catch {
    /* quota / private mode */
  }
  return next;
}

export function resetGuestUsage() {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(GUEST_USAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Sayfa yenilemede misafir modunun korunması için oturum bayrağı. */
export function isGuestSession() {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") return false;
  try {
    return window.sessionStorage.getItem(GUEST_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setGuestSession(on) {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") return;
  try {
    if (on) window.sessionStorage.setItem(GUEST_MODE_KEY, "1");
    else window.sessionStorage.removeItem(GUEST_MODE_KEY);
  } catch {
    /* ignore */
  }
}
