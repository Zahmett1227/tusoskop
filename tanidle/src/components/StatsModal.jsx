import { MAX_GUESSES } from "./GameScreen.jsx";

export default function StatsModal({ stats, onClose }) {
  const winRate = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
  const maxBar = Math.max(1, ...Object.values(stats.distribution || {}));

  return (
    <Overlay onClose={onClose}>
      <h2 className="mb-4 text-lg font-extrabold text-slate-800">İstatistikler</h2>

      <div className="mb-5 grid grid-cols-4 gap-2 text-center">
        <Stat value={stats.played} label="Oynanan" />
        <Stat value={`%${winRate}`} label="Başarı" />
        <Stat value={stats.currentStreak} label="Seri" />
        <Stat value={stats.bestStreak} label="En iyi" />
      </div>

      <h3 className="mb-2 text-sm font-bold text-slate-700">Tahmin Dağılımı</h3>
      <div className="space-y-1.5">
        {Array.from({ length: MAX_GUESSES }).map((_, i) => {
          const n = i + 1;
          const count = stats.distribution?.[n] || 0;
          const pct = Math.round((count / maxBar) * 100);
          return (
            <div key={n} className="flex items-center gap-2 text-sm">
              <span className="w-4 font-semibold text-slate-500">{n}</span>
              <div className="flex-1">
                <div
                  className="flex h-6 min-w-[1.5rem] items-center justify-end rounded bg-brand-500 px-2 text-xs font-bold text-white"
                  style={{ width: `${Math.max(pct, count ? 12 : 0)}%` }}
                >
                  {count > 0 ? count : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Overlay>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="text-2xl font-extrabold text-slate-800">{value}</div>
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
    </div>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-fade-up w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export { Overlay };
