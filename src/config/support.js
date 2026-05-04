/**
 * Tusoskop destek iletişimi — tek e-posta adresi.
 * Kodda e-posta string'i tekrarlanmamalı; buradan import edin.
 */
import { encodeMailtoParamForOutlook } from "../utils/mailtoOutlookEncoding";

export const SUPPORT_EMAIL = "tusoskop.destek@gmail.com";

function accountBlock(user) {
  const email = user?.email?.trim() || "Giriş yapılmamış";
  const uid = user?.uid?.trim() || "Giriş yapılmamış";
  return { email, uid };
}

/**
 * mailto: konu ve gövde — Outlook Windows, UTF-8 %XX çözümünü yanlış yorumlayıp
 * mojibake üretir; Windows-1254 baytına çevirip yüzde kodluyoruz.
 */
function mailtoUrl(subject, body) {
  const q = [
    `subject=${encodeMailtoParamForOutlook(subject)}`,
    `body=${encodeMailtoParamForOutlook(body)}`,
  ].join("&");
  return `mailto:${SUPPORT_EMAIL}?${q}`;
}

/** Plus ödemesi / checkout sorunları için hazır şablon. */
export function getMailtoPaymentIssue(user) {
  const { email, uid } = accountBlock(user);
  const body = `Merhaba,

Tusoskop Plus ödememle ilgili destek almak istiyorum.

Konu: Ödeme yaptım ama Plus açılmadı / Checkout sorunu / Yanlış paket / Diğer

Hesap bilgilerim:
Email: ${email}
Hesap ID: ${uid}

Mesajım:
`;
  return mailtoUrl("Tusoskop ödeme sorunu", body);
}

/** Genel geri bildirim (olumlu / olumsuz, öneri). */
export function getMailtoFeedback(user) {
  const { email, uid } = accountBlock(user);
  const body = `Merhaba,

Tusoskop hakkında geri bildirim paylaşmak istiyorum.

Olumlu / olumsuz düşüncem:

Hesap bilgilerim:
Email: ${email}
Hesap ID: ${uid}

Mesajım:
`;
  return mailtoUrl("Tusoskop geri bildirim", body);
}

/** Limit modalı ve hızlı destek satırları için kısa şablon. */
export function getMailtoQuickSupport(user) {
  const { email, uid } = accountBlock(user);
  const body = `Merhaba,

Ödeme veya Plus erişimiyle ilgili destek almak istiyorum.

Hesap bilgilerim:
Email: ${email}
Hesap ID: ${uid}

Mesajım:
`;
  return mailtoUrl("Tusoskop destek", body);
}
