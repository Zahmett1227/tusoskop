import crypto from "node:crypto";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { CAMPAIGN_SOURCE } from "../../src/constants/campaignLinks.js";

let adminReady = false;
let initError = null;

function getAdminDb() {
  if (adminReady) {
    return getFirestore();
  }

  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawJson) {
    initError = new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
    throw initError;
  }

  try {
    const serviceAccount = JSON.parse(rawJson);
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || "tusoskop",
      });
    }
    adminReady = true;
    initError = null;
    return getFirestore();
  } catch (error) {
    initError = error;
    throw error;
  }
}

function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash("sha256").update(String(ip)).digest("hex");
}

function truncate(value, max = 512) {
  const text = String(value ?? "");
  return text.length > max ? text.slice(0, max) : text;
}

/**
 * @param {import("http").IncomingMessage} req
 */
export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? null;
}

/**
 * @param {{
 *   req: import("http").IncomingMessage,
 *   campaign: string,
 *   medium: string,
 *   platform: string,
 *   destination: string,
 *   rawQuery: string,
 * }} payload
 */
export async function logCampaignClick(payload) {
  try {
    const db = getAdminDb();
    const ip = getClientIp(payload.req);

    await db.collection("campaignClicks").add({
      campaign: payload.campaign,
      source: CAMPAIGN_SOURCE,
      medium: payload.medium,
      platform: payload.platform,
      destination: payload.destination,
      userAgent: truncate(payload.req.headers["user-agent"] || ""),
      referrer: truncate(payload.req.headers.referer || payload.req.headers.referrer || "", 2048),
      path: "/basla",
      rawQuery: truncate(payload.rawQuery || "", 512),
      ipHash: hashIp(ip),
      createdAt: FieldValue.serverTimestamp(),
    });
    return { ok: true };
  } catch (error) {
    console.error("[campaign-redirect] Firestore log failed:", error?.message || error);
    return { ok: false, error };
  }
}

export function getCampaignLogInitError() {
  return initError;
}
