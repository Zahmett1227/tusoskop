import React from "react";
import { loginWithApple, loginWithGoogle } from "../../firebase";

function GoogleMark() {
  return (
    <span
      className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-black text-slate-900"
      aria-hidden
    >
      G
    </span>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M16.45 12.72c-.02-2.24 1.83-3.32 1.91-3.37-1.04-1.52-2.65-1.73-3.22-1.75-1.37-.14-2.67.8-3.36.8-.7 0-1.77-.78-2.91-.76-1.5.02-2.88.87-3.65 2.21-1.56 2.7-.4 6.7 1.12 8.89.74 1.07 1.63 2.28 2.79 2.23 1.12-.04 1.54-.72 2.9-.72 1.35 0 1.74.72 2.93.7 1.21-.02 1.98-1.09 2.72-2.16.85-1.24 1.2-2.44 1.22-2.5-.03-.01-2.34-.9-2.36-3.57z" />
      <path d="M14.24 6.15c.62-.75 1.04-1.79.92-2.83-.89.04-1.96.59-2.6 1.34-.57.66-1.07 1.72-.94 2.73.99.08 2-.5 2.62-1.24z" />
    </svg>
  );
}

export default function SignInOptions({
  accentTheme,
  onDemoLogin,
  showDemoLogin = false,
  onAppleLogin,
  onGoogleLogin,
}) {
  const primary = accentTheme?.primary || "bg-emerald-400";
  const primaryHover = accentTheme?.primaryHover || "hover:bg-emerald-300";
  const glow = accentTheme?.glow || "";

  const handleApple = onAppleLogin ?? loginWithApple;
  const handleGoogle = onGoogleLogin ?? loginWithGoogle;

  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="relative">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="flex min-h-14 w-full cursor-not-allowed items-center justify-center gap-3 rounded-3xl bg-white/50 px-6 py-4 text-base font-black text-slate-400 shadow-lg shadow-black/10"
        >
          <AppleMark />
          Apple ile Giriş Yap
        </button>
        <span className="absolute -right-2 -top-2 inline-flex items-center rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-black text-slate-950 shadow-md">
          Yakında
        </span>
      </div>
      <button
        type="button"
        onClick={handleGoogle}
        className={`flex min-h-14 w-full items-center justify-center gap-3 rounded-3xl px-6 py-4 text-base font-black text-slate-950 shadow-2xl transition-transform hover:scale-[1.02] active:scale-95 ${primary} ${primaryHover} ${glow}`}
      >
        <GoogleMark />
        Google ile Giriş Yap
      </button>
      {showDemoLogin && typeof onDemoLogin === "function" ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-3">
          <button
            type="button"
            onClick={onDemoLogin}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-extrabold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900 active:scale-95"
          >
            Demo olarak incele
          </button>
          <p className="mt-2 px-1 text-center text-[11px] font-medium leading-relaxed text-slate-500">
            Gerçek hesap oluşturmadan uygulamayı test eder.
          </p>
        </div>
      ) : null}
      <p className="px-2 text-center text-xs font-medium leading-relaxed text-slate-500">
        Giriş yaparak çalışma verilerinin hesabına bağlı saklanmasını kabul edersin.
      </p>
    </div>
  );
}
