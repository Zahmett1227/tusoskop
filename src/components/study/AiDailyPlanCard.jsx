/**
 * AiDailyPlanCard — displays the AI-generated daily study plan.
 * Dark-theme, mobile-first, shows each plan step with lesson/topic,
 * question count, estimated minutes and "why this was recommended".
 */

import { useEffect, useState } from "react";
import { getDailyStudyPlan } from "../../services/aiStudyPlanService";

const TYPE_META = {
  fsrs_review: { label: "FSRS Tekrarı", emoji: "🔁" },
  weak_topic_test: { label: "Zayıf Konu Testi", emoji: "🎯" },
  mixed_test: { label: "Karma Test", emoji: "📚" },
  rest_or_light_review: { label: "Hafif Çalışma", emoji: "☕" },
};

const RISK_META = {
  overdue_fsrs_accumulation: {
    label: "Gecikmiş tekrarlar birikiyor",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/25",
  },
  weak_topic_neglect: {
    label: "Zayıf konular ihmal ediliyor",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/25",
  },
  low_activity: {
    label: "Son günlerde az çalışma",
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-600/25",
  },
  none: null,
};

function PlanItemSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 animate-pulse">
      <div className="h-4 w-2/3 rounded bg-slate-700" />
      <div className="h-3 w-1/3 rounded bg-slate-800" />
      <div className="h-3 w-4/5 rounded bg-slate-800" />
    </div>
  );
}

function PlanItem({ item, index, theme, onStartFsrs, onStartTopicTest }) {
  const [open, setOpen] = useState(false);
  const meta = TYPE_META[item.type] ?? { label: item.type, emoji: "📋" };

  const canStartFsrs = item.type === "fsrs_review" && onStartFsrs;
  const canStartTopic = item.type === "weak_topic_test" && onStartTopicTest;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex-shrink-0 text-base leading-none" aria-hidden="true">
          {meta.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {index + 1}. {meta.label}
            </span>
          </div>
          <p className="text-sm font-bold mt-0.5 leading-snug">{item.title}</p>
          {(item.lesson || item.topic) && (
            <p className="text-xs text-slate-400 mt-0.5">
              {[item.lesson, item.topic].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs font-semibold text-slate-300">
              {item.questionCount} soru
            </span>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-slate-400">{item.estimatedMinutes} dk</span>
          </div>
        </div>
      </div>

      {/* "Why" accordion */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        <span>{open ? "▲" : "▼"}</span>
        <span>Neden önerildi?</span>
      </button>
      {open && (
        <p className="text-xs text-slate-400 leading-relaxed pl-1 border-l-2 border-slate-700">
          {item.reason}
        </p>
      )}

      {/* Action buttons */}
      {(canStartFsrs || canStartTopic) && (
        <div className="pt-1">
          {canStartFsrs && (
            <button
              type="button"
              onClick={() => onStartFsrs()}
              className={`min-h-9 px-4 rounded-xl text-xs font-black ${theme.primary} ${theme.primaryHover} text-slate-950 shadow-md ${theme.glow}`}
            >
              FSRS'e Başla
            </button>
          )}
          {canStartTopic && (
            <button
              type="button"
              onClick={() => onStartTopicTest(item.lesson, item.topic)}
              className={`min-h-9 px-4 rounded-xl text-xs font-black ${theme.primary} ${theme.primaryHover} text-slate-950 shadow-md ${theme.glow}`}
            >
              Bu Konudan Test Oluştur
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AiDailyPlanCard({
  user,
  theme,
  onStartFsrs,
  onStartTopicTest,
}) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPremiumRequired, setIsPremiumRequired] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setIsPremiumRequired(false);
    getDailyStudyPlan()
      .then((result) => {
        if (!cancelled) setPlan(result);
      })
      .catch((err) => {
        if (!cancelled) {
          if (err?.isPremiumRequired) {
            setIsPremiumRequired(true);
          } else {
            console.error("[AiDailyPlanCard] getDailyStudyPlan error:", err);
            setError(err?.message ?? "Plan yüklenemedi.");
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const riskInfo = plan ? RISK_META[plan.recommendation.risk] : null;

  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">✨</span>
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${theme.text}`}>
            AI Destekli
          </p>
          <h2 className="text-lg font-black leading-tight">Bugünkü Akıllı Planın</h2>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-3">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            <PlanItemSkeleton />
            <PlanItemSkeleton />
          </div>
        )}

        {/* Premium required */}
        {!loading && isPremiumRequired && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-5 text-center">
            <p className="text-2xl mb-2" aria-hidden="true">⭐</p>
            <p className="text-sm font-bold text-amber-400">Premium özellik</p>
            <p className="text-xs text-slate-400 mt-1">
              AI destekli günlük plan yalnızca premium kullanıcılara sunulmaktadır.
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && !isPremiumRequired && error && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/50 px-4 py-6 text-center">
            <p className="text-sm text-slate-400">Plan yüklenemedi.</p>
            <p className="text-xs text-slate-600 mt-1">{error}</p>
          </div>
        )}

        {/* Empty / unauthenticated */}
        {!loading && !isPremiumRequired && !error && !plan && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-center">
            <p className="text-sm text-slate-400">Plan oluşturmak için giriş yapman gerekiyor.</p>
          </div>
        )}

        {/* Plan items */}
        {!loading && !error && plan && (
          <>
            {plan.recommendation.dailyPlan.map((item, i) => (
              <PlanItem
                key={`${item.type}-${i}`}
                item={item}
                index={i}
                theme={theme}
                onStartFsrs={item.type === "fsrs_review" ? onStartFsrs : null}
                onStartTopicTest={
                  item.type === "weak_topic_test" ? onStartTopicTest : null
                }
              />
            ))}

            {/* Summary */}
            {plan.recommendation.summary && (
              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Bugünkü hedef
                </p>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {plan.recommendation.summary}
                </p>
              </div>
            )}

            {/* Motivation */}
            {plan.recommendation.motivationMessage && (
              <p className={`text-xs leading-relaxed ${theme.text} opacity-80`}>
                {plan.recommendation.motivationMessage}
              </p>
            )}

            {/* Risk badge */}
            {riskInfo && (
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${riskInfo.bg}`}>
                <span className="text-sm" aria-hidden="true">⚠️</span>
                <p className={`text-xs font-semibold ${riskInfo.color}`}>
                  {riskInfo.label}
                </p>
              </div>
            )}

            {/* Fallback notice */}
            {plan.status === "fallback" && (
              <p className="text-[10px] text-slate-600 text-right">
                AI erişilemedi · Akıllı varsayılan plan gösteriliyor
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
