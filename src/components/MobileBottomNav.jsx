import React from "react";
import { accentThemes } from "../theme/accentThemes";

const TABS = [
  {
    key: "dashboard",
    label: "Anasayfa",
    activeTone: "emerald",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
];

export default function MobileBottomNav({ currentView, setView, accentTheme }) {
  const theme = accentTheme || accentThemes.emerald;
  const toneClass = (tone) => {
    if (tone === "violet") return "text-violet-300 bg-violet-400/15 border-violet-300/30";
    if (tone === "amber") return "text-amber-300 bg-amber-400/15 border-amber-300/30";
    if (tone === "cyan") return "text-cyan-300 bg-cyan-400/15 border-cyan-300/30";
    return `${theme.text} ${theme.softBg} ${theme.softBorder}`;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden
                 bg-slate-950/90 backdrop-blur-xl
                 border-t border-slate-800/70 rounded-t-2xl"
      style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-stretch">
        {TABS.map((tab) => {
          const active = currentView === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`
                flex-1 flex flex-col items-center justify-center pt-2.5 pb-2 gap-1
                transition-all duration-150 active:scale-90
                ${active ? "text-white" : "text-slate-500"}
              `}
            >
              {/* Active indicator bar */}
              <span
                className={`absolute top-0 w-8 h-0.5 rounded-full transition-all duration-300
                  ${active ? `${theme.primary} opacity-100` : "opacity-0"}`}
              />
              <span
                className={`transition-all duration-200 w-9 h-9 rounded-full border flex items-center justify-center ${
                  active ? `${toneClass(tab.activeTone)} scale-110 shadow-lg` : "border-transparent"
                }`}
              >
                {tab.icon(active)}
              </span>
              <span
                className={`text-[9px] font-bold tracking-wide transition-colors duration-200
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
