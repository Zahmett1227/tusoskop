export const APP_STORE_APP_ID = "6776331691";
export const APP_STORE_FALLBACK_URL =
  "https://apps.apple.com/tr/app/tusoskop/id6776331691?l=tr";
export const SITE_HOME_URL = "https://tusoskop.com/";
export const CAMPAIGN_SOURCE = "instagram";

const CAMPAIGN_PATTERN = /^[a-z0-9_-]{1,40}$/;
const MEDIUM_PATTERN = /^[a-z0-9_-]{1,20}$/;

/**
 * @param {string|undefined|null} raw
 * @param {{ paramPresent?: boolean }} [options]
 * @returns {"organic"|string}
 */
export function normalizeCampaignParam(raw, { paramPresent = false } = {}) {
  if (!paramPresent) return "organic";
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value) return "unknown";
  if (CAMPAIGN_PATTERN.test(value)) return value;
  return "unknown";
}

/**
 * @param {string|undefined|null} raw
 * @param {{ paramPresent?: boolean }} [options]
 */
export function normalizeMediumParam(raw, { paramPresent = false } = {}) {
  if (!paramPresent) return "story";
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value) return "story";
  if (MEDIUM_PATTERN.test(value)) return value;
  return "story";
}

/**
 * Server-side platform detection (no navigator).
 * @param {string} userAgent
 */
export function detectPlatformFromUserAgentServer(userAgent = "") {
  const ua = String(userAgent);
  if (/iPhone|iPod|iPad/i.test(ua)) return "ios";
  if (/Macintosh.*Mobile/i.test(ua) || /Mac OS X.*Mobile/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Windows NT|Macintosh|Linux|CrOS/i.test(ua)) return "desktop";
  return "unknown";
}

/**
 * @param {string} campaign
 * @param {string|null|undefined} appleCampaignPt
 */
export function buildAppStoreCampaignUrl(campaign, appleCampaignPt) {
  const pt = String(appleCampaignPt ?? "").trim();
  if (pt) {
    const params = new URLSearchParams({
      pt,
      ct: campaign,
      mt: "8",
    });
    return `https://apps.apple.com/app/apple-store/id${APP_STORE_APP_ID}?${params.toString()}`;
  }
  return APP_STORE_FALLBACK_URL;
}

export function buildAppStoreDeepLink(campaign, appleCampaignPt) {
  const httpsUrl = buildAppStoreCampaignUrl(campaign, appleCampaignPt);
  return httpsUrl.replace(/^https:\/\//, "itms-apps://");
}

/**
 * @param {string} campaign
 * @param {string} medium
 */
export function buildWebCampaignUrl(campaign, medium) {
  const params = new URLSearchParams({
    utm_source: CAMPAIGN_SOURCE,
    utm_medium: medium,
    utm_campaign: campaign,
  });
  return `${SITE_HOME_URL}?${params.toString()}`;
}

/**
 * @param {"ios"|"android"|"desktop"|"unknown"} platform
 */
export function resolveDestination(platform) {
  return platform === "ios" ? "appstore" : "website";
}

/**
 * @param {{
 *   campaign: string,
 *   medium: string,
 *   platform: "ios"|"android"|"desktop"|"unknown",
 *   appleCampaignPt?: string|null,
 * }} params
 */
export function buildCampaignRedirectTargets({
  campaign,
  medium,
  platform,
  appleCampaignPt = null,
}) {
  const webUrl = buildWebCampaignUrl(campaign, medium);
  const appStoreUrl = buildAppStoreCampaignUrl(campaign, appleCampaignPt);
  const appStoreDeepLink = buildAppStoreDeepLink(campaign, appleCampaignPt);
  const destination = resolveDestination(platform);
  const redirectUrl = destination === "appstore" ? appStoreUrl : webUrl;

  return {
    destination,
    redirectUrl,
    appStoreUrl,
    appStoreDeepLink,
    webUrl,
  };
}
