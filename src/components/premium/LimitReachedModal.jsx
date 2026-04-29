import React from "react";
import { PLUS_MONTHLY_PRICE_LABEL } from "../../constants/pricing";
import CoffeeAnimation from "./CoffeeAnimation";

export default function LimitReachedModal({
  open,
  title,
  description,
  ctaLabel = "Plus’ı İncele",
  secondaryLabel = "Şimdilik Vazgeç",
  premiumMessage = "Aylık bir kahve ücretine Plus üyelik almak ister misiniz?",
  premiumDescription = "Plus ile soru çözme sınırları kalkar; denemeler, tekrarlar ve gelişmiş analizler tamamen açılır.",
  onClose,
  onUpgradeClick,
  remainingInfo = "",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-5 md:p-6 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.35)]">
        <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-600 font-black mb-2">
          Tusoskop Plus
        </p>
        <h3 className="text-lg md:text-xl font-black text-black mb-2">{title}</h3>
        <p className="text-sm text-neutral-700 mb-3">{description}</p>

        <div className="mb-4 rounded-2xl border border-[#ead9c1] bg-[#fff8ef] p-4 flex items-start gap-3">
          <CoffeeAnimation />
          <div>
            <p className="text-sm md:text-base font-black text-[#2f1f11] leading-tight">
              {premiumMessage}
            </p>
            <p className="text-xs text-[#5c4736] mt-1">
              {premiumDescription}
            </p>
          </div>
        </div>

        {remainingInfo ? (
          <p className="text-xs text-neutral-600 mb-4">{remainingInfo}</p>
        ) : null}

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 mb-5">
          <p className="text-xs text-neutral-600">Plus fiyatı</p>
          <p className="text-base font-black text-black">{PLUS_MONTHLY_PRICE_LABEL} / ay</p>
        </div>

        <div className="mb-5 space-y-1.5">
          <p className="text-xs text-neutral-700">• Sınırsız soru çözme</p>
          <p className="text-xs text-neutral-700">• Sınırsız deneme ve tekrar kuyruğu</p>
          <p className="text-xs text-neutral-700">• Sınırsız favori ve yanlış geçmişi</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onUpgradeClick}
            className="flex-1 min-h-11 px-4 rounded-2xl bg-black text-white font-black"
          >
            {ctaLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 rounded-2xl border border-neutral-300 bg-white text-black font-bold"
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
