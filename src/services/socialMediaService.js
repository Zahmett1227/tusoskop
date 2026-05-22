import { db } from "../firebase.js";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  limit,
} from "firebase/firestore";
import { SOCIAL_CONTENT_STATUS } from "../social/socialTypes.js";
import { buildSocialContentBatch } from "../social/socialPipeline.js";
import { renderSocialVisual, renderStoryVisual } from "../social/visualGenerator.js";
import { runSafetyCheck } from "../social/safetyChecker.js";

const QUEUE_COL = "socialContentQueue";
const LOGS_COL = "socialLogs";

export async function logSocialEvent({ action, contentId, adminUid, detail }) {
  await addDoc(collection(db, LOGS_COL), {
    action,
    contentId: contentId || null,
    adminUid: adminUid || null,
    detail: detail || null,
    createdAt: serverTimestamp(),
  });
}

export async function listSocialContent({ status, max = 50 } = {}) {
  const snap = await getDocs(
    query(collection(db, QUEUE_COL), orderBy("createdAt", "desc"), limit(max))
  );
  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (status) {
    rows = rows.filter((r) => r.status === status);
  }
  return rows;
}

export async function getRecentUsageSnapshot(max = 200) {
  const snap = await getDocs(
    query(collection(db, QUEUE_COL), orderBy("createdAt", "desc"), limit(max))
  );
  const recentQuestionIds = [];
  const recentFeatureIds = [];
  const recentCaptions = [];
  const cutoff = Date.now() - 30 * 86400000;

  for (const d of snap.docs) {
    const data = d.data();
    const created = data.createdAt?.toDate?.()?.getTime?.() || 0;
    if (created && created < cutoff) continue;
    if (data.sourceQuestionId) recentQuestionIds.push(data.sourceQuestionId);
    if (data.featureId) recentFeatureIds.push(data.featureId);
    if (data.caption) recentCaptions.push(data.caption);
  }
  return { recentQuestionIds, recentFeatureIds, recentCaptions };
}

export async function saveContentDraft(content, adminUid) {
  const ref = await addDoc(collection(db, QUEUE_COL), {
    ...content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logSocialEvent({
    action: "content_created",
    contentId: ref.id,
    adminUid,
    detail: { type: content.type, status: content.status },
  });
  return ref.id;
}

/**
 * Bugünün içeriklerini üret ve kuyruğa ekle.
 */
export async function generateTodaySocialContent({ questions, adminUid }) {
  const recent = await getRecentUsageSnapshot();
  const { plan, outputs } = buildSocialContentBatch({
    questions,
    ...recent,
    date: new Date(),
  });

  const ids = [];
  for (const row of outputs) {
    if (row.error || !row.content) continue;
    const id = await saveContentDraft(row.content, adminUid);
    ids.push(id);
  }

  await logSocialEvent({
    action: "batch_generated",
    adminUid,
    detail: { dayKey: plan.dayKey, count: ids.length, planned: plan.items.length },
  });

  return { plan, ids, outputs };
}

export async function updateSocialContent(contentId, patch, adminUid) {
  await updateDoc(doc(db, QUEUE_COL, contentId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
  await logSocialEvent({
    action: "content_updated",
    contentId,
    adminUid,
    detail: Object.keys(patch),
  });
}

export async function approveSocialContent(contentId, adminUid, scheduledAt) {
  await updateDoc(doc(db, QUEUE_COL, contentId), {
    status: scheduledAt ? SOCIAL_CONTENT_STATUS.SCHEDULED : SOCIAL_CONTENT_STATUS.APPROVED,
    approvedAt: serverTimestamp(),
    approvedBy: adminUid,
    scheduledAt: scheduledAt || null,
    updatedAt: serverTimestamp(),
  });
  await logSocialEvent({ action: "content_approved", contentId, adminUid });
}

export async function rejectSocialContent(contentId, adminUid, reason) {
  await updateDoc(doc(db, QUEUE_COL, contentId), {
    status: SOCIAL_CONTENT_STATUS.REJECTED,
    rejectedAt: serverTimestamp(),
    rejectedBy: adminUid,
    rejectReason: reason || null,
    updatedAt: serverTimestamp(),
  });
  await logSocialEvent({ action: "content_rejected", contentId, adminUid, detail: reason });
}

export async function markContentExported(contentId, adminUid) {
  await updateDoc(doc(db, QUEUE_COL, contentId), {
    status: SOCIAL_CONTENT_STATUS.EXPORTED,
    exportedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logSocialEvent({ action: "content_exported", contentId, adminUid });
}

export async function markContentPublished(contentId, adminUid, meta = {}) {
  await updateDoc(doc(db, QUEUE_COL, contentId), {
    status: SOCIAL_CONTENT_STATUS.PUBLISHED,
    publishedAt: serverTimestamp(),
    publishMeta: meta,
    updatedAt: serverTimestamp(),
  });
  await logSocialEvent({ action: "content_published", contentId, adminUid, detail: meta });
}

export async function markContentFailed(contentId, adminUid, error) {
  await updateDoc(doc(db, QUEUE_COL, contentId), {
    status: SOCIAL_CONTENT_STATUS.FAILED,
    error: String(error || "unknown"),
    updatedAt: serverTimestamp(),
  });
  await logSocialEvent({ action: "publish_failed", contentId, adminUid, detail: error });
}

export async function regenerateVisual(contentId, content, adminUid) {
  const visual = renderSocialVisual(content.visualSpec || rebuildVisualSpec(content));
  const storyVisual = content.storyVisualSpec
    ? renderStoryVisual(content.storyVisualSpec)
    : content.storyVisualSvg
      ? renderStoryVisual(rebuildStorySpec(content))
      : null;

  const patch = {
    visualUrl: visual.svgUrl,
    visualSvg: visual.svg,
    visualWidth: visual.width,
    visualHeight: visual.height,
    visualFormat: visual.format,
    storyVisualUrl: storyVisual?.svgUrl ?? null,
    storyVisualSvg: storyVisual?.svg ?? null,
  };
  await updateSocialContent(contentId, patch, adminUid);
  return patch;
}

function rebuildVisualSpec(content) {
  return {
    headline: content.title,
    subline: content.sourceDers || content.featureId || "",
    body: content.caption?.split("\n").slice(0, 6).join("\n") || "",
    footer: "tusoskop.com",
    format: content.visualFormat || "1080x1080",
  };
}

function rebuildStorySpec(content) {
  return {
    headline: "Tusoskop",
    body: content.storyText || content.caption?.slice(0, 200) || "",
    footer: "tusoskop.com",
    format: "1080x1920",
  };
}

export async function recheckSafety(contentId, content, adminUid) {
  const recent = await getRecentUsageSnapshot();
  const safetyReport = runSafetyCheck(content, { recentCaptions: recent.recentCaptions });
  await updateSocialContent(contentId, { safetyReport }, adminUid);
  return safetyReport;
}
