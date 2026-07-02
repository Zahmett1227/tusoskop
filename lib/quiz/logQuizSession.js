import crypto from "node:crypto";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

/**
 * /coz mikro deneme oturum özetini Firestore'a yazan Admin SDK yardımcı katmanı.
 *
 * `lib/campaign/logCampaignClick.js` ile aynı deseni izler: Admin SDK yazımı
 * güvenlik kurallarını (rules) baypas eder; bu sayede istemciye publicQuizSessions
 * için write izni AÇMAK ZORUNDA KALMAYIZ. Var olan çalışan koda dokunulmaz;
 * bu modül kendi Admin init'ini bağımsız yapar.
 */

let adminReady = false;

function getAdminDb() {
  if (adminReady) return getFirestore();

  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  }
  const serviceAccount = JSON.parse(rawJson);
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || "tusoskop",
    });
  }
  adminReady = true;
  return getFirestore();
}

function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash("sha256").update(String(ip)).digest("hex");
}

function getClientIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? null;
}

function str(value, max = 120) {
  if (value === undefined || value === null) return null;
  const text = String(value);
  return text.length > max ? text.slice(0, max) : text;
}

function toInt(value, { min = 0, max = 1000 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function pickParams(params) {
  if (!params || typeof params !== "object") return {};
  const allowed = [
    "campaign_code",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "campaign_id",
    "adset_id",
    "ad_id",
    "placement",
  ];
  const out = {};
  for (const key of allowed) {
    if (params[key] != null) out[key] = str(params[key], 160);
  }
  return out;
}

/**
 * Oturum özetini publicQuizSessions/{sessionId} belgesine merge eder.
 * Sadece izin verilen alanları alır; istemciden gelen skor GÜVENİLİR kabul
 * edilmez (özet/analitik amaçlı saklanır, yetkilendirme kararı için kullanılmaz).
 *
 * @param {import("http").IncomingMessage} req
 * @param {Record<string, unknown>} body
 */
export async function logQuizSession(req, body) {
  const db = getAdminDb();
  const sessionId = str(body?.sessionId, 80);
  if (!sessionId) throw new Error("sessionId required");

  const event = str(body?.event, 40) || "update";
  const now = FieldValue.serverTimestamp();

  const doc = {
    sessionId,
    campaignSlug: str(body?.campaignSlug, 60),
    campaignCode: str(body?.campaignCode, 60),
    deviceType: str(body?.deviceType, 20),
    params: pickParams(body?.params),
    lastEvent: event,
    updatedAt: now,
  };

  if (body?.score != null) doc.score = toInt(body.score, { min: 0, max: 100 });
  if (body?.questionCount != null) {
    doc.questionCount = toInt(body.questionCount, { min: 0, max: 100 });
  }
  if (body?.startedAt) doc.startedAt = str(body.startedAt, 40);
  if (body?.completedAt) doc.completedAt = str(body.completedAt, 40);
  if (typeof body?.appStoreClicked === "boolean") doc.appStoreClicked = body.appStoreClicked;
  if (typeof body?.webContinueClicked === "boolean") {
    doc.webContinueClicked = body.webContinueClicked;
  }
  if (event === "quiz_complete" || event === "session_start") {
    doc.ipHash = hashIp(getClientIp(req));
    doc.userAgent = str(req.headers?.["user-agent"], 300);
  }
  if (event === "session_start") doc.createdAt = now;

  await db.collection("publicQuizSessions").doc(sessionId).set(doc, { merge: true });
  return { ok: true };
}
