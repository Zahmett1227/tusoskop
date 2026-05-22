const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const { HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const {
  isInstagramApiConfigured,
  publishInstagramFeedPost,
} = require("./instagramGraphApi");

const db = getFirestore();

async function assertAdmin(uid) {
  if (!uid) throw new HttpsError("unauthenticated", "Giriş gerekli.");
  const snap = await db.doc(`admins/${uid}`).get();
  if (!snap.exists || snap.data()?.active !== true) {
    throw new HttpsError("permission-denied", "Admin yetkisi gerekli.");
  }
}

async function logSocial(action, detail) {
  await db.collection("socialLogs").add({
    action,
    detail: detail || null,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Onaylı sosyal içeriği paylaşmayı dener.
 * API yoksa export moduna düşer (istemci indirir).
 */
async function tryPublishSocialContentHandler(request) {
  await assertAdmin(request.auth?.uid);

  const contentId = request.data?.contentId;
  if (!contentId) {
    throw new HttpsError("invalid-argument", "contentId gerekli.");
  }

  const ref = db.doc(`socialContentQueue/${contentId}`);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "İçerik bulunamadı.");
  }

  const content = snap.data();
  const allowed = ["approved", "scheduled", "pending_review"];
  if (!allowed.includes(content.status)) {
    throw new HttpsError("failed-precondition", `Durum uygun değil: ${content.status}`);
  }

  if (content.safetyReport && content.safetyReport.passed === false) {
    throw new HttpsError("failed-precondition", "Güvenlik kontrolü geçmedi.");
  }

  await logSocial("publish_attempt", { contentId, adminUid: request.auth.uid });

  if (!isInstagramApiConfigured()) {
    await logSocial("publish_export_fallback", { contentId });
    return {
      success: true,
      mode: "export",
      message:
        "Instagram Graph API yapılandırılmadı. Export paketini indirip manuel paylaşın.",
    };
  }

  // MVP: public image URL gerekir — visualUrl data: SVG ise API kabul etmez.
  // Phase 2: Firebase Storage'a PNG yükle, public URL ile publish et.
  const imageUrl = content.publicImageUrl || null;
  if (!imageUrl || String(imageUrl).startsWith("data:")) {
    await logSocial("publish_needs_storage_url", { contentId });
    return {
      success: true,
      mode: "export",
      message:
        "Görsel henüz public HTTPS URL'de değil. Export paketi kullanın veya Storage entegrasyonunu tamamlayın.",
    };
  }

  const caption = [content.caption, (content.hashtags || []).join(" ")]
    .filter(Boolean)
    .join("\n\n");

  const result = await publishInstagramFeedPost({ imageUrl, caption });

  if (!result.success) {
    await ref.update({
      status: "failed",
      error: result.message,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await logSocial("publish_failed", { contentId, error: result.message });
    return { success: false, mode: "error", message: result.message };
  }

  await ref.update({
    status: "published",
    publishedAt: FieldValue.serverTimestamp(),
    publishMeta: result,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await logSocial("publish_success", { contentId, mediaId: result.mediaId });

  return {
    success: true,
    mode: "api",
    mediaId: result.mediaId,
  };
}

module.exports = { tryPublishSocialContentHandler };
