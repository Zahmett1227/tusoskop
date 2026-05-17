import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { auth, db } from "../firebase";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { accentThemes } from "../theme/accentThemes";
import { FREE_LIMITS, PLUS_LIMITS } from "../config/limits";
import { isUserPremium } from "../utils/premiumUtils";
import {
  buildChartRows,
  loadLocalExamHistory,
  mergeExamHistories,
  normalizeFirestoreResultDoc,
  normalizeLocalExamEntry,
  summarizeNetStats,
} from "../utils/examHistoryUtils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function useIsSmallScreen() {
  const [isSmall, setIsSmall] = useState(false);
  useEffect(() => {
    const update = () => setIsSmall(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return isSmall;
}

function chartStrokeForTheme(key) {
  if (key === "cyan") return "#22d3ee";
  if (key === "violet") return "#a78bfa";
  if (key === "amber") return "#fbbf24";
  return "#34d399";
}

export default function PerformanceChartCard({
  user,
  userData,
  accentTheme,
  accentThemeKey,
  onStartExam,
}) {
  const theme = accentTheme || accentThemes.emerald;
  const isSmallScreen = useIsSmallScreen();
  const [myTarget, setMyTarget] = useState(65);
  const [examHistoryMerged, setExamHistoryMerged] = useState([]);
  const premium = isUserPremium(userData);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;

    async function loadExamHistory() {
      const authed = auth.currentUser;
      if (!authed?.uid) return;
      try {
        const userDoc = await getDoc(doc(db, "users", authed.uid));
        if (userDoc.exists() && userDoc.data().targetScore) {
          setMyTarget(userDoc.data().targetScore);
        }

        const resultsQuery = query(
          collection(db, "results"),
          where("userId", "==", authed.uid),
          limit(120)
        );
        const querySnapshot = await getDocs(resultsQuery);
        const firestoreRows = querySnapshot.docs.map(normalizeFirestoreResultDoc);
        const localRaw = loadLocalExamHistory();
        const localRows = localRaw.map((row, i) => normalizeLocalExamEntry(row, i));
        const merged = mergeExamHistories(firestoreRows, localRows);
        merged.sort((a, b) => {
          const ta = a.rawDate ? new Date(a.rawDate).getTime() : Number.MAX_SAFE_INTEGER;
          const tb = b.rawDate ? new Date(b.rawDate).getTime() : Number.MAX_SAFE_INTEGER;
          if (ta !== tb) return ta - tb;
          return String(a.id ?? "").localeCompare(String(b.id ?? ""));
        });
        if (!active) return;
        setExamHistoryMerged(merged);
      } catch (error) {
        console.error("PerformanceChartCard load error:", error);
      }
    }

    loadExamHistory();
    const refresh = () => loadExamHistory();
    window.addEventListener("tusoskop-exam-saved", refresh);
    const onVis = () => {
      if (document.visibilityState === "visible") loadExamHistory();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      active = false;
      window.removeEventListener("tusoskop-exam-saved", refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user?.uid]);

  const sortedExamHistory = useMemo(() => {
    return [...examHistoryMerged].sort((a, b) => {
      const ta = a.rawDate ? new Date(a.rawDate).getTime() : Number.MAX_SAFE_INTEGER;
      const tb = b.rawDate ? new Date(b.rawDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (ta !== tb) return ta - tb;
      return String(a.id ?? "").localeCompare(String(b.id ?? ""));
    });
  }, [examHistoryMerged]);

  const performanceChart = useMemo(() => {
    const chartRows = buildChartRows(sortedExamHistory, {
      chartPointLimit: premium ? PLUS_LIMITS.visibleExamHistory : FREE_LIMITS.visibleExamHistory,
    });
    const summaryStats = summarizeNetStats(sortedExamHistory);
    const stroke = chartStrokeForTheme(accentThemeKey);

    if (chartRows.length === 0) {
      return { chartRows: [], summaryStats, chartData: null, lineOptions: null };
    }

    const labels = chartRows.map((r) => r.shortDate);
    const nets = chartRows.map((r) => r.tusNet);
    const targetLine = chartRows.map(() => myTarget);
    const pad = 14;
    const dataMin = Math.min(...nets, myTarget);
    const dataMax = Math.max(...nets, myTarget);
    const minY = Math.max(-55, dataMin - pad);
    const maxY = Math.min(210, dataMax + pad);

    const chartData = {
      labels,
      datasets: [
        {
          label: "TUS neti",
          data: nets,
          fill: true,
          borderColor: stroke,
          backgroundColor: `${stroke}22`,
          tension: 0.35,
          pointBackgroundColor: stroke,
          pointBorderColor: "#0f172a",
          pointBorderWidth: 2,
          pointRadius: isSmallScreen ? 3 : 4,
          pointHoverRadius: isSmallScreen ? 5 : 6,
        },
        {
          label: `Hedef net ${myTarget % 1 === 0 ? myTarget.toFixed(0) : myTarget.toFixed(2)}`,
          data: targetLine,
          borderColor: "rgba(248, 113, 113, 0.65)",
          backgroundColor: "transparent",
          borderDash: [6, 5],
          pointRadius: 0,
          fill: false,
          tension: 0,
        },
      ],
    };

    const lineOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: "#94a3b8",
            boxWidth: 10,
            font: { size: isSmallScreen ? 9 : 11 },
          },
        },
        tooltip: {
          filter: (tooltipItem) => tooltipItem.datasetIndex === 0,
          backgroundColor: "rgba(15, 23, 42, 0.96)",
          titleColor: "#f1f5f9",
          bodyColor: "#cbd5e1",
          borderColor: "rgba(148, 163, 184, 0.25)",
          borderWidth: 1,
          padding: 12,
          titleFont: { size: 13, weight: "600" },
          bodyFont: { size: 12 },
          callbacks: {
            title: (items) => {
              const i = items[0]?.dataIndex ?? 0;
              return chartRows[i]?.fullDate ?? "";
            },
            label: (item) => {
              if (item.datasetIndex !== 0) return null;
              const row = chartRows[item.dataIndex];
              if (!row) return "";
              return `TUS neti: ${row.tusNet}`;
            },
            afterLabel: (item) => {
              if (item.datasetIndex !== 0) return "";
              const row = chartRows[item.dataIndex];
              if (!row) return "";
              return `Doğru: ${row.correct}  Yanlış: ${row.wrong}  Boş: ${row.blank}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#64748b",
            maxRotation: isSmallScreen ? 50 : 35,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: isSmallScreen ? 5 : 12,
            font: { size: isSmallScreen ? 9 : 10, weight: "600" },
          },
        },
        y: {
          min: minY,
          max: maxY,
          grid: { color: "rgba(255,255,255,0.06)" },
          ticks: {
            color: "#64748b",
            font: { size: 10, weight: "600" },
          },
        },
      },
    };

    return { chartRows, summaryStats, chartData, lineOptions };
  }, [sortedExamHistory, myTarget, accentThemeKey, isSmallScreen, premium]);

  return (
    <div className="app-card relative min-w-0 overflow-hidden md:p-8">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6 min-w-0">
        <div className="min-w-0">
          <h3 className="text-lg md:text-xl font-black text-white tracking-tight mb-1">Deneme Performansı</h3>
          <p className="text-slate-500 text-xs md:text-sm font-medium">Kayıtlı deneme geçmişinde net değişimi</p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end shrink-0">
          <div className="rounded-2xl bg-slate-950/70 border border-slate-800 px-4 py-3 min-w-[88px]">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Son net</p>
            <p className={`text-xl font-black tabular-nums ${theme.text}`}>
              {performanceChart.summaryStats.last != null ? performanceChart.summaryStats.last : "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950/70 border border-slate-800 px-4 py-3 min-w-[88px]">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">En iyi net</p>
            <p className="text-xl font-black tabular-nums text-emerald-400">
              {performanceChart.summaryStats.best != null ? performanceChart.summaryStats.best : "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950/70 border border-slate-800 px-4 py-3 min-w-[88px]">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Ortalama net</p>
            <p className="text-xl font-black tabular-nums text-slate-200">
              {performanceChart.summaryStats.avg != null ? performanceChart.summaryStats.avg : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 min-w-0 w-full overflow-x-auto">
        {!premium && sortedExamHistory.length > FREE_LIMITS.visibleExamHistory && (
          <p className="text-xs text-slate-400 mb-3">
            Free planda son {FREE_LIMITS.visibleExamHistory} deneme gorunur. Plus ile tum gelisimini takip edebilirsin.
          </p>
        )}
        {sortedExamHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40">
            <span className="text-4xl mb-3" aria-hidden="true">📈</span>
            <p className="text-white font-black text-base mb-1">Henüz deneme verisi yok</p>
            <p className="text-slate-500 text-sm max-w-sm mb-6">
              Deneme çözdükçe TUS neti değişimin burada görünecek.
            </p>
            <button
              type="button"
              onClick={onStartExam}
              className={`px-8 py-3 rounded-2xl font-black text-sm ${theme.primary} ${theme.primaryHover} text-slate-950 shadow-lg ${theme.glow}`}
            >
              Deneme çöz
            </button>
          </div>
        ) : (
          <div className="h-[260px] md:h-[340px] w-full min-w-0 mx-auto">
            {performanceChart.chartData && performanceChart.lineOptions ? (
              <Line data={performanceChart.chartData} options={performanceChart.lineOptions} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
