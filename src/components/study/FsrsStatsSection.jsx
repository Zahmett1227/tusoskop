import React, { useEffect, useMemo, useState } from "react";
import { getFsrsDailyStatsRange } from "../../services/fsrsStatsService";
import FsrsTodaySummaryCard from "./FsrsTodaySummaryCard";
import FsrsWeeklyChart from "./FsrsWeeklyChart";
import FsrsThirtyDayHeatmap from "./FsrsThirtyDayHeatmap";

export default function FsrsStatsSection({
  user,
  isAuthReady = true,
  accentTheme,
  dueCountSnapshot = null,
}) {
  const [stats30, setStats30] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      if (!isAuthReady) {
        setLoading(true);
        return;
      }

      if (!user?.uid) {
        setStats30([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setHasError(false);
      try {
        const nextStats = await getFsrsDailyStatsRange({ uid: user.uid, days: 30 });
        const hasDueSnapshot =
          dueCountSnapshot !== null &&
          dueCountSnapshot !== undefined &&
          Number.isFinite(Number(dueCountSnapshot));
        const patched =
          !hasDueSnapshot || !nextStats.length
            ? nextStats
            : nextStats.map((item, index) =>
                index === nextStats.length - 1
                  ? { ...item, dueCountSnapshot: Number(dueCountSnapshot) }
                  : item
              );
        if (active) setStats30(patched);
      } catch (error) {
        console.error("FsrsStatsSection load error:", error);
        if (active) setHasError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStats();
    return () => {
      active = false;
    };
  }, [user?.uid, isAuthReady, dueCountSnapshot]);

  const today = stats30[stats30.length - 1] || null;
  const stats7 = useMemo(() => stats30.slice(-7), [stats30]);
  const hasAnyActivity = stats30.some(
    (item) =>
      Number(item.addedCount || 0) > 0 ||
      Number(item.reviewedCount || 0) > 0 ||
      Number(item.dueCountSnapshot || 0) > 0
  );

  return (
    <section className="space-y-3">
      <FsrsTodaySummaryCard
        stats={today}
        accentTheme={accentTheme}
        loading={loading && !stats30.length}
      />

      {hasError && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-200">
          FSRS istatistikleri şu an güncellenemedi. Çalışma akışın etkilenmez.
        </div>
      )}

      {!loading && !hasAnyActivity && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/45 px-4 py-3 text-xs text-slate-500">
          Henüz günlük FSRS aktivitesi yok. Yanlışlar, favoriler ve manuel değerlendirmeler burada birikecek.
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <FsrsWeeklyChart stats={stats7} accentTheme={accentTheme} />
        <FsrsThirtyDayHeatmap stats={stats30} />
      </div>
    </section>
  );
}

