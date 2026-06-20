import { useEffect, useMemo, useState } from "react";
import { getFsrsDailyStatsRange } from "../../services/fsrsStatsService";

const ACCENT_HEX = {
  emerald: "#34d399",
  cyan: "#22d3ee",
  violet: "#a78bfa",
  amber: "#fbbf24",
  light: "#10b981",
};

function accentHex(key) {
  return ACCENT_HEX[key] || ACCENT_HEX.emerald;
}

const DAY_FMT = new Intl.DateTimeFormat("tr-TR", { weekday: "narrow" });
const DATE_FMT = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

const METRICS = [
  { key: "reviewedCount", label: "Tekrar" },
  { key: "addedCount", label: "Eklenen" },
];

function toDate(key) {
  return new Date(`${key}T12:00:00`);
}

/**
 * Premium, hafif (chart.js'siz) FSRS günlük aktivite kartı.
 * Son 14 günü zarif bar grafiğiyle, üstte canlı KPI'larla gösterir.
 */
export default function FsrsActivityCard({
  user,
  isAuthReady = true,
  accentThemeKey = "emerald",
  dueCountSnapshot = null,
}) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [metric, setMetric] = useState("reviewedCount");

  const hex = accentHex(accentThemeKey);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!isAuthReady) {
        setLoading(true);
        return;
      }
      if (!user?.uid) {
        setStats([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setHasError(false);
      try {
        const next = await getFsrsDailyStatsRange({ uid: user.uid, days: 30 });
        const hasSnap =
          dueCountSnapshot !== null &&
          dueCountSnapshot !== undefined &&
          Number.isFinite(Number(dueCountSnapshot));
        const patched =
          !hasSnap || !next.length
            ? next
            : next.map((item, i) =>
                i === next.length - 1
                  ? { ...item, dueCountSnapshot: Number(dueCountSnapshot) }
                  : item
              );
        if (active) setStats(patched);
      } catch (err) {
        console.error("FsrsActivityCard load error:", err);
        if (active) setHasError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user?.uid, isAuthReady, dueCountSnapshot]);

  const chartDays = useMemo(() => stats.slice(-14), [stats]);

  const derived = useMemo(() => {
    const last7 = stats.slice(-7);
    const reviewed7 = last7.reduce((s, d) => s + Number(d.reviewedCount || 0), 0);
    const activeDays = stats.filter(
      (d) => Number(d.reviewedCount || 0) > 0 || Number(d.addedCount || 0) > 0
    ).length;
    const today = stats[stats.length - 1] || {};
    const pending = Number(today.dueCountSnapshot || 0);

    // Mevcut seri (bugünden geriye kesintisiz aktif gün)
    let streak = 0;
    for (let i = stats.length - 1; i >= 0; i -= 1) {
      const d = stats[i];
      if (Number(d.reviewedCount || 0) > 0 || Number(d.addedCount || 0) > 0) streak += 1;
      else break;
    }
    return { reviewed7, activeDays, pending, streak };
  }, [stats]);

  const maxValue = useMemo(
    () => Math.max(1, ...chartDays.map((d) => Number(d[metric] || 0))),
    [chartDays, metric]
  );

  const hasAnyActivity = stats.some(
    (d) => Number(d.addedCount || 0) > 0 || Number(d.reviewedCount || 0) > 0
  );

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl md:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full blur-3xl"
        style={{ background: `${hex}14` }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[11px] font-black uppercase tracking-[0.22em]"
            style={{ color: hex }}
          >
            Tekrar Ritmin
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-white">
            Son 14 gün
          </h3>
        </div>

        {/* metrik toggle */}
        <div className="flex shrink-0 items-center rounded-full border border-white/10 bg-black/20 p-0.5">
          {METRICS.map((m) => {
            const on = metric === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMetric(m.key)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
                  on ? "text-slate-950" : "text-slate-400 hover:text-slate-200"
                }`}
                style={on ? { backgroundColor: hex } : undefined}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI şeridi */}
      <div className="relative mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "Seri", value: derived.streak, suffix: "gün", tone: "white" },
          { label: "Bu hafta", value: derived.reviewed7, suffix: "tekrar", tone: "accent" },
          { label: "Bekleyen", value: derived.pending, suffix: "soru", tone: "amber" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2.5 text-center"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
              {kpi.label}
            </p>
            <p
              className="mt-0.5 text-xl font-black tabular-nums leading-none"
              style={
                kpi.tone === "accent"
                  ? { color: hex }
                  : kpi.tone === "amber"
                  ? { color: "#fcd34d" }
                  : { color: "#ffffff" }
              }
            >
              {kpi.value}
            </p>
            <p className="mt-0.5 text-[9px] font-semibold text-slate-600">{kpi.suffix}</p>
          </div>
        ))}
      </div>

      {/* grafik */}
      <div className="relative mt-5">
        {loading && !stats.length ? (
          <div className="flex h-[132px] items-end gap-1.5">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 animate-pulse rounded-md bg-white/[0.05]"
                style={{ height: `${30 + ((i * 37) % 60)}%` }}
              />
            ))}
          </div>
        ) : hasError ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-200">
            İstatistikler şu an güncellenemedi. Çalışma akışın etkilenmez.
          </div>
        ) : !hasAnyActivity ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-7 text-center">
            <span className="text-2xl" aria-hidden="true">📊</span>
            <p className="mt-2 text-sm font-bold text-slate-300">Henüz aktivite yok</p>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Tekrar ettikçe günlük ritmin burada zarif bir grafikte birikir.
            </p>
          </div>
        ) : (
          <>
            <div className="flex h-[132px] items-end gap-1.5">
              {chartDays.map((d, i) => {
                const value = Number(d[metric] || 0);
                const pct = Math.round((value / maxValue) * 100);
                const date = toDate(d.date);
                const isToday = i === chartDays.length - 1;
                return (
                  <div
                    key={d.date}
                    className="group relative flex min-w-0 flex-1 flex-col items-center justify-end"
                    style={{ height: "100%" }}
                    title={`${DATE_FMT.format(date)} · ${value} ${
                      metric === "reviewedCount" ? "tekrar" : "eklenen"
                    }`}
                  >
                    <span className="mb-1 text-[9px] font-bold tabular-nums text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                      {value || ""}
                    </span>
                    <div
                      className="w-full rounded-md transition-all duration-300"
                      style={{
                        height: `${Math.max(value ? 6 : 3, pct)}%`,
                        background: value
                          ? `linear-gradient(to top, ${hex}, ${hex}cc)`
                          : "rgba(255,255,255,0.05)",
                        boxShadow: isToday && value ? `0 0 8px ${hex}40` : "none",
                        outline: isToday ? `1px solid ${hex}55` : "none",
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex gap-1.5">
              {chartDays.map((d, i) => {
                const date = toDate(d.date);
                const show = i % 2 === 0 || i === chartDays.length - 1;
                return (
                  <span
                    key={d.date}
                    className="min-w-0 flex-1 text-center text-[9px] font-bold uppercase text-slate-600"
                  >
                    {show ? DAY_FMT.format(date) : ""}
                  </span>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
