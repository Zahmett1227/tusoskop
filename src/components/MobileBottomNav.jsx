import React from "react";
import { accentThemes } from "../theme/accentThemes";

const TABS = [
  {
    key: "dashboard",
    label: "Anasayfa",
    activeTone: "emerald",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round" strokeLinejoin="round" className="w-[1.15rem] h-[1.15rem]">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    key: "questionSetup",
    label: "Sorular",
    activeTone: "cyan",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round" strokeLinejoin="round" className="w-[1.15rem] h-[1.15rem]">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    key: "studyCollection",
    label: "Çalışma Alanım",
    activeTone: "violet",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round" strokeLinejoin="round" className="w-[1.15rem] h-[1.15rem]">
        <path d="M4 6h16v12H4z" />
        <path d="M8 10h8M8 14h5" />
      </svg>
    ),
  },
  {
    key: "examSetSelect",
    label: "Deneme",
    activeTone: "amber",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round" strokeLinejoin="round" className="w-[1.15rem] h-[1.15rem]">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 9h6M9 12h6M9 15h4" />
      </svg>
    ),
  },
  {
    key: "tracker",
    label: "Konular",
    activeTone: "cyan",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round" strokeLinejoin="round" className="w-[1.15rem] h-[1.15rem]">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    key: "leaderboard",
    label: "Sıralama",
    activeTone: "amber",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round" strokeLinejoin="round" className="w-[1.15rem] h-[1.15rem]">
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0012 0V2z" />
      </svg>
    ),
  },
];

export default function MobileBottomNav({
  currentView,
  setView,
  accentTheme,
  reviewQueueCount = 0,
  examLocked = false,
}) {
  const theme = accentTheme || accentThemes.emerald;
  const toneClass = (tone) => {
    if (tone === "violet") return "text-violet-300 bg-violet-400/15 border-violet-300/30";
    if (tone === "amber") return "text-amber-300 bg-amber-400/15 border-amber-300/30";
    if (tone === "cyan") return "text-cyan-300 bg-cyan-400/15 border-cyan-300/30";
    return `${theme.text} ${theme.softBg} ${theme.softBorder}`;
  };

  const queueBadge =
    typeof reviewQueueCount === "number" && reviewQueueCount > 0
      ? reviewQueueCount > 99
        ? "99+"
        : String(reviewQueueCount)
      : null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden
                 bg-slate-950/92 backdrop-blur-xl
                 border-t border-slate-800/70 rounded-t-[1.75rem] shadow-[0_-18px_45px_rgba(0,0,0,0.42)]"
      style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}
      aria-label="Ana mobil menü"
    >
      <div className="flex items-stretch gap-1 px-2 pt-2">
        {TABS.map((tab) => {
          const active = currentView === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setView(tab.key)}
              className={`
                relative flex-1 flex flex-col items-center justify-center rounded-2xl pt-2.5 pb-2 gap-1
                transition-all duration-200 active:scale-95
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
                ${theme.ring}
                ${active ? "bg-white/[0.06] text-white shadow-inner" : "text-slate-500"}
              `}
            >
              <span
                className={`absolute top-1 w-8 h-0.5 rounded-full transition-all duration-300
                  ${active ? `${theme.primary} opacity-100` : "opacity-0"}`}
              />
              <span
                className={`relative transition-all duration-200 w-10 h-10 rounded-2xl border flex items-center justify-center ${
                  active ? `${toneClass(tab.activeTone)} scale-100 shadow-md` : "border-transparent bg-transparent"
                }`}
              >
                {tab.key === "studyCollection" && queueBadge ? (
                  <span
                    className="absolute -right-1 -top-1 z-10 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border border-slate-950 bg-violet-400 px-0.5 text-[10px] font-black leading-none text-slate-950"
                    aria-label={`Tekrar kuyruğu: ${reviewQueueCount} soru`}
                  >
                    {queueBadge}
                  </span>
                ) : null}
                {tab.key === "examSetSelect" && examLocked ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-slate-950 bg-amber-400/95 text-slate-950 shadow"
                    title="Ücretsiz deneme hakkı kullanıldı"
                    aria-label="Deneme hakkı kullanıldı"
                  >
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
                      <path d="M17 11V8a5 5 0 00-10 0v3H6a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2h-1zm-8-3a3 3 0 016 0v3H9V8z" />
                    </svg>
                  </span>
                ) : null}
                {tab.icon(active)}
              </span>
              <span
                className={`max-w-[3.8rem] truncate text-[10px] font-black tracking-wide transition-colors duration-200
                  ${active ? theme.text : "text-slate-600"}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
