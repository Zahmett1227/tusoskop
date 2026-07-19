const crypto = require("node:crypto");

// Sign in with Apple kimlikleri — gizli DEĞİL (Apple Developer'da herkese görünür
// tanımlayıcılar). Private key (.p8) ise SECRET olarak saklanır, asla koda gömülmez.
const APPLE_KEY_ID = "ZM589V4P3G";
const APPLE_TEAM_ID = "3MYXAUHX44";
// Native iOS Sign in with Apple akışında client_id = uygulama bundle ID'sidir
// (web'deki ayrı Services ID değil).
const APPLE_CLIENT_ID = "com.tusoskop.app";
const APPLE_BASE = "https://appleid.apple.com";

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

/**
 * Secret olarak saklanan .p8 içeriğini geçerli PEM'e normalize eder.
 * Firebase secret'a kaçışlı (`\n`) girilmişse gerçek satır sonuna çevirir;
 * baş/son boşlukları temizler. crypto.sign geçerli PEM bekler.
 */
function normalizePrivateKey(privateKeyPem) {
  return String(privateKeyPem || "")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .trim();
}

/**
 * Apple token/revoke endpoint'leri için ES256 imzalı client_secret JWT üretir.
 * @param {string} privateKeyPem .p8 içeriği (PEM). Firebase secret'tan gelir.
 */
function buildClientSecret(privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: APPLE_KEY_ID };
  const payload = {
    iss: APPLE_TEAM_ID,
    iat: now,
    exp: now + 300, // kısa ömür; tek istek için yeterli
    aud: APPLE_BASE,
    sub: APPLE_CLIENT_ID,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(payload)
  )}`;
  // ES256 imzasını JOSE (R||S) formatında üret — JWT bunu bekler.
  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key: normalizePrivateKey(privateKeyPem),
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${signature.toString("base64url")}`;
}

async function applePost(path, params) {
  const res = await fetch(`${APPLE_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // /auth/revoke başarıda boş gövde döner — JSON parse hatası beklenir.
  }
  return { ok: res.ok, status: res.status, json, text };
}

/** authorization_code → refresh_token (tek kullanımlık kod, hemen takas edilmeli). */
async function exchangeAuthCodeForRefreshToken(authorizationCode, privateKeyPem) {
  const clientSecret = buildClientSecret(privateKeyPem);
  const { ok, status, json, text } = await applePost("/auth/token", {
    client_id: APPLE_CLIENT_ID,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code: authorizationCode,
  });
  if (!ok || !json?.refresh_token) {
    throw new Error(`Apple token exchange başarısız (${status}): ${text}`);
  }
  return json.refresh_token;
}

/** refresh_token (veya access_token) iptal eder — hesap silmede çağrılır. */
async function revokeToken(token, privateKeyPem, tokenTypeHint = "refresh_token") {
  const clientSecret = buildClientSecret(privateKeyPem);
  const { ok, status, text } = await applePost("/auth/revoke", {
    client_id: APPLE_CLIENT_ID,
    client_secret: clientSecret,
    token,
    token_type_hint: tokenTypeHint,
  });
  if (!ok) {
    throw new Error(`Apple revoke başarısız (${status}): ${text}`);
  }
}

module.exports = {
  APPLE_CLIENT_ID,
  buildClientSecret,
  exchangeAuthCodeForRefreshToken,
  revokeToken,
};
