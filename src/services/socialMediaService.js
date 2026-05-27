import { db } from "../firebase.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  limit,
} from "firebase/firestore";
import { SOCIAL_CONTENT_STATUS, SOCIAL_CONTENT_TYPES } from "../social/socialTypes.js";
import { buildSocialContentBatch } from "../social/socialPipeline.js";
import { renderSocialVisual, renderStoryVisual } from "../social/visualGenerator.js";
import { renderCarousel, generateCarouselSlides } from "../social/carouselGenerator.js";
import {
  buildAnswerStorySpec,
  buildQuestionStorySpec,
  buildQuestionVisualSpec,
  optionLabel,
} from "../social/contentGenerator.js";
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

/**
 * @param {object[]} [questions] — kaynak sorudan visualSpec yeniden kurmak için
 */
export async function regenerateVisual(contentId, content, adminUid, questions = []) {
  const sourceQ = findQuestionById(questions, content.sourceQuestionId);
  const storyVisualSpec =
    content.storyVisualSpec || rebuildStorySpec(content, questions);
  const storyAnswerVisualSpec =
    content.storyAnswerVisualSpec || rebuildStoryAnswerSpec(content, questions);

  let patch = {};

  if (content.carouselSpecs?.length || (sourceQ && content.type === SOCIAL_CONTENT_TYPES.DAILY_QUESTION)) {
    const specs = content.carouselSpecs || generateCarouselSlides(sourceQ);
    const carousel = renderCarousel(specs);
    patch = {
      carouselSpecs: specs,
      carouselSlideCount: carousel.slideCount,
      carouselSlides: carousel.slides.map((s, i) => ({
        index: i,
        svgUrl: s.svgUrl,
        svg: s.svg,
        width: s.width,
        height: s.height,
        format: s.format,
        slideRole: specs[i]?.slideRole,
      })),
      visualUrl: carousel.primary?.svgUrl,
      visualSvg: carousel.primary?.svg,
      visualWidth: carousel.primary?.width,
      visualHeight: carousel.primary?.height,
      visualFormat: carousel.primary?.format,
      visualMode: "carousel",
      visualSpec: content.visualSpec || rebuildVisualSpec(content, questions),
    };
  } else {
    const visualSpec = content.visualSpec || rebuildVisualSpec(content, questions);
    const visual = renderSocialVisual(visualSpec);
    patch = {
      visualUrl: visual.svgUrl,
      visualSvg: visual.svg,
      visualWidth: visual.width,
      visualHeight: visual.height,
      visualFormat: visual.format,
      visualSpec,
      visualMode: "single",
    };
  }

  const storyVisual = storyVisualSpec ? renderStoryVisual(storyVisualSpec) : null;
  patch.storyVisualUrl = storyVisual?.svgUrl ?? null;
  patch.storyVisualSvg = storyVisual?.svg ?? null;
  patch.storyVisualWidth = storyVisual?.width ?? null;
  patch.storyVisualHeight = storyVisual?.height ?? null;
  patch.storyVisualFormat = storyVisual?.format ?? null;
  patch.storyVisualSpec = storyVisualSpec ?? null;

  const storyAnswerVisual = storyAnswerVisualSpec ? renderSocialVisual(storyAnswerVisualSpec) : null;
  patch.storyAnswerVisualUrl = storyAnswerVisual?.svgUrl ?? null;
  patch.storyAnswerVisualSvg = storyAnswerVisual?.svg ?? null;
  patch.storyAnswerVisualWidth = storyAnswerVisual?.width ?? null;
  patch.storyAnswerVisualHeight = storyAnswerVisual?.height ?? null;
  patch.storyAnswerVisualFormat = storyAnswerVisual?.format ?? null;
  patch.storyAnswerVisualSpec = storyAnswerVisualSpec ?? null;

  await updateSocialContent(contentId, patch, adminUid);
  return patch;
}

function findQuestionById(questions, id) {
  if (!id || !questions?.length) return null;
  return questions.find((q) => q.id === id) || null;
}

function parseQuestionFromCaption(caption) {
  if (!caption) return null;
  const lines = caption.split("\n");
  const optionRe = /^([A-E])\)\s*(.+)$/;
  const options = [];
  let questionLines = [];
  let inQuestion = false;
  let pastIntro = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inQuestion && questionLines.length) pastIntro = true;
      continue;
    }
    if (line.startsWith("#") || line.includes("Tusoskop") || line.includes("yorumlara")) {
      continue;
    }
    const optMatch = line.match(optionRe);
    if (optMatch) {
      options.push({ letter: optMatch[1], text: optMatch[2].trim() });
      inQuestion = false;
      continue;
    }
    if (options.length) continue;
    if (!pastIntro && questionLines.length === 0 && line.length < 60) {
      continue;
    }
    inQuestion = true;
    questionLines.push(line);
  }

  const questionText = questionLines.join(" ").trim();
  if (!questionText) return null;
  return { questionText, options };
}

export function rebuildVisualSpec(content, questions = []) {
  if (content.visualSpec?.templateType) return content.visualSpec;

  const sourceQ = findQuestionById(questions, content.sourceQuestionId);
  if (sourceQ && content.type === SOCIAL_CONTENT_TYPES.DAILY_QUESTION) {
    return buildQuestionVisualSpec(sourceQ);
  }

  if (content.type === SOCIAL_CONTENT_TYPES.ANSWER_REVEAL && content.answerPayload) {
    const letter = optionLabel(content.answerPayload.correctIndex ?? 0);
    return {
      templateType: "answer_post",
      format: content.visualFormat || "1080x1080",
      subline: content.sourceDers ? `${content.sourceDers} · dünün sorusu` : "Dünün sorusu",
      answerLine: `Doğru cevap: ${letter}) ${content.answerPayload.correctText || ""}`,
      explanation: content.answerPayload.explanation || "",
    };
  }

  if (content.type === SOCIAL_CONTENT_TYPES.DAILY_QUESTION) {
    const parsed = parseQuestionFromCaption(content.caption);
    if (parsed) {
      return {
        templateType: "question_post",
        format: "1080x1080",
        badge: "GÜNÜN TUS SORUSU",
        metaLine: content.sourceDers
          ? `${content.sourceDers}${content.sourceKonu ? ` · ${content.sourceKonu}` : ""}`
          : "",
        questionText: parsed.questionText,
        options: parsed.options,
        footerLeft: "Cevabını yorumlara yaz",
        footerCenter: "Tusoskop ile daha fazla soru çöz.",
      };
    }
  }

  if (content.type === SOCIAL_CONTENT_TYPES.MINI_TIP) {
    const body = content.caption?.split("\n\n")[1] || content.caption || "";
    return {
      templateType: "mini_info_post",
      format: "1080x1080",
      headline: "Mini TUS Bilgisi",
      subline: content.title || "",
      body,
      footer: "Tusoskop · tusoskop.com",
    };
  }

  if (content.type === SOCIAL_CONTENT_TYPES.FEATURE_PROMO) {
    const parts = (content.caption || "").split("\n\n");
    return {
      templateType: "feature_post",
      format: content.visualFormat || "1080x1350",
      featureTitle: content.title || "",
      hook: parts[0] || "",
      body: parts[1] || "",
      footer: parts[2] || "tusoskop.com",
    };
  }

  return {
    headline: content.title,
    subline: content.sourceDers || content.featureId || "",
    body: content.caption?.split("\n").slice(0, 8).join("\n") || "",
    footer: "tusoskop.com",
    format: content.visualFormat || "1080x1080",
  };
}

function rebuildStorySpec(content, questions = []) {
  if (content.storyVisualSpec?.templateType) return content.storyVisualSpec;

  const sourceQ = findQuestionById(questions, content.sourceQuestionId);
  if (sourceQ) return buildQuestionStorySpec(sourceQ);
  if (sourceQ) {
    return {
      templateType: "story_question",
      format: "1080x1920",
      badge: "BUGÜNÜN SORUSU",
      metaLine: `${sourceQ.ders} · ${sourceQ.konu}`,
      questionText: String(sourceQ.q || "").trim(),
      footer: "Yorumlara cevap yaz →",
    };
  }

  return {
    templateType: "story_question",
    format: "1080x1920",
    badge: "TUSOSKOP",
    questionText: content.storyText || content.caption?.slice(0, 400) || "",
    footer: "tusoskop.com",
  };
}

function rebuildStoryAnswerSpec(content, questions = []) {
  if (content.storyAnswerVisualSpec?.templateType) return content.storyAnswerVisualSpec;

  const sourceQ = findQuestionById(questions, content.sourceQuestionId);
  if (sourceQ) return buildAnswerStorySpec(sourceQ);

  if (content.answerPayload) {
    const options = parseQuestionFromCaption(content.caption)?.options || [];
    return {
      templateType: "story_answer",
      format: "1080x1920",
      ders: content.sourceDers,
      konu: content.sourceKonu,
      metaLine: content.sourceDers
        ? `${content.sourceDers}${content.sourceKonu ? ` Â· ${content.sourceKonu}` : ""}`
        : "",
      options,
      correctIndex: content.answerPayload.correctIndex ?? 0,
      correctText: content.answerPayload.correctText || "",
      explanation: content.answerPayload.explanation || "",
      safeLayout: "instagram_story",
    };
  }

  return null;
}

export async function deleteSocialContent(contentId, adminUid) {
  await deleteDoc(doc(db, QUEUE_COL, contentId));
  await logSocialEvent({ action: "content_deleted", contentId, adminUid });
}

/**
 * GitHub Actions daily-story.yml workflow'unu tetikle.
 * Firestore'da adminConfig/githubWorkflow dokümanı gerekir:
 *   { token: "ghp_xxx", owner: "Zahmett1227", repo: "tusoskop" }
 */
export async function triggerInstagramStory(adminUid) {
  const configSnap = await getDoc(doc(db, "adminConfig", "githubWorkflow"));
  if (!configSnap.exists()) {
    throw new Error(
      "Firestore'da adminConfig/githubWorkflow dokümanı bulunamadı. " +
        "token, owner ve repo alanlarıyla oluşturun."
    );
  }
  const {
    token,
    owner = "Zahmett1227",
    repo = "tusoskop",
    workflow = "daily-story.yml",
  } = configSnap.data();
  if (!token) throw new Error("GitHub token eksik");

  const resp = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (!resp.ok) {
    let errText = "";
    try { errText = await resp.text(); } catch { errText = ""; }
    if (resp.status === 403) {
      throw new Error(
        "GitHub API 403: Token'ın 'workflow' yetkisi eksik. " +
        "Çözüm: github.com/settings/tokens → token'ı düzenle → 'workflow' scope'unu işaretle → kaydet. " +
        "Yeni token değerini Firestore adminConfig/githubWorkflow.token alanına yaz."
      );
    }
    throw new Error(`GitHub API ${resp.status}: ${errText}`);
  }

  await logSocialEvent({
    action: "workflow_triggered",
    adminUid,
    detail: { owner, repo, workflow },
  });
}

export async function deleteAllSocialDrafts(adminUid) {
  const snap = await getDocs(
    query(
      collection(db, QUEUE_COL),
      where("status", "in", ["draft", "pending_review", "rejected"]),
      limit(500)
    )
  );
  const batch = writeBatch(db);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  await logSocialEvent({
    action: "delete_all_drafts",
    adminUid,
    detail: `${snap.size} taslak silindi`,
  });
  return snap.size;
}

export async function recheckSafety(contentId, content, adminUid) {
  const recent = await getRecentUsageSnapshot();
  const safetyReport = runSafetyCheck(content, { recentCaptions: recent.recentCaptions });
  await updateSocialContent(contentId, { safetyReport }, adminUid);
  return safetyReport;
}
