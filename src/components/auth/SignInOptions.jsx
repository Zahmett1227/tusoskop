import React, { useState } from "react";
import {
  loginWithApple,
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
} from "../../firebase";

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

export default function SignInOptions({ accentTheme }) {
  const primary = accentTheme?.primary || "bg-emerald-400";
  const primaryHover = accentTheme?.primaryHover || "hover:bg-emerald-300";
  const glow = accentTheme?.glow || "";

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("E-posta ve şifre gerekli.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "register") {
        await registerWithEmail(trimmedEmail, password);
      } else {
        await loginWithEmail(trimmedEmail, password);
      }
    } catch (err) {
      setError(err?.userMessage || "İşlem tamamlanamadı. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
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
        onClick={loginWithGoogle}
        className={`flex min-h-14 w-full items-center justify-center gap-3 rounded-3xl px-6 py-4 text-base font-black text-slate-950 shadow-2xl transition-transform hover:scale-[1.02] active:scale-95 ${primary} ${primaryHover} ${glow}`}
      >
        <GoogleMark />
        Google ile Giriş Yap
      </button>
      {!showEmailForm ? (
        <button
          type="button"
          onClick={() => setShowEmailForm(true)}
          className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-extrabold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900 active:scale-95"
        >
          E-posta ile giriş
        </button>
      ) : (
        <form
          onSubmit={handleEmailSubmit}
          className="space-y-2.5 rounded-3xl border border-slate-800 bg-slate-900/70 p-3"
        >
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta"
            className="min-h-12 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
          />
          <input
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            className="min-h-12 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
          />
          {error ? (
            <p className="px-1 text-xs font-semibold text-rose-300">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className={`flex min-h-12 w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-black text-slate-950 transition active:scale-95 disabled:opacity-60 ${primary} ${primaryHover}`}
          >
            {submitting
              ? "Lütfen bekleyin…"
              : mode === "register"
                ? "Kayıt Ol"
                : "Giriş Yap"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "register" ? "login" : "register"));
              setError("");
            }}
            className="w-full px-1 text-center text-xs font-semibold text-slate-400 underline-offset-2 transition hover:text-slate-200 hover:underline"
          >
            {mode === "register"
              ? "Zaten hesabın var mı? Giriş yap"
              : "Hesabın yok mu? Kayıt ol"}
          </button>
        </form>
      )}
      <p className="px-2 text-center text-xs font-medium leading-relaxed text-slate-500">
        Giriş yaparak çalışma verilerinin hesabına bağlı saklanmasını kabul edersin.
      </p>
    </div>
  );
}
