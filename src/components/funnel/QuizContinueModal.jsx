import React, { useEffect, useState } from "react";
import { isInAppBrowser } from "../../utils/device";

/**
 * "Sonucunu kaydet" giriş paneli — web devam akışı.
 * Mevcut Google/Apple auth altyapısını kullanır (login mantığı orchestrator'da,
 * bu bileşen sunum katmanıdır).
 */

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.5 34.9 26.9 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 5.5C41.5 36.9 44 31.1 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.9c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.6 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.5 2.2 2.6 2.1 1-.04 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.6 1.1-.02 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.4-.02-.01-2.1-.8-2.1-3.5zM14.3 6.3c.6-.7 1-1.7.9-2.7-.9.03-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .07 1.9-.5 2.5-1.2z" />
    </svg>
  );
}

export default function QuizContinueModal({
  open,
  onClose,
  score,
  total,
  busy,
  error,
  onGoogle,
  onApple,
}) {
  const [linkCopied, setLinkCopied] = useState(false);
  const inAppBrowser = isInAppBrowser();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  useEffect(() => {
    if (!open) setLinkCopied(false);
  }, [open]);

  if (!open) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
    } catch {
      /* pano izni yoksa sessizce yut, banner metni zaten adres çubuğuna yönlendiriyor */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-continue-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h3 id="quiz-continue-title" className="text-xl font-black text-slate-100">
            Sonucunu kaydet
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Kapat"
            className="rounded-full p-1 text-slate-400 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 disabled:opacity-50"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M6 6l8 8M14 6l-8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {score}/{total} skorun ve çözdüğün sorular hesabına aktarılacak.
        </p>

        {inAppBrowser && (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left">
            <p className="text-sm font-bold text-amber-300">Google girişi burada çalışmayabilir</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-200/90">
              Instagram/Facebook'un uygulama-içi tarayıcısındasın. Sağ üstteki{" "}
              <span className="font-semibold">"•••"</span> menüsünden{" "}
              <span className="font-semibold">"Tarayıcıda Aç"</span>'ı seç, ya da linki kopyalayıp
              Safari/Chrome'da aç.
            </p>
            <button
              type="button"
              onClick={handleCopyLink}
              className="mt-2.5 rounded-xl border border-amber-400/40 px-3 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-500/10"
            >
              {linkCopied ? "Kopyalandı ✓" : "Linki Kopyala"}
            </button>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-base font-bold text-slate-800 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-60"
          >
            <GoogleGlyph />
            Google ile devam et
          </button>
          <button
            type="button"
            onClick={onApple}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-100 px-5 py-3.5 text-base font-bold text-slate-900 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-60"
          >
            <AppleGlyph />
            Apple ile devam et
          </button>
        </div>

        {busy && (
          <p className="mt-4 text-center text-sm font-semibold text-slate-400" role="status">
            Giriş yapılıyor…
          </p>
        )}
        {error && (
          <p className="mt-4 text-center text-sm font-semibold text-rose-400" role="alert">
            {error}
          </p>
        )}

        <p className="mt-4 text-center text-xs text-slate-500">Üyelik ücretsizdir.</p>
      </div>
    </div>
  );
}
