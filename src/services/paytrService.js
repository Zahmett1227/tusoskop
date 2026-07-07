import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { setClarityTag, trackClarityEvent } from "../lib/clarity";

/** Meta pixel'in `_fbp`/`_fbc` çerezlerini okur — CAPI eşleştirme kalitesi için. */
function readCookie(name) {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * PayTR iFrame token'ı ister. Tutar/süre sunucuda doğrulanır;
 * istemci yalnızca planId (ve opsiyonel iletişim alanları) gönderir.
 *
 * @returns {Promise<{ ok: boolean, token?: string, merchantOid?: string, amountLabel?: string, error?: Error }>}
 */
export async function requestPaytrToken(plan, contact = {}) {
  if (!plan?.id) {
    return { ok: false, error: new Error("Plan bilgisi yok") };
  }

  try {
    const callable = httpsCallable(functions, "createPaytrToken");
    const res = await callable({
      planId: plan.id,
      userName: contact.userName || undefined,
      userPhone: contact.userPhone || undefined,
      userAddress: contact.userAddress || undefined,
      fbp: readCookie("_fbp"),
      fbc: readCookie("_fbc"),
    });
    const data = res?.data || {};
    if (!data.token) {
      throw new Error("Token alınamadı.");
    }
    try {
      setClarityTag("paytr_plan", plan.id);
      trackClarityEvent("paytr_token_created");
    } catch {
      /* tracking akışı bozmasın */
    }
    return {
      ok: true,
      token: data.token,
      merchantOid: data.merchantOid,
      amountLabel: data.amountLabel,
    };
  } catch (err) {
    console.error("requestPaytrToken:", err);
    try {
      trackClarityEvent("paytr_token_failed");
    } catch {
      /* sessiz */
    }
    return { ok: false, error: err };
  }
}

export const PAYTR_IFRAME_URL = "https://www.paytr.com/odeme/guvenli";
export const PAYTR_IFRAME_RESIZER_SRC =
  "https://www.paytr.com/js/iframeResizer.min.js";
