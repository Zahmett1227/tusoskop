import React, { useEffect } from "react";
import { trackClarityEvent } from "../../lib/clarity";

/**
 * Misafir 10 soruluk hakkını doldurunca çıkan nazik giriş isteği.
 * Birincil CTA misafir modundan çıkıp giriş ekranını açar.
 */
export default function GuestLoginPromptModal({
  open,
  remaining = 0,
  onLogin,
  onClose,
}) {
  useEffect(() => {
    if (!open) return;
    try {
      trackClarityEvent("guest_login_prompt_shown");
    } catch {
      /* sessiz */
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0a0d15] p-6 text-white shadow-[0_28px_80px_-28px_rgba(0,0,0,0.8)]">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl">
            🎯
          </div>
        </div>

        <h3 className="text-center text-xl font-black leading-tight text-white">
          Misafir deneme hakkın doldu
        </h3>
        <p className="mt-2 text-center text-sm font-medium leading-relaxed text-slate-300">
          10 soruyu tamamladın. Ücretsiz bir hesap açarak sınırsız çalış, ilerlemeni ve
          yanlışlarını bulutta sakla, tekrar planını kaldığın yerden sürdür.
        </p>

        <ul className="mt-4 space-y-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-sm font-semibold text-slate-200">
          <li className="flex items-center gap-2">
            <span className="text-emerald-400" aria-hidden>✓</span> Günde 30 soru + akıllı tekrar
          </li>
          <li className="flex items-center gap-2">
            <span className="text-emerald-400" aria-hidden>✓</span> Yanlış ve favorilerin kayıtlı
          </li>
          <li className="flex items-center gap-2">
            <span className="text-emerald-400" aria-hidden>✓</span> Seri, sıralama ve gelişmiş analiz
          </li>
        </ul>

        <button
          type="button"
          onClick={() => {
            try {
              trackClarityEvent("guest_login_prompt_cta");
            } catch {
              /* sessiz */
            }
            onLogin?.();
          }}
          className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 text-base font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition-transform hover:scale-[1.01] active:scale-95"
        >
          Giriş yap / Kayıt ol
        </button>
        <button
          type="button"
          onClick={() => onClose?.()}
          className="mt-2 min-h-[44px] w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-6 text-sm font-bold text-slate-300 transition hover:bg-white/[0.08]"
        >
          Şimdilik kapat
        </button>
      </div>
    </div>
  );
}
