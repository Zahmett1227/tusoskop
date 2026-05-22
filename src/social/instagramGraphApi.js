/**
 * Instagram Graph API istemci tarafında KULLANILMAZ.
 * Tüm paylaşım işlemleri: functions/instagramGraphApi.js + tryPublishSocialContent callable.
 *
 * @see src/social/publisher.js
 */
export function instagramApiClientSideForbidden() {
  throw new Error(
    "Instagram API yalnızca sunucu tarafında çalışır. publisher.publishContent() kullanın."
  );
}
