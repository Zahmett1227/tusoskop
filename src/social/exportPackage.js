import { svgToPngDataUrl } from "./visualGenerator.js";

/**
 * Onaylanmış içerik için indirilebilir paylaşım paketi oluşturur.
 * Instagram API yoksa admin bu paketi manuel paylaşır.
 */
export async function buildExportPackage(content) {
  const id = content.id || "draft";
  const caption = content.caption || "";
  const hashtags = (content.hashtags || []).join(" ");
  const fullCaption = hashtags ? `${caption}\n\n${hashtags}` : caption;

  let pngDataUrl = null;
  let pngDataUrls = [];
  let storyQuestionPngDataUrl = null;
  let storyAnswerPngDataUrl = null;

  const slideSources =
    content.carouselSlides?.length > 0
      ? content.carouselSlides
      : content.visualSvg
        ? [{ svg: content.visualSvg, width: content.visualWidth, height: content.visualHeight }]
        : [];

  for (const slide of slideSources) {
    if (!slide.svg || !slide.width || !slide.height) continue;
    try {
      const png = await svgToPngDataUrl(slide.svg, slide.width, slide.height);
      if (png) pngDataUrls.push(png);
    } catch {
      /* tek slide atla */
    }
  }

  pngDataUrl = pngDataUrls[0] || null;
  if (!pngDataUrl && content.visualSvg && content.visualWidth && content.visualHeight) {
    try {
      pngDataUrl = await svgToPngDataUrl(
        content.visualSvg,
        content.visualWidth,
        content.visualHeight
      );
    } catch {
      pngDataUrl = content.visualUrl || null;
    }
  } else if (!pngDataUrl) {
    pngDataUrl = content.visualUrl || null;
  }

  if (content.storyVisualSvg) {
    try {
      storyQuestionPngDataUrl = await svgToPngDataUrl(
        content.storyVisualSvg,
        content.storyVisualWidth || 1080,
        content.storyVisualHeight || 1920
      );
    } catch {
      storyQuestionPngDataUrl = content.storyVisualUrl || null;
    }
  }

  if (content.storyAnswerVisualSvg) {
    try {
      storyAnswerPngDataUrl = await svgToPngDataUrl(
        content.storyAnswerVisualSvg,
        content.storyAnswerVisualWidth || 1080,
        content.storyAnswerVisualHeight || 1920
      );
    } catch {
      storyAnswerPngDataUrl = content.storyAnswerVisualUrl || null;
    }
  }

  return {
    contentId: id,
    scheduledAt: content.scheduledAt || null,
    files: {
      "caption.txt": fullCaption,
      "hashtags.txt": hashtags,
      "meta.json": JSON.stringify(
        {
          id,
          type: content.type,
          title: content.title,
          scheduledAt: content.scheduledAt,
          platform: content.platform || "instagram",
          exportedAt: new Date().toISOString(),
        },
        null,
        2
      ),
    },
    pngDataUrl,
    pngDataUrls: pngDataUrls.length ? pngDataUrls : null,
    svg: content.visualSvg || null,
    carouselSlides: content.carouselSlides || null,
    storySvg: content.storyVisualSvg || null,
    storyAnswerSvg: content.storyAnswerVisualSvg || null,
    storyQuestionPngDataUrl,
    storyAnswerPngDataUrl,
  };
}

/** Tek tek dosya indirme (MVP zip kütüphanesi yok) */
export function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(filename, dataUrl) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function exportContentToDownloads(content) {
  const pkg = await buildExportPackage(content);
  downloadTextFile(`${content.id}-caption.txt`, pkg.files["caption.txt"]);
  downloadTextFile(`${content.id}-hashtags.txt`, pkg.files["hashtags.txt"]);
  downloadTextFile(`${content.id}-meta.json`, pkg.files["meta.json"]);
  if (pkg.pngDataUrls?.length) {
    for (let i = 0; i < pkg.pngDataUrls.length; i++) {
      downloadDataUrl(`${content.id}-slide-${i + 1}.png`, pkg.pngDataUrls[i]);
    }
  } else if (pkg.pngDataUrl) {
    downloadDataUrl(`${content.id}-post.png`, pkg.pngDataUrl);
  } else if (content.visualUrl) {
    downloadDataUrl(`${content.id}-post.svg`, content.visualUrl);
  }
  if (pkg.storyQuestionPngDataUrl) {
    downloadDataUrl(`${content.id}-story-question.png`, pkg.storyQuestionPngDataUrl);
  }
  if (pkg.storyAnswerPngDataUrl) {
    downloadDataUrl(`${content.id}-story-answer.png`, pkg.storyAnswerPngDataUrl);
  }
  return pkg;
}
