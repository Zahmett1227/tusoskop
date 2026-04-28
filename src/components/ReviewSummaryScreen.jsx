import { accentThemes } from "../theme/accentThemes";

export default function ReviewSummaryScreen({ summary, goStudyCollection, accentTheme }) {
  const theme = accentTheme || accentThemes.emerald;
  const safe = summary || { total: 0, correct: 0, wrong: 0, stillNeedsReview: 0 };
  return (
    <div
      className={`min-h-dvh bg-slate-950 text-white px-4 py-6 ${theme.softBg}`}
      style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}
    >
      <div className="max-w-xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className={`text-xs uppercase tracking-[0.24em] font-black ${theme.text}`}>Tekrar Tamamlandı</p>
        <h1 className="text-2xl font-black mt-2">Bugünkü tekrar turu bitti</h1>
        <p className="text-sm text-slate-400 mt-2">
          Yanlışların ve favorilerin üzerinden kısa bir tekrar tamamlandı.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center">
            <p className="text-[10px] uppercase font-black text-slate-500">Toplam</p>
            <p className={`text-2xl font-black ${theme.text}`}>{safe.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center">
            <p className="text-[10px] uppercase font-black text-slate-500">Doğru</p>
            <p className="text-2xl font-black text-emerald-300">{safe.correct}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center">
            <p className="text-[10px] uppercase font-black text-slate-500">Yanlış</p>
            <p className="text-2xl font-black text-rose-300">{safe.wrong}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center">
            <p className="text-[10px] uppercase font-black text-slate-500">Hala Tekrar Gerekir</p>
            <p className="text-2xl font-black text-amber-300">{safe.stillNeedsReview}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={goStudyCollection}
          className={`mt-6 w-full min-h-10 rounded-2xl ${theme.primary} ${theme.primaryHover} text-slate-950 font-black`}
        >
          Çalışma Alanıma Dön
        </button>
      </div>
    </div>
  );
}
