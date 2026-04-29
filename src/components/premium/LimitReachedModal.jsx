import React from "react";
import { PLUS_MONTHLY_PRICE_LABEL } from "../../constants/pricing";

export default function LimitReachedModal({
  open,
  title,
  description,
  ctaLabel = "Plus'i Incele",
  onClose,
  onUpgradeClick,
  remainingInfo = "",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-emerald-300/25 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl">
        <p className="text-[11px] uppercase tracking-wider text-emerald-300 font-black mb-2">
          Free Limit
        </p>
        <h3 className="text-xl font-black text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-300 mb-3">{description}</p>
        {remainingInfo ? (
          <p className="text-xs text-slate-400 mb-4">{remainingInfo}</p>
        ) : null}

        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 mb-5">
          <p className="text-xs text-slate-400">Plus fiyat</p>
          <p className="text-base font-black text-emerald-300">{PLUS_MONTHLY_PRICE_LABEL} / ay</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onUpgradeClick}
            className="flex-1 min-h-11 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-black"
          >
            {ctaLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 rounded-2xl bg-slate-800 text-slate-200 font-bold"
          >
            Daha sonra
          </button>
        </div>
      </div>
    </div>
  );
}
