/**
 * users/{uid} doküman oluşturma trigger'ı — Meta CAPI CompleteRegistration.
 *
 * `ensureUserDocument` (istemci) yeni hesapta `users/{uid}` dokümanını
 * `setDoc` ile oluşturduğu anda bu trigger tetiklenir. `event_id = uid`
 * istemci pixel'inin (`trackCompleteRegistration`) kullandığı aynı değerdir —
 * Meta iki event'i dedup eder (bkz. `functions/metaCapi.js`).
 */
const { sendMetaCapiEvent } = require("./metaCapi");

async function onUserDocumentCreatedHandler(event) {
  const uid = event.params?.uid;
  if (!uid) return;
  const data = event.data?.data() || {};

  await sendMetaCapiEvent("CompleteRegistration", {
    eventId: uid,
    actionSource: "website",
    email: data.email || undefined,
    externalId: uid,
    customData: { content_name: "Tusoskop Kayıt" },
  });
}

module.exports = { onUserDocumentCreatedHandler };
