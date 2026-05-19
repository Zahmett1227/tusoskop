import React from "react";
import { getSubjectRowSubtitle } from "../utils/smartReviewUtils";

function barColorClass(percent) {
  if (percent <= 40) return "bg-red-500";
  if (percent <= 60) return "bg-amber-500";
  return "bg-emerald-500";
}

function textColorClass(percent, isLightTheme) {
  if (percent <= 40) return isLightTheme ? "text-red-700" : "text-red-300";
  if (percent <= 60) return isLightTheme ? "text-amber-700" : "text-amber-300";
  return isLightTheme ? "text-emerald-700" : "text-emerald-300";
}

function InsightRow({ label, subtitle, count, totalCount, isLightTheme }) {
  const safeTotal = Math.max(1, Number(totalCount) || 1);
  const percent = Math.min(100, Math.round((Number(count) / safeTotal) * 100));

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`truncate text-sm font-bold ${isLightTheme ? "text-slate-900" : "text-white"}`}>
            {label}
          </p>
          {subtitle ? (
            <p className={`truncate text-xs font-medium ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
              {subtitle}
            </p>
          ) : null}
        </div>
        <span className={`shrink-0 text-xs font-black tabular-nums ${textColorClass(percent, isLightTheme)}`}>
          {count} soru
        </span>
      </div>
      <div className={`h-2 overflow-hidden rounded-full ${isLightTheme ? "bg-slate-200" : "bg-slate-800"}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColorClass(percent)}`}
          style={{ width: `${Math.max(4, percent)}%` }}
        />
      </div>
    </div>
  );
}

function PanelSkeleton({ isLightTheme, appCardShell }) {
  return (
    <section
      className={`${appCardShell} mb-6 animate-pulse p-5 md:p-6`}
      aria-busy="true"
      aria-label="Analiz yükleniyor"
    >
      <div className={`mb-4 h-6 w-28 rounded-full ${isLightTheme ? "bg-slate-200" : "bg-slate-800"}`} />
      <div className={`mb-6 h-8 w-48 rounded-lg ${isLightTheme ? "bg-slate-200" : "bg-slate-800"}`} />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className={`h-4 w-3/4 rounded ${isLightTheme ? "bg-slate-200" : "bg-slate-800"}`} />
            <div className={`h-2 w-full rounded-full ${isLightTheme ? "bg-slate-200" : "bg-slate-800"}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SmartReviewPanel({
  summary,
  isLightTheme = false,
  accentTheme,
  onStartReview,
  topicRows = [],
  loading = false,
  appCardShell = "app-card",
}) {
  if (loading) {
    return <PanelSkeleton isLightTheme={isLightTheme} appCardShell={appCardShell} />;
  }

  if (!summary) {
    return null;
  }

  const totalCount = Number(summary.totalCount) || 0;
  const dueCount = Number(summary.dueCount) || 0;
  const subjects = (summary.topSubjects || []).slice(0, 3);
  const topics =
    topicRows.length > 0
      ? topicRows.slice(0, 3)
      : (summary.topTopics || []).slice(0, 3).map((t) => ({ ...t, subtitle: "" }));

  const ringClass = accentTheme?.ring || "focus-visible:ring-violet-400/50";

  return (
    <section
      className={`${appCardShell} relative mb-6 overflow-hidden border p-5 md:p-6 ${
        isLightTheme
          ? "border-violet-200/80 bg-gradient-to-br from-white via-violet-50/40 to-fuchsia-50/30 shadow-md shadow-violet-100/50"
          : "border-violet-500/30 bg-gradient-to-br from-slate-950 via-violet-950/30 to-slate-900 shadow-xl shadow-black/25"
      }`}
      aria-labelledby="smart-review-panel-heading"
    >
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${
          isLightTheme ? "bg-violet-300/30" : "bg-violet-500/15"
        }`}
      />

      <div className="relative z-10">
        <div
          className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
            isLightTheme
              ? "border-violet-200 bg-violet-100/80 text-violet-800"
              : "border-violet-500/40 bg-violet-500/15 text-violet-200"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
          </span>
          AI Analiz
        </div>

        <h2
          id="smart-review-panel-heading"
          className={`text-xl font-black tracking-tight md:text-2xl ${isLightTheme ? "text-slate-950" : "text-white"}`}
        >
          Kör nokta analizin
        </h2>

        {topics.length > 0 && (
          <div className="mt-5">
            <p
              className={`mb-3 text-[10px] font-black uppercase tracking-[0.22em] ${
                isLightTheme ? "text-violet-700" : "text-violet-300"
              }`}
            >
              Öncelikli konular
            </p>
            <div className="space-y-3">
              {topics.map((item) => (
                <InsightRow
                  key={`topic-${item.name}`}
                  label={item.name}
                  subtitle={item.subtitle || item.ders || ""}
                  count={item.count}
                  totalCount={totalCount}
                  isLightTheme={isLightTheme}
                />
              ))}
            </div>
          </div>
        )}

        {subjects.length > 0 && (
          <div className="mt-5">
            <p
              className={`mb-3 text-[10px] font-black uppercase tracking-[0.22em] ${
                isLightTheme ? "text-violet-700" : "text-violet-300"
              }`}
            >
              Öncelikli dersler
            </p>
            <div className="space-y-3">
              {subjects.map((item) => (
                <InsightRow
                  key={`subject-${item.name}`}
                  label={item.name}
                  subtitle={getSubjectRowSubtitle(item)}
                  count={item.count}
                  totalCount={totalCount}
                  isLightTheme={isLightTheme}
                />
              ))}
            </div>
          </div>
        )}

        {topics.length === 0 && subjects.length === 0 && totalCount === 0 && (
          <p className={`mt-4 text-sm font-medium ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
            Henüz analiz verisi yok. Yanlış yaptığın sorular plana eklendikçe kör noktaların burada görünür.
          </p>
        )}

        <div
          className={`mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between ${
            isLightTheme ? "border-violet-100" : "border-violet-500/20"
          }`}
        >
          <p className={`text-sm font-bold ${isLightTheme ? "text-slate-700" : "text-slate-200"}`}>
            {dueCount > 0
              ? `Bugün ${dueCount} tekrar bekliyor`
              : "Bugün bekleyen tekrar yok"}
          </p>
          {dueCount > 0 && typeof onStartReview === "function" ? (
            <button
              type="button"
              onClick={onStartReview}
              className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${ringClass} ${
                isLightTheme ? "focus-visible:ring-offset-violet-50" : "focus-visible:ring-offset-slate-950"
              }`}
            >
              Tekrara Başla →
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
