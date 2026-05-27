import React, { useMemo, useState } from "react";
import { SUPPORT_EMAIL } from "../../config/support";
import { deleteCurrentAccountAndData } from "../../services/accountDeletionService";
import { getPremiumStatusLabel } from "../../utils/premiumUtils";

const CONFIRM_TEXT = "SIL";

export default function AccountSettingsScreen({ user, userData, onBack }) {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_TEXT && !busy;
  const accountLabel = useMemo(
    () => user?.email || user?.displayName || user?.uid || "Tusoskop hesabı",
    [user]
  );

  const handleDelete = async () => {
    if (!canDelete) return;
    const ok = window.confirm(
      "Hesabınız ve kişisel çalışma verileriniz silinecek. Bu işlem geri alınamaz. Devam edilsin mi?"
    );
    if (!ok) return;

    setBusy(true);
    setError("");
    try {
      await deleteCurrentAccountAndData();
    } catch (err) {
      setError(err?.message || "Hesap silme işlemi tamamlanamadı.");
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-dvh bg-slate-950 px-4 py-5 text-white md:px-8 md:py-10"
      style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))", paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
        >
          Dashboard'a dön
        </button>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5 shadow-2xl md:p-7">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
            Hesap
          </p>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Hesap ayarları
          </h1>
          <div className="mt-5 grid gap-3 rounded-3xl border border-slate-800 bg-slate-950/60 p-4 text-sm">
            <p className="break-all font-semibold text-slate-200">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Kullanıcı{" "}
              </span>
              {accountLabel}
            </p>
            <p className="break-all font-semibold text-slate-200">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                UID{" "}
              </span>
              <span className="font-mono text-xs">{user?.uid || "-"}</span>
            </p>
            <p className="font-semibold text-emerald-300">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Plan{" "}
              </span>
              {getPremiumStatusLabel(userData)}
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-rose-900/60 bg-rose-950/20 p-5 shadow-xl md:p-7">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-rose-300">
            Hesap silme
          </p>
          <h2 className="text-2xl font-black text-white">
            Hesabımı ve verilerimi sil
          </h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-rose-100/85">
            Bu işlem Firebase Auth hesabınızı, çalışma geçmişinizi, favorilerinizi,
            yanlış sorularınızı, tekrar kuyruğunuzu, deneme sonuçlarınızı ve kullanım
            sayaçlarınızı siler. Ödeme kayıtları yasal/operasyonel takip için kişisel
            e-posta ve UID kaldırılarak anonimleştirilir.
          </p>
          <p className="mt-3 text-sm font-medium leading-relaxed text-rose-100/75">
            Devam etmek için aşağıdaki alana <span className="font-black">{CONFIRM_TEXT}</span> yazın.
          </p>

          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            className="mt-4 min-h-12 w-full rounded-2xl border border-rose-800 bg-slate-950 px-4 text-base font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-rose-400"
            placeholder={CONFIRM_TEXT}
            autoComplete="off"
          />

          {error ? (
            <p className="mt-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={!canDelete}
            onClick={handleDelete}
            className="mt-4 min-h-12 w-full rounded-2xl bg-rose-500 px-5 text-sm font-black text-white shadow-lg shadow-rose-950/40 transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Hesap siliniyor..." : "Hesabımı kalıcı olarak sil"}
          </button>

          <p className="mt-4 text-center text-xs font-medium text-rose-100/65">
            Sorun yaşarsanız: {SUPPORT_EMAIL}
          </p>
        </section>
      </div>
    </div>
  );
}
