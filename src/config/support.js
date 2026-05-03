/**
 * Tusoskop destek iletişimi — tek e-posta adresi.
 * Kodda e-posta string'i tekrarlanmamalı; buradan import edin.
 */
export const SUPPORT_EMAIL = "tusoskop.destek@gmail.com";

function accountBlock(user) {
  const email = user?.email?.trim() || "Giriş yapılmamış";
  const uid = user?.uid?.trim() || "Giriş yapılmamış";
  return { email, uid };
}

function mailtoUrl(subject, body) {
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", body);
  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`;
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
