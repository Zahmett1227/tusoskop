import React, { useState, useEffect } from "react";
import { shouldShowPwaInstallBanner } from "../utils/device";

const DISMISSED_KEY = "tusoskop_install_banner_v1";

export default function IOSInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (!shouldShowPwaInstallBanner()) return;

    // Biraz bekleyip göster — sayfa yüklenir yüklenmez çıkmasın
    const t = setTimeout(() => {
      setVisible(true);
      // Küçük animasyon için iki adımlı mount
      requestAnimationFrame(() => setMounted(true));
    }, 2800);

    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setMounted(false);
    // Animasyonun bitmesini bekle
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem(DISMISSED_KEY, "1");
    }, 300);
  };

  return (
    <div
      className="fixed left-3 right-3 z-50 md:hidden
                 flex items-center gap-3
                 bg-[#0a0d15]/95 backdrop-blur-xl
                 border border-white/[0.1] rounded-2xl px-4 py-3.5
                 shadow-2xl shadow-black/60"
      style={{
        bottom: "calc(5.5rem + env(safe-area-inset-bottom))",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
      role="complementary"
      aria-label="Uygulamayı ana ekrana ekle"
    >
      {/* İkon */}
      <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25
                      flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M12 2v13M7 9l5-7 5 7" />
          <path d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" />
        </svg>
      </div>

      {/* Metin */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-[13px] font-bold leading-tight">
          Ana Ekrana Ekle
        </p>
        <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">
          <span className="text-slate-300">Safari </span>
          <span className="text-slate-500">→ Paylaş </span>
          <span className="text-slate-300">→ Ana Ekrana Ekle</span>
        </p>
      </div>

      {/* Kapat butonu */}
      <button
        onClick={dismiss}
        className="shrink-0 w-7 h-7 rounded-full bg-slate-700/80
                   flex items-center justify-center
                   text-slate-400 text-xs font-bold
                   hover:bg-slate-600 transition-colors active:scale-90"
        aria-label="Kapat"
      >
        ✕
      </button>
    </div>
  );
}
