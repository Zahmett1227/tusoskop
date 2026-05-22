import React, { useEffect, useState } from "react";

/** @param {{ content: object, onSave: (patch: object) => void, onClose: () => void }} props */
export default function SocialMediaEditor({ content, onSave, onClose }) {
  const [caption, setCaption] = useState(content?.caption || "");
  const [title, setTitle] = useState(content?.title || "");
  const [hashtags, setHashtags] = useState((content?.hashtags || []).join(" "));
  const [scheduledAt, setScheduledAt] = useState(
    content?.scheduledAt ? toLocalInput(content.scheduledAt) : ""
  );

  useEffect(() => {
    setCaption(content?.caption || "");
    setTitle(content?.title || "");
    setHashtags((content?.hashtags || []).join(" "));
    setScheduledAt(content?.scheduledAt ? toLocalInput(content.scheduledAt) : "");
  }, [content]);

  if (!content) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-black text-white mb-4">İçeriği düzenle</h3>
        <label className="block text-xs font-bold text-slate-400 mb-1">Başlık</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-3 min-h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
        />
        <label className="block text-xs font-bold text-slate-400 mb-1">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={8}
          className="w-full mb-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
        />
        <label className="block text-xs font-bold text-slate-400 mb-1">Hashtag (boşlukla ayır)</label>
        <input
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          className="w-full mb-3 min-h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
        />
        <label className="block text-xs font-bold text-slate-400 mb-1">Zamanlama (opsiyonel)</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full mb-4 min-h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 px-4 rounded-xl border border-slate-600 text-slate-300 text-sm font-bold"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({
                title,
                caption,
                hashtags: hashtags.split(/\s+/).filter(Boolean),
                scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : content.scheduledAt,
              })
            }
            className="min-h-10 px-4 rounded-xl bg-emerald-500 text-slate-950 text-sm font-black"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

function toLocalInput(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}
