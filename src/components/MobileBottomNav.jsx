import React from "react";
import { accentThemes } from "../theme/accentThemes";

const TABS = [
  {
    key: "dashboard",
    label: "Anasayfa",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    key: "examSetSelect",
    label: "Deneme",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 9h6M9 12h6M9 15h4" />
      </svg>
    ),
  },
  {
    key: "questionSetup",
    label: "Sorular",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    key: "tracker",
    label: "Konular",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    key: "suggestions",
    label: "Öneriler",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
];

export default function MobileBottomNav({ currentView, setView, accentTheme }) {
  const theme = accentTheme || accentThemes.emerald;
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
                ${active ? theme.text : "text-slate-500"}
              `}
            >
              {/* Active indicator bar */}
              <span
                className={`absolute top-0 w-8 h-0.5 rounded-full transition-all duration-300
                  ${active ? `${theme.primary} opacity-100` : "opacity-0"}`}
              />
              <span
                className={`transition-transform duration-200 ${active ? "scale-110" : "scale-100"}`}
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
