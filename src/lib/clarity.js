import Clarity from "@microsoft/clarity";

let tagsApplied = false;

function inBrowser() {
  return typeof window !== "undefined";
}

/**
 * Varsayılan etiketler. Clarity script'i index.html ile yüklenir;
 * Clarity.init çağrılmaz (snippet ile çift tag yüklemesini önlemek için).
 */
export function initClarity() {
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID;

  if (!projectId || !inBrowser()) {
    return;
  }

  if (tagsApplied) {
    return;
  }

  try {
    Clarity.setTag("project", "tusoskop");
    Clarity.setTag("platform", "web");
    tagsApplied = true;
  } catch (err) {
    console.warn("Clarity init tags failed:", err);
  }
}

export function trackClarityEvent(eventName) {
  try {
    if (!inBrowser() || !eventName) return;
    Clarity.event(eventName);
  } catch (err) {
    console.warn("Clarity event failed:", eventName, err);
  }
}

export function setClarityTag(key, value) {
  try {
    if (!inBrowser() || !key || value === undefined || value === null) return;
    Clarity.setTag(key, String(value));
  } catch (err) {
    console.warn("Clarity tag failed:", key, err);
  }
}

export function identifyClarityUser(userId) {
  try {
    if (!inBrowser() || !userId) return;
    Clarity.identify(String(userId));
  } catch (err) {
    console.warn("Clarity identify failed:", err);
  }
}

/* İleride KVKK / çerez banner ile izin verildiğinde örnek:
 * Clarity.consentV2({
 *   ad_Storage: "denied",
 *   analytics_Storage: "granted",
 * });
 */
