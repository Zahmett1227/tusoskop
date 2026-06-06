import { useEffect, useRef, useState } from "react";
import { accentThemes } from "../theme/accentThemes";

function getInitials(user) {
  const source = user?.displayName?.trim() || user?.email?.trim() || "";
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

/**
 * Header sağ üstündeki tek dokunuşluk hesap menüsü.
 * Tema seçimi, hesap bilgisi, destek/geri bildirim ve çıkış burada toplanır.
 */
export default function DashboardProfileMenu({
  user,
  isLightTheme,
  theme,
  accentThemeKey,
  onAccentThemeChange,
  onLogout,
  onOpenAccountSettings,
  mailtoSupport,
  mailtoFeedback,
  onSupportClick,
  onFeedbackClick,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointer = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const photoURL = user?.photoURL;
  const displayName = user?.displayName || user?.email || "Hesabım";
  const email = user?.email || "";

  const panelSurface = isLightTheme
    ? "border-slate-200 bg-white text-slate-900 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)]"
    : "border-slate-700/70 bg-slate-900 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]";
  const dividerColor = isLightTheme ? "border-slate-200" : "border-slate-700/60";
  const subText = isLightTheme ? "text-slate-500" : "text-slate-400";
  const linkItem = isLightTheme
    ? "text-slate-700 hover:bg-slate-100"
    : "text-slate-200 hover:bg-slate-800/70";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Hesap menüsü"
        className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isLightTheme
            ? "border-slate-300 focus-visible:ring-offset-[#faf8f4]"
            : "border-slate-700 focus-visible:ring-offset-slate-950"
        } ${theme.ring} ${open ? "scale-105" : "hover:scale-105"}`}
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className={`flex h-full w-full items-center justify-center text-sm font-black ${theme.primary} text-slate-950`}
          >
            {getInitials(user)}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={`toast-enter absolute right-0 top-12 z-50 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border ${panelSurface}`}
        >
          {/* Hesap başlığı */}
          <div className={`flex items-center gap-3 border-b ${dividerColor} px-4 py-3.5`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className={`flex h-full w-full items-center justify-center rounded-full text-sm font-black ${theme.primary} text-slate-950`}>
                  {getInitials(user)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{displayName}</p>
              {email ? (
                <p className={`truncate text-xs font-medium ${subText}`}>{email}</p>
              ) : null}
            </div>
          </div>

          {/* Tema seçimi */}
          <div className={`border-b ${dividerColor} px-4 py-3`}>
            <p className={`mb-2.5 text-[10px] font-black uppercase tracking-[0.18em] ${subText}`}>
              Tema
            </p>
            <div className="grid grid-cols-5 gap-2">
              {Object.keys(accentThemes).map((key) => {
                const t = accentThemes[key];
                const active = accentThemeKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => onAccentThemeChange?.(key)}
                    title={t.name}
                    aria-label={`${t.name} teması`}
                    className={`flex aspect-square items-center justify-center rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${theme.ring} ${
                      t.previewClass || t.primary
                    } ${
                      active
                        ? "scale-105 border-white ring-2 ring-offset-1 ring-white/60"
                        : isLightTheme
                        ? "border-slate-300 hover:scale-105"
                        : "border-slate-700 hover:scale-105"
                    } ${key === "light" ? "border-slate-300" : ""}`}
                  >
                    {active ? (
                      <span className="text-xs font-black text-slate-900 drop-shadow">✓</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bağlantılar */}
          <nav className="p-1.5">
            <a
              href={mailtoSupport}
              onClick={() => {
                onSupportClick?.();
                setOpen(false);
              }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${linkItem}`}
              role="menuitem"
            >
              <span aria-hidden>💬</span> Destek
            </a>
            <a
              href={mailtoFeedback}
              onClick={() => {
                onFeedbackClick?.();
                setOpen(false);
              }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${linkItem}`}
              role="menuitem"
            >
              <span aria-hidden>✍️</span> Geri bildirim
            </a>
            {onOpenAccountSettings ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenAccountSettings();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${linkItem}`}
                role="menuitem"
              >
                <span aria-hidden>⚙️</span> Hesap ve gizlilik
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                isLightTheme
                  ? "text-rose-600 hover:bg-rose-50"
                  : "text-rose-300 hover:bg-rose-500/10"
              }`}
              role="menuitem"
            >
              <span aria-hidden>⏻</span> Çıkış yap
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
