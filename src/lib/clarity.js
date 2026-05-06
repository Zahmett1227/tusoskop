let clarityPromise = null;
let tagsApplied = false;

function inBrowser() {
  return typeof window !== "undefined";
}

async function getClarity() {
  if (!inBrowser()) return null;
  if (!clarityPromise) {
    clarityPromise = import("@microsoft/clarity").then((mod) => mod.default || mod);
  }
  return clarityPromise;
}

/**
 * Varsayılan etiketler. Clarity kütüphanesi ilk render'dan sonra dinamik yüklenir.
 */
export function initClarity() {
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID;

  if (!projectId || !inBrowser() || tagsApplied) {
    return;
  }

  getClarity()
    .then((Clarity) => {
      if (!Clarity || tagsApplied) return;
      Clarity.init(projectId);
      Clarity.setTag("project", "tusoskop");
      Clarity.setTag("platform", "web");
      tagsApplied = true;
    })
    .catch((err) => {
      console.warn("Clarity init tags failed:", err);
    });
}

export function trackClarityEvent(eventName) {
  if (!inBrowser() || !eventName) return;
  getClarity()
    .then((Clarity) => Clarity?.event?.(eventName))
    .catch((err) => {
      console.warn("Clarity event failed:", eventName, err);
    });
}

export function setClarityTag(key, value) {
  if (!inBrowser() || !key || value === undefined || value === null) return;
  getClarity()
    .then((Clarity) => Clarity?.setTag?.(key, String(value)))
    .catch((err) => {
      console.warn("Clarity tag failed:", key, err);
    });
}

export function identifyClarityUser(userId) {
  if (!inBrowser() || !userId) return;
  getClarity()
    .then((Clarity) => Clarity?.identify?.(String(userId)))
    .catch((err) => {
      console.warn("Clarity identify failed:", err);
    });
}

/* İleride KVKK / çerez banner ile izin verildiğinde örnek:
 * Clarity.consentV2({
 *   ad_Storage: "denied",
 *   analytics_Storage: "granted",
 * });
 */