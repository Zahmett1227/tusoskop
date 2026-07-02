import { logQuizSession } from "../lib/quiz/logQuizSession.js";

/**
 * /coz mikro deneme oturum özeti toplama endpoint'i (Vercel serverless).
 *
 * İstemci bu endpoint'i `fetch(..., { keepalive: true })` veya
 * `navigator.sendBeacon` ile fire-and-forget çağırır. Firestore yazımı Admin SDK
 * ile yapılır; istemcinin publicQuizSessions'a doğrudan write izni yoktur.
 *
 * Hata durumunda bile 204 döneriz — analitik yazımı asla kullanıcı akışını
 * bozmamalıdır.
 */
async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.length > 0) {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  // Stream fallback (sendBeacon Blob)
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length === 0) return null;
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    if (body && body.sessionId) {
      await logQuizSession(req, body);
    }
  } catch (error) {
    // Yut: analitik yazımı kullanıcı deneyimini etkilemez.
    if (process.env.NODE_ENV !== "production") {
      console.warn("quiz-session log failed:", error?.message || error);
    }
  }

  // İçerik döndürmeye gerek yok; beacon/keepalive için hızlı kapat.
  res.status(204).end();
}
