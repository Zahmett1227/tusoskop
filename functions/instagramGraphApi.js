/**
 * Resmi Instagram Graph API iskeleti (Meta Business / Content Publishing).
 *
 * GÜVENLİK:
 * - Yalnızca resmi Graph API
 * - Token'lar process.env / Firebase secrets (istemciye ASLA gönderilmez)
 * - Private API, cookie login, bot etkileşimi YOK
 *
 * Gerekli ortam değişkenleri (Functions runtime):
 * - META_APP_ID
 * - META_APP_SECRET
 * - META_PAGE_ID
 * - INSTAGRAM_BUSINESS_ACCOUNT_ID
 * - META_ACCESS_TOKEN (uzun ömürlü page token)
 */

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function getMetaConfig() {
  return {
    appId: process.env.META_APP_ID || "",
    appSecret: process.env.META_APP_SECRET || "",
    pageId: process.env.META_PAGE_ID || "",
    igBusinessId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || "",
    accessToken: process.env.META_ACCESS_TOKEN || "",
  };
}

/** API yapılandırması tam mı? */
function isInstagramApiConfigured() {
  const c = getMetaConfig();
  return Boolean(c.igBusinessId && c.accessToken && c.pageId);
}

/**
 * Feed post yayınla (2 adım: container → publish).
 * @param {{ imageUrl: string, caption: string }} payload
 * Görsel herkese açık HTTPS URL olmalı (Storage/CDN — MVP'de export/manuel).
 */
async function publishInstagramFeedPost(payload) {
  if (!isInstagramApiConfigured()) {
    return {
      success: false,
      configured: false,
      message:
        "Instagram Graph API yapılandırılmadı. META_ACCESS_TOKEN ve INSTAGRAM_BUSINESS_ACCOUNT_ID gerekli.",
    };
  }

  const { igBusinessId, accessToken } = getMetaConfig();
  const { imageUrl, caption } = payload;

  if (!imageUrl || !caption) {
    return { success: false, message: "imageUrl ve caption zorunlu." };
  }

  try {
    const createUrl = new URL(`${GRAPH_BASE}/${igBusinessId}/media`);
    createUrl.searchParams.set("image_url", imageUrl);
    createUrl.searchParams.set("caption", caption);
    createUrl.searchParams.set("access_token", accessToken);

    const createRes = await fetch(createUrl.toString(), { method: "POST" });
    const createJson = await createRes.json();
    if (!createRes.ok || !createJson.id) {
      return {
        success: false,
        message: createJson.error?.message || "Media container oluşturulamadı",
        raw: createJson,
      };
    }

    const publishUrl = new URL(`${GRAPH_BASE}/${igBusinessId}/media_publish`);
    publishUrl.searchParams.set("creation_id", createJson.id);
    publishUrl.searchParams.set("access_token", accessToken);

    const publishRes = await fetch(publishUrl.toString(), { method: "POST" });
    const publishJson = await publishRes.json();
    if (!publishRes.ok) {
      return {
        success: false,
        message: publishJson.error?.message || "Publish başarısız",
        raw: publishJson,
      };
    }

    return {
      success: true,
      configured: true,
      mode: "api",
      mediaId: publishJson.id,
      containerId: createJson.id,
    };
  } catch (err) {
    return {
      success: false,
      configured: true,
      message: err?.message || "Graph API isteği başarısız",
    };
  }
}

module.exports = {
  getMetaConfig,
  isInstagramApiConfigured,
  publishInstagramFeedPost,
};
