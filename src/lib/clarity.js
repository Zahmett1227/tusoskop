import Clarity from "@microsoft/clarity";

let tagsApplied = false;

/**
 * Varsayılan etiketler. Clarity script’i index.html / clarity-head.js ile yüklenir;
 * Clarity.init çağrılmaz (snippet ile çift tag yüklemesini önlemek için).
 */
export function initClarity() {
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID;

  if (!projectId) {
    return;
  }

  if (tagsApplied) {
    return;
  }

  try {
    Clarity.setTag("project", "tusoskop");
    Clarity.setTag("platform", "web");
    tagsApplied = true;
  } catch {
    /* Clarity hatası uygulamayı bozmasın */
  }
}

export function trackClarityEvent(eventName) {
  try {
    if (!eventName) return;
    Clarity.event(eventName);
  } catch {
    /* Clarity hatası uygulamayı bozmasın */
  }
}

export function setClarityTag(key, value) {
  try {
    if (!key || value === undefined || value === null) return;
    Clarity.setTag(key, String(value));
  } catch {
    /* Clarity hatası uygulamayı bozmasın */
  }
}

export function identifyClarityUser(userId) {
  try {
    if (!userId) return;
    Clarity.identify(String(userId));
  } catch {
    /* Clarity hatası uygulamayı bozmasın */
  }
}

/* İleride KVKK / çerez banner ile izin verildiğinde örnek:
 * Clarity.consentV2({
 *   ad_Storage: "denied",
 *   analytics_Storage: "granted",
 * });
 */
