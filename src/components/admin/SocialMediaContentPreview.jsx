/** @param {{ content: object }} props */
export default function SocialMediaContentPreview({ content }) {
  if (!content) return null;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <p className="text-xs font-bold text-emerald-400 mb-2">Post görseli</p>
        {content.visualUrl ? (
          <img
            src={content.visualUrl}
            alt={content.title || "Post önizleme"}
            className="w-full rounded-xl border border-slate-700 bg-slate-950"
          />
        ) : (
          <div className="h-48 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 text-sm">
            Görsel yok
          </div>
        )}
      </div>
      {content.storyVisualUrl ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-xs font-bold text-emerald-400 mb-2">Story önizleme</p>
          <img
            src={content.storyVisualUrl}
            alt="Story"
            className="max-h-80 mx-auto rounded-xl border border-slate-700 bg-slate-950"
          />
        </div>
      ) : null}
      <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <p className="text-xs font-bold text-slate-400 mb-2">Caption</p>
        <pre className="whitespace-pre-wrap text-sm text-slate-200 font-medium leading-relaxed">
          {content.caption || content.storyText || "—"}
        </pre>
        {content.hashtags?.length ? (
          <p className="mt-3 text-xs text-emerald-400/90">{content.hashtags.join(" ")}</p>
        ) : null}
      </div>
    </div>
  );
}
