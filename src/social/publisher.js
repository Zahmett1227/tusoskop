/**
 * Paylaşım yayıncısı — istemci tarafı.
 * Gerçek Instagram paylaşımı YALNIZCA Cloud Functions üzerinden (resmi Graph API).
 * Private API, cookie login, bot etkileşimi YASAK.
 */
import { functions } from "../firebase.js";
import { httpsCallable } from "firebase/functions";
import { SOCIAL_CONFIG } from "./socialConfig.js";
import { exportContentToDownloads } from "./exportPackage.js";
import { SOCIAL_CONTENT_STATUS } from "./socialTypes.js";

/**
 * Onaylı içeriği paylaşmayı dener.
 * API yapılandırılmamışsa export paketi döner.
 */
export async function publishContent(contentId) {
  const callable = httpsCallable(functions, SOCIAL_CONFIG.functions.tryPublish);
  try {
    const result = await callable({ contentId });
    return result.data;
  } catch (err) {
    return {
      success: false,
      mode: "error",
      message: err?.message || "Paylaşım başarısız",
    };
  }
}

/** API yoksa veya admin export istediğinde yerel paket indir. */
export async function exportApprovedContent(content) {
  const pkg = await exportContentToDownloads(content);
  return {
    success: true,
    mode: "export",
    status: SOCIAL_CONTENT_STATUS.EXPORTED,
    package: pkg,
  };
}
