/**
 * İstemci tarafı App Store kampanya linki üretimi.
 *
 * Provider token ve base URL environment variable'lardan gelir; component içine
 * sabit yazılmaz. Token yoksa TR fallback App Store URL'i kullanılır (link yine
 * çalışır, yalnızca kampanya `ct` kırılımı olmaz).
 *
 * Mevcut `campaignLinks.js` sabitleri yeniden kullanılır.
 */
import { APP_STORE_APP_ID, APP_STORE_FALLBACK_URL } from "../constants/campaignLinks";

export function getAppStoreProviderToken() {
  return String(import.meta.env.VITE_APP_STORE_PROVIDER_TOKEN || "").trim();
}

function getAppStoreBaseUrl() {
  const custom = String(import.meta.env.VITE_APP_STORE_BASE_URL || "").trim();
  if (custom) return custom.replace(/\?.*$/, "");
  return `https://apps.apple.com/app/apple-store/id${APP_STORE_APP_ID}`;
}

/**
 * @param {string} campaignToken  App Store Connect ct değeri (ör. mq_pat_01)
 * @returns {string}
 */
export function buildClientAppStoreUrl(campaignToken) {
  const pt = getAppStoreProviderToken();
  if (!pt) return APP_STORE_FALLBACK_URL;
  const params = new URLSearchParams({
    pt,
    ct: String(campaignToken || "organic").slice(0, 40),
    mt: "8",
  });
  return `${getAppStoreBaseUrl()}?${params.toString()}`;
}
