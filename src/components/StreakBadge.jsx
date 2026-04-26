import React, { useEffect, useState } from "react";
import { getStreak } from "../services/streakService";

const MILESTONES = [
  { days: 100, emoji: "💎", label: "100 Gün", color: "from-cyan-400 to-blue-500", glow: "shadow-cyan-500/40", border: "border-cyan-500/40", bg: "bg-cyan-500/10" },
  { days: 30,  emoji: "🏆", label: "30 Gün",  color: "from-yellow-400 to-amber-500", glow: "shadow-yellow-500/40", border: "border-yellow-500/40", bg: "bg-yellow-500/10" },
  { days: 7,   emoji: "⭐", label: "7 Gün",   color: "from-orange-400 to-rose-500", glow: "shadow-orange-500/40", border: "border-orange-500/40", bg: "bg-orange-500/10" },
];

const NEXT_MILESTONE = [7, 30, 100];

export default function StreakBadge({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getStreak(userId).then((d) => { setData(d); setLoading(false); });
  }, [userId]);

  if (loading) {
    return (
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/60 p-5 animate-pulse h-28" />
    );
  }

  const streak = data?.currentStreak ?? 0;
  const longest = data?.longestStreak ?? 0;
  const isActive = streak > 0;
  const milestone = MILESTONES.find((m) => streak >= m.days);
  const nextMilestone = NEXT_MILESTONE.find((d) => streak < d) ?? 100;
  const progress = Math.min((streak / nextMilestone) * 100, 100);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative overflow-hidden rounded-[2rem] border p-5 flex flex-col gap-3
        transition-all duration-500 cursor-default select-none
        ${isActive
          ? `border-orange-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30
             ${hovered ? 'shadow-[0_0_40px_rgba(249,115,22,0.18)] border-orange-500/50 -translate-y-0.5' : 'shadow-[0_0_20px_rgba(249,115,22,0.07)]'}`
          : `border-slate-800 bg-slate-900/60
             ${hovered ? 'border-slate-700 -translate-y-0.5' : ''}`
        }
      `}
    >
      {/* Arka plan ışıltısı — sadece aktifken */}
      {isActive && (
        <div className={`absolute -top-8 -right-8 w-36 h-36 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${hovered ? 'bg-orange-500/20 scale-125' : 'bg-orange-500/10'}`} />
      )}

      {/* Üst: ikon + streak sayısı */}
      <div className="relative z-10 flex items-center gap-4">
        {/* Ateş kutusu */}
        <div className={`
          relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl shrink-0
          transition-all duration-500
          ${isActive
            ? `bg-gradient-to-br from-orange-500/20 to-rose-500/10 border border-orange-500/30
               ${hovered ? 'scale-110 shadow-lg shadow-orange-500/30' : ''}`
            : 'bg-slate-800/60 border border-slate-700'
          }
        `}>
          <span className={`text-2xl transition-all duration-300 ${hovered && isActive ? 'scale-125' : ''} ${isActive ? '' : 'grayscale opacity-30'}`}>
            🔥
          </span>
          {/* Ping efekti — aktif ve hover'da */}
          {isActive && hovered && (
            <span className="absolute inset-0 rounded-2xl border border-orange-500/50 animate-ping" />
          )}
        </div>

        {/* Sayı ve başlık */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-black tabular-nums leading-none transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-600'}`}>
              {streak}
            </span>
            {isActive && (
              <span className="text-orange-400 text-sm font-bold leading-none">günlük seri</span>
            )}
          </div>
          <p className={`text-xs mt-0.5 font-medium transition-colors duration-300 ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
            {isActive ? `En uzun: ${longest} gün` : 'Bugün bir soru çöz, serin başlasın!'}
          </p>
        </div>

        {/* Milestone rozeti — sağ üst */}
        {milestone && (
          <div className={`
            shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl
            border ${milestone.border} ${milestone.bg}
            transition-all duration-300
            ${hovered ? 'scale-105 shadow-lg ' + milestone.glow : ''}
          `}>
            <span className="text-lg">{milestone.emoji}</span>
            <span className={`text-[9px] font-black uppercase tracking-wider bg-gradient-to-r ${milestone.color} bg-clip-text text-transparent`}>
              {milestone.label}
            </span>
          </div>
        )}
      </div>

      {/* Alt: ilerleme çubuğu */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {milestone ? 'Sonraki hedef' : `${nextMilestone} gün hedefi`}
          </span>
          <span className="text-[10px] font-black text-slate-500 tabular-nums">
            {streak}/{milestone ? NEXT_MILESTONE.find(d => d > streak) ?? '✓' : nextMilestone}
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isActive
                ? 'bg-gradient-to-r from-orange-500 to-rose-400'
                : 'bg-slate-700'
            }`}
            style={{ width: `${isActive ? progress : 0}%` }}
          />
        </div>

        {/* Streak sıfırsa motivasyon */}
        {!isActive && (
          <p className="text-[10px] text-slate-600 mt-1.5 text-center font-medium">
            🚀 İlk gününü başlat
          </p>
        )}
      </div>
    </div>
  );
}
