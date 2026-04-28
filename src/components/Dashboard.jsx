import React, { useEffect, useMemo, useState } from "react";
import { db, auth } from "../firebase";
import {
  doc, getDoc, setDoc, collection, query,
  where, limit, getDocs,
} from "firebase/firestore";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

import SubjectCard from "./SubjectCard";
import TusCountDown from "./TusCountDown";
import StreakBadge from "./StreakBadge";
import { SUBJECTS } from "../data/subjects";
import { QUESTIONS } from "../data/questions";
import { accentThemes } from "../theme/accentThemes";
import {
  mergeExamHistories,
  normalizeFirestoreResultDoc,
  normalizeLocalExamEntry,
  buildChartRows,
  summarizeNetStats,
  loadLocalExamHistory,
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

export default function Dashboard({
  setView,
  startSubject,
  user,
  onLogout,
  accentTheme,
  accentThemeKey,
  onAccentThemeChange,
  /** App içinden gelen görünüm — dashboard’a her dönüşte geçmiş yenilenebilir */
  currentView = "dashboard",
}) {
  const theme = accentTheme || accentThemes.emerald;
  const isSmallScreen = useIsSmallScreen();
  const [myTarget, setMyTarget] = useState(65.00);
  const [tempTarget, setTempTarget] = useState(65.00);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [examHistoryMerged, setExamHistoryMerged] = useState([]);
  const subjectCounts = useMemo(() => {
    const counts = {};
    QUESTIONS.forEach((item) => {
      counts[item.ders] = (counts[item.ders] || 0) + 1;
    });
    return counts;
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    async function loadExamHistory() {
      const authed = auth.currentUser;
      if (!authed?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, "users", authed.uid));
        if (userDoc.exists() && userDoc.data().targetScore) {
          const target = userDoc.data().targetScore;
          setMyTarget(target);
          setTempTarget(target);
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

        setExamHistoryMerged(merged);
      } catch (err) {
        console.error("Dashboard veri hatası:", err);
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
      window.removeEventListener("tusoskop-exam-saved", refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user?.uid, currentView]);

  const sortedExamHistory = useMemo(() => {
    return [...examHistoryMerged].sort((a, b) => {
      const ta = a.rawDate ? new Date(a.rawDate).getTime() : Number.MAX_SAFE_INTEGER;
      const tb = b.rawDate ? new Date(b.rawDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (ta !== tb) return ta - tb;
      return String(a.id ?? "").localeCompare(String(b.id ?? ""));
    });
  }, [examHistoryMerged]);

  const performanceChart = useMemo(() => {
    const chartRows = buildChartRows(sortedExamHistory, { chartPointLimit: 20 });
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
              const i = item.dataIndex;
              const row = chartRows[i];
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
  }, [sortedExamHistory, myTarget, accentThemeKey, isSmallScreen]);

  const adjustTarget = (amount) => {
    setTempTarget(prev => {
      const val = parseFloat(prev) + amount;
      return parseFloat(val.toFixed(2));
    });
  };

  const saveTarget = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      await setDoc(doc(db, "users", currentUser.uid), {
        targetScore: tempTarget
      }, { merge: true });
      setMyTarget(tempTarget);
      setIsEditingTarget(false);
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  return (
    <div
      className={`min-h-dvh bg-slate-950 text-white px-4 py-6 md:px-8 md:py-10 font-sans ${theme.softBg}`}
      style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}
    >
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-10 gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🩺</span>
            <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${theme.text}`}>TUSOSKOP</h1>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {Object.keys(accentThemes).map((key) => {
              const t = accentThemes[key];
              const active = accentThemeKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onAccentThemeChange?.(key)}
                  className={`w-8 h-8 rounded-full ${t.primary} border-2 transition-all ${active ? "border-white scale-110" : "border-slate-700 hover:border-slate-500"}`}
                  title={t.name}
                  aria-label={`${t.name} teması`}
                />
              );
            })}
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-xs font-bold hidden sm:block truncate max-w-[160px]">
                {user.displayName || user.email}
              </span>
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-bold transition-all"
              >
                Çıkış
              </button>
            </div>
          )}
        </header>
        <div className="md:hidden flex items-center justify-center gap-2 mb-6">
          {Object.keys(accentThemes).map((key) => {
            const t = accentThemes[key];
            const active = accentThemeKey === key;
            return (
              <button
                key={`mobile-${key}`}
                type="button"
                onClick={() => onAccentThemeChange?.(key)}
                className={`w-7 h-7 rounded-full ${t.primary} border transition-all ${active ? "border-white scale-110" : "border-slate-700"}`}
                title={t.name}
                aria-label={`${t.name} teması`}
              />
            );
          })}
        </div>

        {/* ÜST SATIR: GERİ SAYIM + HEDEF + SERİ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <TusCountDown />

          <StreakBadge userId={user?.uid} />

          {/* Hedef Paneli */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col justify-center">
            {isEditingTarget ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => adjustTarget(-0.25)} className="w-12 h-12 rounded-full bg-slate-800 text-rose-400 text-2xl font-bold hover:bg-rose-500/10 transition-all">-</button>
                  <div className="text-center">
                    <span className="text-4xl font-black text-white">{tempTarget.toFixed(2)}</span>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Hedef Netin</p>
                  </div>
                  <button onClick={() => adjustTarget(0.25)} className={`w-12 h-12 rounded-full bg-slate-800 ${theme.text} text-2xl font-bold ${theme.softBg} transition-all`}>+</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveTarget} className={`flex-1 ${theme.primary} ${theme.primaryHover} text-slate-950 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg ${theme.glow}`}>KAYDET</button>
                  <button onClick={() => setIsEditingTarget(false)} className="px-4 py-3 bg-slate-800 text-slate-400 rounded-2xl font-bold text-sm">İPTAL</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setIsEditingTarget(true)} className="group cursor-pointer text-center">
                <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mb-1">Kişisel Hedefin</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl font-black text-white tracking-tighter">{myTarget.toFixed(2)}</span>
                  <span className={`${theme.text} text-xl animate-pulse`}>✎</span>
                </div>
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-wider mt-2">Düzenlemek için tıkla</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            HERO: DENEME KARTI — sitenin en değerli özelliği
        ═══════════════════════════════════════════════════════ */}
        <div
          onClick={() => setView("examSetSelect")}
          className={`group relative overflow-hidden rounded-[3rem] border ${theme.softBorder} bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900/80 p-8 md:p-10 mb-6 cursor-pointer hover:border-slate-500/70 transition-all duration-500`}
        >
          {/* Arka plan ışıltısı */}
          <div className={`absolute -top-20 -right-20 w-72 h-72 ${theme.softBg} rounded-full blur-3xl transition-all duration-700 pointer-events-none`} />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8">

            {/* Sol: Başlık + özellikler */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full ${theme.softBg} border ${theme.softBorder} ${theme.text} text-[10px] font-black uppercase tracking-widest`}>
                  Akıllı Deneme Sistemi
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                TUS Denemesi Çöz
              </h2>
              <p className="text-slate-400 text-sm md:text-base mb-6 max-w-md">
                200 soruluk gerçek TUS formatında deneme. Bitirince sana özel derin analiz ve tahmini puan raporu hazırlanır.
              </p>

              {/* Özellik etiketleri */}
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { icon: "📊", label: "Ders bazlı başarı analizi" },
                  { icon: "🎯", label: "Tahmini TUS puanı" },
                  { icon: "⚠️", label: "Zayıf konu tespiti" },
                  { icon: "☁️", label: "Buluta otomatik kayıt" },
                ].map(f => (
                  <span key={f.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold">
                    <span>{f.icon}</span> {f.label}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl ${theme.primary} text-slate-950 font-black text-lg shadow-lg ${theme.glow} group-hover:scale-[1.03] transition-transform duration-300`}>
                  Denemeyi Başlat
                  <span className="text-xl">→</span>
                </div>
                <span className="text-slate-600 text-xs font-bold uppercase tracking-wider">200 Soru • ~150 dk</span>
              </div>
            </div>

            {/* Sağ: Analiz önizlemesi (sahte ama gerçekçi) */}
            <div className="lg:w-72 shrink-0">
              <div className="bg-slate-950/70 border border-slate-800 rounded-[2rem] p-5 backdrop-blur-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${theme.primary} animate-ping inline-block`} />
                  Deneme Sonu Analiz Ekranı
                </p>

                {/* Sahte net kartları */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "Doğru", val: "89", color: "text-emerald-400" },
                    { label: "Yanlış", val: "21", color: "text-rose-400" },
                    { label: "Net", val: "83.75", color: "text-cyan-400" },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-900 rounded-xl p-2.5 text-center">
                      <p className="text-[9px] text-slate-500 font-black uppercase">{s.label}</p>
                      <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* Sahte ders satırları */}
                <div className="space-y-2">
                  {[
                    { ders: "Dahiliye", oran: 82 },
                    { ders: "Patoloji", oran: 61 },
                    { ders: "Farmakoloji", oran: 44 },
                  ].map(r => (
                    <div key={r.ders} className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 w-20 shrink-0">{r.ders}</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${r.oran >= 65 ? 'bg-emerald-500' : r.oran >= 45 ? 'bg-cyan-400' : 'bg-rose-500'}`}
                          style={{ width: `${r.oran}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold w-8 text-right">%{r.oran}</span>
                    </div>
                  ))}
                  <p className="text-[9px] text-slate-600 text-center pt-1 italic">+ tüm branşlar...</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Deneme performans grafiği */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-6 md:p-8 mb-6 relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 p-6 opacity-[0.04] text-6xl font-black tracking-tighter select-none pointer-events-none">
            CHART
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6 min-w-0">
            <div className="min-w-0">
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight mb-1">
                Deneme Performansı
              </h3>
              <p className="text-slate-500 text-xs md:text-sm font-medium">
                Son denemelerde TUS neti değişimi (grafikte son 20 deneme)
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end shrink-0">
              <div className="rounded-2xl bg-slate-950/70 border border-slate-800 px-4 py-3 min-w-[88px]">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Son net
                </p>
                <p className={`text-xl font-black tabular-nums ${theme.text}`}>
                  {performanceChart.summaryStats.last != null
                    ? performanceChart.summaryStats.last
                    : "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950/70 border border-slate-800 px-4 py-3 min-w-[88px]">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  En iyi net
                </p>
                <p className="text-xl font-black tabular-nums text-emerald-400">
                  {performanceChart.summaryStats.best != null
                    ? performanceChart.summaryStats.best
                    : "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950/70 border border-slate-800 px-4 py-3 min-w-[88px]">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Ortalama net
                </p>
                <p className="text-xl font-black tabular-nums text-slate-200">
                  {performanceChart.summaryStats.avg != null
                    ? performanceChart.summaryStats.avg
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 min-w-0 w-full overflow-x-auto">
            {sortedExamHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40">
                <span className="text-4xl mb-3" aria-hidden="true">
                  📈
                </span>
                <p className="text-white font-black text-base mb-1">
                  Henüz deneme verisi yok
                </p>
                <p className="text-slate-500 text-sm max-w-sm mb-6">
                  Deneme çözdükçe TUS netin burada görünecek.
                </p>
                <button
                  type="button"
                  onClick={() => setView("examSetSelect")}
                  className={`px-8 py-3 rounded-2xl font-black text-sm ${theme.primary} ${theme.primaryHover} text-slate-950 shadow-lg ${theme.glow}`}
                >
                  Deneme çöz
                </button>
              </div>
            ) : (
              <div className="h-[260px] md:h-[340px] w-full min-w-0 mx-auto">
                {performanceChart.chartData && performanceChart.lineOptions ? (
                  <Line
                    data={performanceChart.chartData}
                    options={performanceChart.lineOptions}
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* İKİNCİL AKSİYONLAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <button
            onClick={() => setView("questionSetup")}
            className="group flex items-center gap-4 px-6 py-5 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all text-left"
          >
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-black text-sm text-white">Hızlı Soru Çöz</p>
              <p className="text-[10px] text-slate-500 font-medium">Konu & branş seç</p>
            </div>
          </button>
          <button
            onClick={() => setView("tracker")}
            className="group flex items-center gap-4 px-6 py-5 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all text-left"
          >
            <span className="text-2xl">📚</span>
            <div>
              <p className="font-black text-sm text-white">Konu Haritam</p>
              <p className="text-[10px] text-slate-500 font-medium">İlerlemeyi takip et</p>
            </div>
          </button>
          <button
            onClick={() => setView("suggestions")}
            className="group flex items-center gap-4 px-6 py-5 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all text-left"
          >
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-black text-sm text-white">Öneriler</p>
              <p className="text-[10px] text-slate-500 font-medium">Strateji & tavsiyeler</p>
            </div>
          </button>
        </div>

        {/* BRANŞLAR */}
        {["Temel", "Klinik"].map((type) => (
          <section key={type} className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{type} Bilimler</h2>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SUBJECTS.filter((s) => s.type === type).map((s) => (
                <SubjectCard
                  key={s.name}
                  subject={s}
                  count={subjectCounts[s.name] || 0}
                  accentTheme={theme}
                  onClick={() => startSubject(s.name)}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Alt navigasyon bar için boşluk — sadece mobil */}
        <div
          className="md:hidden"
          style={{ height: "calc(4.5rem + env(safe-area-inset-bottom))" }}
          aria-hidden="true"
        />

      </div>
    </div>
  );
}
