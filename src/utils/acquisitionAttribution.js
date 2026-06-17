const STORAGE_KEY = "tusoskop_acquisition";

function inBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredAcquisition() {
  if (!inBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredAcquisition(payload) {
  if (!inBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Acquisition storage failed:", error);
    }
  }
}

/**
 * @param {URLSearchParams} params
 */
export function parseAcquisitionFromSearchParams(params) {
  const source = String(params.get("utm_source") || "").trim().toLowerCase();
  const medium = String(params.get("utm_medium") || "").trim().toLowerCase();
  const campaign = String(params.get("utm_campaign") || "").trim().toLowerCase();

  if (!source && !medium && !campaign) {
    return null;
  }

  return {
    source: source || "instagram",
    medium: medium || "story",
    campaign: campaign || "organic",
    firstSeenAt: new Date().toISOString(),
  };
}

/**
 * Landing URL'deki UTM parametrelerini bir kez localStorage'a yazar.
 */
export function captureAcquisitionFromUrl(url = null) {
  if (!inBrowser()) return null;
  if (readStoredAcquisition()) return readStoredAcquisition();

  const targetUrl = url || window.location.href;
  const params = new URL(targetUrl).searchParams;
  const parsed = parseAcquisitionFromSearchParams(params);
  if (!parsed) return null;

  writeStoredAcquisition(parsed);
  return parsed;
}

export function getStoredAcquisition() {
  return readStoredAcquisition();
}

/**
 * Firestore users/{uid}.acquisition için client-side payload.
 * firstSeenAt serverTimestamp ile userService içinde yazılır.
 */
export function getStoredAcquisitionForUserDoc() {
  const stored = readStoredAcquisition();
  if (!stored) return null;

  const source = String(stored.source || "").trim();
  const medium = String(stored.medium || "").trim();
  const campaign = String(stored.campaign || "").trim();
  if (!source || !medium || !campaign) return null;

  return {
    source,
    medium,
    campaign,
  };
}

export function clearStoredAcquisitionForTests() {
  if (!inBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
