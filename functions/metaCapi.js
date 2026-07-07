/**
 * Meta Conversions API (CAPI) — sunucu taraflı event gönderimi.
 *
 * Tarayıcı pixel'i (client-side fbq) ile aynı `event_id` kullanılarak Meta
 * tarafında otomatik dedup edilir — aynı olay iki kez sayılmaz. Ad-blocker
 * kullanan kullanıcılarda tarayıcı pixel'i hiç gitmeyebildiği için CAPI,
 * ölçümün tek güvenilir kopyasını garantiler.
 *
 * META_CAPI_TOKEN: Meta Events Manager → veri seti → Ayarlar → Dönüşümler API'si →
 * "Erişim belirteci oluştur" ile üretilmiş bir CAPI access token'ı olmalı.
 * Firebase Secret Manager'a elle eklenmeli: `firebase functions:secrets:set META_CAPI_TOKEN`.
 */
const crypto = require("crypto");
const { defineSecret } = require("firebase-functions/params");

const META_CAPI_TOKEN = defineSecret("META_CAPI_TOKEN");

/** Pixel/dataset ID gizli değil; env ile override edilebilir. */
const META_PIXEL_ID = process.env.META_PIXEL_ID || "1327796822800702";

const GRAPH_VERSION = "v21.0";

function sha256(value) {
  return crypto.createHash("sha256").update(String(value).trim().toLowerCase()).digest("hex");
}

/**
 * Meta CAPI'ye tek bir event gönderir. Ağ/yapılandırma hatası akışı bozmasın
 * diye hiçbir zaman fırlatmaz (throw etmez), sadece loglar.
 * @param {string} eventName - "Purchase" | "CompleteRegistration" vb.
 * @param {{
 *   eventId: string,
 *   actionSource?: string,
 *   email?: string,
 *   externalId?: string,
 *   clientIp?: string,
 *   clientUserAgent?: string,
 *   fbp?: string,
 *   fbc?: string,
 *   customData?: Record<string, unknown>,
 * }} params
 */
async function sendMetaCapiEvent(eventName, params = {}) {
  let accessToken;
  try {
    accessToken = META_CAPI_TOKEN.value();
  } catch {
    accessToken = null;
  }
  if (!accessToken) {
    console.warn(`[MetaCAPI] META_CAPI_TOKEN tanımlı değil, ${eventName} event'i atlandı.`);
    return;
  }
  if (!params.eventId) {
    console.warn(`[MetaCAPI] eventId olmadan ${eventName} gönderilemez (dedup garantisi kaybolur).`);
    return;
  }

  const userData = {};
  if (params.email) userData.em = [sha256(params.email)];
  if (params.externalId) userData.external_id = [sha256(params.externalId)];
  if (params.clientIp) userData.client_ip_address = params.clientIp;
  if (params.clientUserAgent) userData.client_user_agent = params.clientUserAgent;
  if (params.fbp) userData.fbp = params.fbp;
  if (params.fbc) userData.fbc = params.fbc;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: String(params.eventId),
        action_source: params.actionSource || "website",
        user_data: userData,
        ...(params.customData ? { custom_data: params.customData } : {}),
      },
    ],
  };

  try {
    const resp = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!resp.ok) {
      const json = await resp.json().catch(() => null);
      console.error(`[MetaCAPI] ${eventName} gönderilemedi:`, json || resp.status);
    }
  } catch (err) {
    console.error(`[MetaCAPI] ${eventName} network error:`, err);
  }
}

module.exports = { sendMetaCapiEvent, META_CAPI_TOKEN };
