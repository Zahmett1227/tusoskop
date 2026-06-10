import React, { useEffect, useRef } from "react";
import { PRICING } from "../../constants/pricing";
import { getMailtoQuickSupport } from "../../config/support";
import { setClarityTag, trackClarityEvent } from "../../lib/clarity";
import { canShowExternalPayments } from "../../utils/device";
import CoffeeAnimation from "./CoffeeAnimation";

export default function LimitReachedModal({
  open,
  title,
  description,
  ctaLabel = "Plus'ı incele",
  secondaryLabel = "Şimdilik vazgeç",
  premiumMessage = "Aylık bir kahve ücretine Plus üyelik almak ister misiniz?",
  premiumDescription = "Plus ile soru çözme sınırları kalkar; denemeler, tekrarlar ve gelişmiş analizler tamamen açılır.",
  onClose,
  onUpgradeClick,
  remainingInfo = "",
  user = null,
  limitReason = "",
}) {
  const limitModalOpened = useRef(false);
  const allowExternalPayments = canShowExternalPayments();
  const showUpgradeContent = allowExternalPayments;

  useEffect(() => {
    if (!open) {
      limitModalOpened.current = false;
      return;
    }
    if (limitModalOpened.current) return;
    limitModalOpened.current = true;
    try {
      if (limitReason) setClarityTag("limit_reason", limitReason);
      trackClarityEvent("limit_modal_shown");
    } catch {
      /* sessiz */
    }
  }, [open, limitReason]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-5 md:p-7 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.35)]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-black mb-2">
          Tusoskop Plus
        </p>
        <h3 className="text-xl md:text-2xl font-black text-neutral-950 mb-2 leading-tight">
          {title}
        </h3>
        <p className="text-sm md:text-base font-medium text-neutral-700 mb-4 leading-relaxed">
          {description}
        </p>

        {showUpgradeContent ? (
          <div className="mb-4 rounded-3xl border border-[#ead9c1] bg-gradient-to-br from-[#fffbf7] to-[#fff8ef] p-4 flex items-start gap-3">
            <div className="shrink-0 scale-90 origin-top">
              <CoffeeAnimation />
            </div>
            <div className="min-w-0">
              <p className="text-lg md:text-xl font-extrabold text-[#2f1f11] leading-snug">
                {premiumMessage}
              </p>
              <p className="text-xs md:text-sm font-medium text-[#5c4736] mt-1.5 leading-relaxed">
                {premiumDescription}
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-4 rounded-3xl border border-[#ead9c1] bg-[#fff8ef] p-4">
            <p className="text-base font-extrabold leading-snug text-[#2f1f11]">
              Bu iOS sürümünde satın alma akışı sunulmuyor.
            </p>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#5c4736] md:text-sm">
              Mevcut Plus durumunu plan ekranından görebilirsin; uygulama içinde dış ödeme bağlantısı gösterilmez.
            </p>
          </div>
        )}

        {remainingInfo ? (
          <p className="text-xs font-medium text-neutral-600 mb-4 leading-relaxed">
            {remainingInfo}
          </p>
        ) : null}

        {showUpgradeContent ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 mb-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
              Plus paketleri
            </p>
            <p className="text-sm md:text-base font-black text-neutral-950 leading-snug mt-0.5">
              {PRICING.PLUS_STARTS_AT_LABEL}
            </p>
            <p className="text-xs font-medium text-neutral-600 mt-1 leading-snug">
              {PRICING.PLUS_PLANS_DETAIL_LABEL}
            </p>
          </div>
        ) : null}

        <div className="mb-5 space-y-2">
          <p className="text-xs md:text-sm font-semibold text-neutral-700">
            • Sınırsız soru çözme
          </p>
          <p className="text-xs md:text-sm font-semibold text-neutral-700">
            • Sınırsız deneme ve tekrar kuyruğu
          </p>
          <p className="text-xs md:text-sm font-semibold text-neutral-700">
            • Sınırsız favori ve yanlış geçmişi
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 rounded-2xl border border-neutral-300 bg-white text-neutral-900 font-bold text-sm hover:bg-neutral-50 transition sm:flex-1"
          >
            {secondaryLabel}
          </button>
          {showUpgradeContent ? (
            <button
              type="button"
              onClick={() => {
                try {
                  trackClarityEvent("upgrade_cta_click");
                } catch {
                  /* sessiz */
                }
                onUpgradeClick();
              }}
              className="min-h-11 px-4 rounded-2xl bg-neutral-950 text-white font-extrabold text-sm shadow-lg hover:bg-black transition sm:flex-1"
            >
              {ctaLabel}
            </button>
          ) : null}
        </div>

        <p className="mt-4 text-center">
          <a
            href={getMailtoQuickSupport(user)}
            onClick={() => {
              try {
                setClarityTag("support_email_provider", "gmail");
                setClarityTag("support_email_address_type", "gmail");
                trackClarityEvent("support_email_click");
              } catch {
                /* sessiz */
              }
            }}
            className="text-[11px] sm:text-xs font-semibold text-neutral-600 underline underline-offset-2 decoration-neutral-400 hover:text-neutral-900"
          >
            Ödeme veya Plus erişimiyle ilgili sorun mu yaşıyorsunuz? Destek alın.
          </a>
        </p>
      </div>
    </div>
  );
}
