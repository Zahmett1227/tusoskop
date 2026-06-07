import React, { useRef, useState } from "react";
import { loginWithApple, loginWithAppReviewEmail } from "../../firebase";

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

export default function SignInOptions({ accentTheme, onGoogleLogin }) {
  const primary = accentTheme?.primary || "bg-emerald-400";
  const primaryHover = accentTheme?.primaryHover || "hover:bg-emerald-300";
  const glow = accentTheme?.glow || "";
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewPassword, setReviewPassword] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const formRef = useRef(null);

  const scrollFormIntoView = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const handleReviewLogin = async (event) => {
    event.preventDefault();
    if (!reviewEmail.trim()) {
      setReviewStatus("E-posta girin.");
      return;
    }
    if (!reviewPassword.trim()) {
      setReviewStatus("Şifre girin.");
      return;
    }
    setReviewLoading(true);
    setReviewStatus("");
    try {
      await loginWithAppReviewEmail(reviewEmail, reviewPassword);
    } catch (error) {
      setReviewStatus(error?.userMessage || "Giriş başarısız oldu.");
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-3">
      <button
        type="button"
        onClick={loginWithApple}
        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-3xl bg-white px-6 py-4 text-base font-black text-slate-950 shadow-2xl shadow-black/20 transition-transform hover:scale-[1.02] active:scale-95"
      >
        <AppleMark />
        Apple ile Giriş Yap
      </button>
      <button
        type="button"
        onClick={onGoogleLogin}
        className={`flex min-h-14 w-full items-center justify-center gap-3 rounded-3xl px-6 py-4 text-base font-black text-slate-950 shadow-2xl transition-transform hover:scale-[1.02] active:scale-95 ${primary} ${primaryHover} ${glow}`}
      >
        <GoogleMark />
        Google ile Giriş Yap
      </button>
      <p className="px-2 text-center text-xs font-medium leading-relaxed text-slate-500">
        Giriş yaparak çalışma verilerinin hesabına bağlı saklanmasını kabul edersin.
      </p>
      <form
        ref={formRef}
        onSubmit={handleReviewLogin}
        className="mt-2 rounded-2xl border border-slate-800 bg-slate-900/45 p-3"
      >
        <div className="space-y-2">
          <input
            type="email"
            value={reviewEmail}
            onChange={(event) => setReviewEmail(event.target.value)}
            onFocus={scrollFormIntoView}
            placeholder="E-posta"
            autoComplete="email"
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-center text-xs font-semibold text-white outline-none transition focus:border-slate-600"
            aria-label="E-posta"
          />
          <input
            type="password"
            value={reviewPassword}
            onChange={(event) => setReviewPassword(event.target.value)}
            onFocus={scrollFormIntoView}
            placeholder="Şifre"
            autoComplete="current-password"
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-center text-xs font-semibold text-white outline-none transition focus:border-slate-600"
            aria-label="Şifre"
          />
          <button
            type="submit"
            disabled={reviewLoading}
            className="h-10 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-xs font-black text-slate-100 transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
          >
            {reviewLoading ? "Giriş yapılıyor..." : "Giriş"}
          </button>
        </div>
        {reviewStatus ? (
          <p className="mt-2 text-center text-[11px] font-semibold text-rose-300">
            {reviewStatus}
          </p>
        ) : null}
      </form>
    </div>
  );
}
