/**
 * Meta Conversions API (CAPI) — sunucu taraflı Purchase eventi.
 *
 * Neden: Tıp öğrencisi kitlesinde ad-blocker oranı yüksek; yalnız tarayıcı
 * pixel'i satışların bir kısmını Meta'dan gizler ve reklam algoritması kör kalır.
 * PayTR callback zaten sunucuda çalıştığı için Purchase'ı buradan da göndeririz.
 *
 * Dedup: Sunucu event_id = merchantOid, tarayıcıdaki Pixel eventID = merchantOid
 * (src/lib/metaPixel.js → trackPurchase). Meta ikisini aynı olaya birleştirir.
 *
 * Tasarım: FAIL-SAFE. Pixel ID veya erişim token'ı yoksa sessizce atlanır; hiçbir
 * durumda exception fırlatmaz, ödeme akışını asla bozmaz.
 *
 * Yapılandırma:
 *  - META_CAPI_TOKEN   → Secret Manager (defineSecret, index.js'de bağlanır)
 *  - META_CAPI_PIXEL_ID → env (gizli değil; VITE_META_PIXEL_ID ile aynı dataset)
 *  - META_CAPI_TEST_EVENT_CODE → env (opsiyonel; Events Manager "Test Events" için)
 */
const crypto = require("crypto");

const GRAPH_VERSION = "v21.0";

/** E-postayı Meta'nın istediği biçimde normalize edip SHA-256'lar. */
function hashEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return null;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Purchase eventini Meta CAPI'ye gönderir. Hata halinde yutulur (throw etmez).
 *
 * @param {object} p
 * @param {string} p.accessToken   Secret'tan gelen CAPI token'ı (zorunlu, yoksa atlanır)
 * @param {string} p.eventId       Dedup anahtarı — merchantOid
 * @param {number} p.value         Satın alma tutarı (ör. 209.7)
 * @param {string} [p.currency]    Varsayılan "TRY"
 * @param {string} [p.email]       Kullanıcı e-postası (hash'lenerek match key olur)
 * @param {string} [p.pixelId]     Dataset/Pixel ID (yoksa env'den okunur)
 * @param {number} [p.eventTimeMs] Event zamanı (ms); varsayılan şimdi
 * @returns {Promise<{ok:boolean, skipped?:boolean, reason?:string}>}
 */
async function sendMetaCapiPurchase(p = {}) {
  try {
    const accessToken = p.accessToken || process.env.META_CAPI_TOKEN || "";
    const pixelId = p.pixelId || process.env.META_CAPI_PIXEL_ID || process.env.META_PIXEL_ID || "";
    if (!accessToken || !pixelId) {
      return { ok: false, skipped: true, reason: "not_configured" };
    }

    const emHash = hashEmail(p.email);
    const userData = {};
    if (emHash) userData.em = [emHash];
    // IP/User-Agent bilinçli olarak GÖNDERİLMEZ: callback PayTR sunucusundan gelir,
    // req.ip kullanıcının değil PayTR'ın IP'sidir; yanlış eşleştirme kaliteyi düşürür.

    const eventTime = Math.floor((Number(p.eventTimeMs) || Date.now()) / 1000);

    const event = {
      event_name: "Purchase",
      event_time: eventTime,
      action_source: "website",
      event_source_url: "https://www.tusoskop.com/",
      event_id: String(p.eventId || ""),
      user_data: userData,
      custom_data: {
        currency: p.currency || "TRY",
        value: Number(p.value) || 0,
        content_type: "subscription",
        content_name: "Tusoskop Plus Abonelik",
        order_id: String(p.eventId || ""),
      },
    };

    const payload = { data: [event] };
    const testCode = p.testEventCode || process.env.META_CAPI_TEST_EVENT_CODE;
    if (testCode) payload.test_event_code = String(testCode);

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(
      accessToken
    )}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await resp.json().catch(() => null);

    if (!resp.ok || json?.error) {
      console.error("[META_CAPI] Purchase send failed:", json?.error?.message || resp.status);
      return { ok: false, reason: "api_error" };
    }
    return { ok: true };
  } catch (err) {
    // Ödeme akışını asla bozma.
    console.error("[META_CAPI] Purchase send exception:", err?.message || err);
    return { ok: false, reason: "exception" };
  }
}

module.exports = { sendMetaCapiPurchase, hashEmail };
