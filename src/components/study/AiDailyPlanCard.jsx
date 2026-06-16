import { useEffect, useState } from "react";
import { getDailyStudyPlan } from "../../services/aiStudyPlanService";

const TYPE_META = {
  fsrs_review:          { label: "FSRS Tekrarı",     icon: "🔁", accent: "emerald" },
  weak_topic_test:      { label: "Zayıf Konu",       icon: "🎯", accent: "rose"    },
  mixed_test:           { label: "Karma Test",        icon: "📚", accent: "cyan"    },
  rest_or_light_review: { label: "Hafif Çalışma",    icon: "☕", accent: "slate"   },
};

const ACCENT_CLASSES = {
  emerald: { dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  rose:    { dot: "bg-rose-400",    badge: "bg-rose-500/10 text-rose-300 border-rose-500/20"         },
  cyan:    { dot: "bg-cyan-400",    badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"         },
  slate:   { dot: "bg-slate-500",   badge: "bg-slate-700/50 text-slate-400 border-slate-600/30"     },
};

const RISK_META = {
  overdue_fsrs_accumulation: { label: "Gecikmiş tekrarlar birikiyor", icon: "⏰", cls: "border-amber-500/25 bg-amber-500/8 text-amber-400" },
  weak_topic_neglect:        { label: "Zayıf konular ihmal ediliyor",  icon: "📉", cls: "border-orange-500/25 bg-orange-500/8 text-orange-400" },
  low_activity:              { label: "Son günlerde az çalışma",       icon: "💤", cls: "border-slate-600/40 bg-slate-700/20 text-slate-400"  },
  none: null,
};

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[0.75, 0.9, 0.6].map((w, i) => (
        <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-800" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 rounded-full bg-slate-700" style={{ width: `${w * 100}%` }} />
              <div className="h-2.5 rounded-full bg-slate-800" style={{ width: `${w * 60}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanItem({ item, index, theme, onStartFsrs, onStartTopicTest }) {
  const [open, setOpen] = useState(false);
  const meta = TYPE_META[item.type] ?? { label: item.type, icon: "📋", accent: "slate" };
  const colors = ACCENT_CLASSES[meta.accent];

  const canStart = (item.type === "fsrs_review" && onStartFsrs) ||
                   (item.type === "weak_topic_test" && onStartTopicTest);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 transition-colors hover:border-slate-700/80">
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${colors.dot}`} />
      <div className="px-4 py-3.5 pl-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-slate-400 tabular-nums">
              {index + 1}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${colors.badge}`}>
              {meta.icon} {meta.label}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 shrink-0">
            {item.questionCount} soru · {item.estimatedMinutes} dk
          </span>
        </div>

        <p className="text-sm font-bold leading-snug text-white mb-1">{item.title}</p>

        {(item.lesson || item.topic) && (
          <p className="text-xs text-slate-500 mb-2">
            {[item.lesson, item.topic].filter(Boolean).join(" › ")}
          </p>
        )}

        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-400 transition-colors mb-1"
        >
          <svg viewBox="0 0 24 24" className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Neden önerildi?
        </button>

        {open && (
          <p className="text-[11px] leading-relaxed text-slate-500 border-l-2 border-slate-700 pl-3 mb-2">
            {item.reason}
          </p>
        )}

        {canStart && (
          <button
            type="button"
            onClick={() => {
              if (item.type === "fsrs_review") onStartFsrs();
              else onStartTopicTest(item.lesson, item.topic);
            }}
            className={`mt-1 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition-all active:scale-95 ${
              item.type === "fsrs_review"
                ? `${theme.primary} ${theme.primaryHover} text-slate-950 shadow-md ${theme.glow}`
                : "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/20"
            }`}
          >
            {item.type === "fsrs_review" ? "Tekrara Başla" : "Bu Konudan Test Oluştur"}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className="h-3 w-3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function AiDailyPlanCard({ user, theme, onStartFsrs, onStartTopicTest }) {
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
      .then((result) => { if (!cancelled) setPlan(result); })
      .catch((err) => {
        if (cancelled) return;
        if (err?.isPremiumRequired) setIsPremiumRequired(true);
        else { console.error("[AiDailyPlanCard]", err); setError(err?.message ?? "Plan yüklenemedi."); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.uid]);

  const riskInfo = plan ? RISK_META[plan.recommendation.risk] : null;
  const totalMinutes = plan?.recommendation.dailyPlan?.reduce((s, i) => s + i.estimatedMinutes, 0) ?? 0;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-black/40">
      <div className="relative overflow-hidden px-5 pt-5 pb-4 border-b border-slate-800/60">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-5 bottom-0 h-24 w-40 rounded-full bg-cyan-500/8 blur-2xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 border border-violet-500/25 text-lg shadow-inner">
              ✨
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-400">AI Destekli</p>
              <h2 className="text-base font-black text-white leading-tight">Bugünkü Akıllı Planın</h2>
            </div>
          </div>
          {plan && totalMinutes > 0 && (
            <div className="shrink-0 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-right">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tahmini</p>
              <p className="text-sm font-black text-white">{totalMinutes} dk</p>
            </div>
          )}
        </div>

        {riskInfo && (
          <div className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 ${riskInfo.cls}`}>
            <span className="text-sm shrink-0">{riskInfo.icon}</span>
            <p className="text-[11px] font-semibold">{riskInfo.label}</p>
          </div>
        )}
      </div>

      <div className="px-5 py-4 space-y-3">
        {loading && <Skeleton />}

        {!loading && isPremiumRequired && (
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/8 to-cyan-500/5 px-5 py-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 border border-violet-500/25 text-2xl">⭐</div>
            <p className="text-sm font-black text-white">Premium özellik</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400 max-w-xs mx-auto">
              AI destekli günlük plan, FSRS verilerin ve konu yeterlilik düzeyini analiz ederek
              kişiselleştirilmiş bir çalışma yolu oluşturur. Yalnızca premium üyelere sunulmaktadır.
            </p>
          </div>
        )}

        {!loading && !isPremiumRequired && error && (
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 px-4 py-5 text-center">
            <p className="text-xs font-semibold text-slate-500">Plan şu an yüklenemiyor</p>
          </div>
        )}

        {!loading && !isPremiumRequired && !error && !plan && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-5 text-center">
            <p className="text-xs text-slate-500">Plan için giriş yapman gerekiyor.</p>
          </div>
        )}

        {!loading && !error && plan && (
          <>
            {plan.recommendation.dailyPlan.map((item, i) => (
              <PlanItem
                key={`${item.type}-${i}`}
                item={item}
                index={i}
                theme={theme}
                onStartFsrs={item.type === "fsrs_review" ? onStartFsrs : null}
                onStartTopicTest={item.type === "weak_topic_test" ? onStartTopicTest : null}
              />
            ))}

            {(plan.recommendation.summary || plan.recommendation.motivationMessage) && (
              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 px-4 py-3.5 space-y-2">
                {plan.recommendation.summary && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Bugünkü hedef</p>
                    <p className="text-xs leading-relaxed text-slate-300">{plan.recommendation.summary}</p>
                  </div>
                )}
                {plan.recommendation.motivationMessage && (
                  <p className="text-xs leading-relaxed text-violet-400/80 border-t border-slate-800 pt-2">
                    {plan.recommendation.motivationMessage}
                  </p>
                )}
              </div>
            )}

            {plan.status === "fallback" && (
              <p className="text-[10px] text-slate-700 text-right pr-1">AI erişilemedi · Akıllı varsayılan plan</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
