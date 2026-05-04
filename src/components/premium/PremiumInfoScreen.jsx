import React, { useCallback, useEffect, useRef, useState } from "react";
import { PRICING } from "../../constants/pricing";
import { PLUS_PLANS } from "../../config/plusPlans";
import { createPremiumPurchaseIntent } from "../../services/purchaseIntentService";
import {
  SUPPORT_EMAIL,
  getMailtoFeedback,
  getMailtoPaymentIssue,
} from "../../config/support";
import { setClarityTag, trackClarityEvent } from "../../lib/clarity";
import { isUserPremium } from "../../utils/premiumUtils";
import CoffeeAnimation from "./CoffeeAnimation";
import Footer from "../layout/Footer";

const PLUS_PLAN_CLICK_EVENT = {
  plus_1m: "plus_plan_click_1m",
  plus_3m: "plus_plan_click_3m",
  plus_6m: "plus_plan_click_6m",
};

function trackSupportMail(kind) {
  try {
    setClarityTag("support_email_provider", "gmail");
    setClarityTag("support_email_address_type", "gmail");
    trackClarityEvent(kind);
  } catch {
    /* sessiz */
  }
}

function shortAccountId(uid) {
  if (!uid || typeof uid !== "string") return "";
  if (uid.length <= 10) return uid;
  return `${uid.slice(0, 4)}...${uid.slice(-3)}`;
}

const PLAN_CARD_PERKS = [
  "Sınırsız soru, deneme ve tekrar",
  "Favori ve yanlış geçmişi",
  "Gelişmiş deneme net grafiği",
];

export default function PremiumInfoScreen({
  onBack,
  user,
  userData,
  accentTheme,
  accentThemeKey,
  onOpenLegalPage,
}) {
  const [copyDone, setCopyDone] = useState(false);
  const [banner, setBanner] = useState("");
  const plusPageViewSent = useRef(false);

  useEffect(() => {
    try {
      setClarityTag("plan_status", isUserPremium(userData) ? "plus" : "free");
      setClarityTag("user_logged_in", user?.uid ? "true" : "false");
      if (!plusPageViewSent.current) {
        plusPageViewSent.current = true;
        trackClarityEvent("plus_page_view");
      }
    } catch {
      /* sessiz */
    }
  }, [userData, user?.uid]);

  const handleCopyUid = useCallback(async () => {
    if (!user?.uid || typeof navigator?.clipboard?.writeText !== "function") return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2200);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const handlePlanClick = useCallback(
    async (event, plan) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      setBanner("");

      if (plan?.id) {
        try {
          setClarityTag("selected_plus_plan", plan.id);
          setClarityTag("selected_plus_sku", plan.sku || "");
          const clickEv = PLUS_PLAN_CLICK_EVENT[plan.id];
          if (clickEv) trackClarityEvent(clickEv);
        } catch {
          /* sessiz */
        }
      }

      if (!plan?.shopifyUrl?.trim()) {
        try {
          setClarityTag("checkout_missing_plan", plan?.id || "");
          trackClarityEvent("checkout_link_missing");
        } catch {
          /* sessiz */
        }
        setBanner("Bu paket için satın alma bağlantısı hazırlanıyor.");
        return;
      }

      const url = plan.shopifyUrl.trim();

      if (!url.startsWith("https://")) {
        try {
          setClarityTag("checkout_missing_plan", plan?.id || "");
          trackClarityEvent("checkout_link_missing");
        } catch {
          /* sessiz */
        }
        console.error("Geçersiz Shopify URL:", url);
        setBanner(
          "Satın alma bağlantısı hatalı görünüyor. Lütfen daha sonra tekrar deneyin."
        );
        return;
      }

      if (!user?.uid) {
        setBanner("Satın alma için hesabınızla giriş yapmalısınız.");
        return;
      }

      try {
        await createPremiumPurchaseIntent(user, plan);
      } catch (error) {
        console.error("Purchase intent oluşturulamadı:", error);
      }

      try {
        setClarityTag("checkout_plan", plan.id);
        setClarityTag("checkout_sku", plan.sku || "");
        trackClarityEvent("checkout_redirect");
      } catch {
        /* sessiz */
      }

      window.location.assign(url);
    },
    [user]
  );

  const emailDisplay = user?.email?.trim()
    ? user.email
    : "E-posta bilgisi yok";
  const uidShort = user?.uid ? shortAccountId(user.uid) : "";
  const uidLine =
    user?.uid && uidShort ? uidShort : "Hesap bilgisi bulunamadı";

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#fdfcfa] via-[#fcfbf9] to-[#f5f0ea] text-black px-3 py-5 pb-12 sm:px-4 md:px-8 md:py-10">
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-10">
        {banner ? (
          <div
            role="status"
            className="rounded-3xl border border-amber-200/80 bg-[#fff8ef] px-4 py-3.5 text-sm font-medium text-[#3d2a18] shadow-sm"
          >
            {banner}
          </div>
        ) : null}

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[1.75rem] border border-neutral-200/90 bg-white/95 p-5 sm:p-8 md:p-10 shadow-[0_24px_70px_-32px_rgba(45,35,25,0.22)]">
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-[#f0e0d0]/90 to-transparent blur-2xl"
            aria-hidden
          />
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-neutral-500 font-black mb-3">
            Tusoskop Plus
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.08] tracking-tight text-neutral-950 mb-4">
            Çalışma akışınızı kesintiye uğratmadan devam edin
          </h1>
          <p className="text-base md:text-lg font-medium text-slate-700 max-w-2xl leading-relaxed mb-8">
            Soru, deneme ve tekrar sınırlarına takılmadan çalışmak isteyenler için
            Plus erişim paketleri.
          </p>

          <div className="rounded-3xl border border-[#e8d5c4] bg-gradient-to-br from-[#fffbf7] via-[#fff8ef] to-[#faf3eb] px-4 py-5 sm:px-6 sm:py-6 shadow-inner">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="flex shrink-0 justify-center sm:justify-start w-full sm:w-auto">
                <div className="scale-[0.88] sm:scale-100 origin-center sm:origin-top -mt-1">
                  <CoffeeAnimation />
                </div>
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-xl sm:text-2xl md:text-2xl font-extrabold text-[#2a1a0f] leading-snug">
                  Aylık bir kahve ücretine Plus üyelik almak ister misiniz?
                </p>
                <p className="text-sm md:text-base font-medium text-[#5c4736] mt-2 leading-relaxed max-w-xl mx-auto sm:mx-0">
                  Kısa bir kahve molası fiyatına çalışma düzeninizi sınırsız hale
                  getirin.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-1.5 text-sm md:text-base">
            <p className="font-semibold text-neutral-800">
              {PRICING.PLUS_STARTS_AT_LABEL}
            </p>
            <p className="font-medium text-neutral-600 leading-snug">
              {PRICING.PLUS_PLANS_DETAIL_LABEL}
            </p>
          </div>
        </section>

        {/* Hesap */}
        <section className="rounded-3xl border border-[#e6dfd6] bg-white/95 p-5 sm:p-7 shadow-[0_18px_50px_-30px_rgba(60,40,20,0.12)]">
          <h2 className="text-2xl md:text-3xl font-black text-neutral-950 mb-2">
            Plus erişimi bu hesaba tanımlanacak
          </h2>
          <p className="text-sm font-medium text-neutral-600 mb-5 leading-relaxed max-w-2xl">
            Ödeme yapmadan önce doğru hesapla giriş yaptığınızdan emin olun.
          </p>
          <div className="grid gap-3 text-sm rounded-2xl border border-neutral-100 bg-[#fafaf9] p-4">
            <p className="text-neutral-900 break-all font-medium">
              <span className="text-neutral-500 font-bold text-xs uppercase tracking-wide">
                E-posta{" "}
              </span>
              {emailDisplay}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-neutral-900 break-all min-w-0 font-medium">
                <span className="text-neutral-500 font-bold text-xs uppercase tracking-wide">
                  Hesap ID{" "}
                </span>
                <span className="font-mono text-[13px] tabular-nums text-neutral-800">
                  {uidLine}
                </span>
              </p>
              <button
                type="button"
                disabled={!user?.uid}
                onClick={handleCopyUid}
                className="shrink-0 min-h-11 px-5 rounded-2xl border border-[#c4a882] bg-white text-[#2f1f11] text-xs font-extrabold shadow-sm hover:bg-[#faf6f0] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {copyDone ? "Hesap ID kopyalandı" : "Hesap ID'yi kopyala"}
              </button>
            </div>
          </div>
        </section>

        {/* Paketler */}
        <section className="space-y-5">
          <div className="px-0.5">
            <h2 className="text-2xl md:text-3xl font-black text-neutral-950 tracking-tight">
              Paketler
            </h2>
            <ul className="mt-3 text-sm md:text-base font-medium text-neutral-700 space-y-2 list-none max-w-2xl">
              {[
                "Sınırsız soru çözme",
                "Sınırsız deneme",
                "Sınırsız tekrar kuyruğu",
                "Sınırsız favori ve yanlış geçmişi",
                "Gelişmiş deneme net grafiği",
              ].map((line) => (
                <li key={line} className="flex gap-2.5 items-start">
                  <span
                    className="mt-0.5 text-[#8b6914] font-black shrink-0"
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-stretch">
            {PLUS_PLANS.map((plan) => {
              const is1m = plan.id === "plus_1m";
              const hasUrl = Boolean(plan.shopifyUrl?.trim());
              const highlight = plan.highlight;
              const cardBase =
                "relative flex flex-col rounded-3xl border p-5 sm:p-6 min-h-0 min-w-0 transition duration-300 ease-out";
              const cardVisual = highlight
                ? "md:-translate-y-1 z-[1] border-[#c9a88a] bg-gradient-to-b from-[#fffefb] to-white shadow-[0_28px_64px_-28px_rgba(110,75,45,0.38)] ring-1 ring-[#dfc7ae]/70 hover:shadow-[0_32px_70px_-26px_rgba(110,75,45,0.45)] hover:-translate-y-1 md:hover:-translate-y-1.5"
                : "border-neutral-200/95 bg-white shadow-[0_18px_48px_-32px_rgba(0,0,0,0.16)] hover:shadow-[0_24px_56px_-28px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 md:hover:-translate-y-1";

              return (
                <article
                  key={plan.id}
                  className={`${cardBase} ${cardVisual}`}
                >
                  {plan.badge ? (
                    <span className="absolute -top-3 right-4 max-w-[min(100%,14rem)] rounded-full bg-gradient-to-r from-[#2d1f14] to-[#3d2918] px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wide text-white text-center leading-tight shadow-md">
                      {plan.badge}
                    </span>
                  ) : null}

                  <div className="pr-2">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-950 leading-tight">
                      {plan.label}
                    </h3>
                    <p className="text-sm font-semibold text-neutral-500 mt-1.5">
                      {plan.durationLabel}
                    </p>
                  </div>

                  <div className="mt-5 space-y-1 min-w-0">
                    {is1m ? (
                      <p className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-neutral-950 break-words">
                        {plan.totalPriceLabel}
                      </p>
                    ) : (
                      <>
                        <p className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-neutral-950 break-words">
                          {plan.monthlyPriceLabel}
                          <span className="text-lg sm:text-xl font-extrabold text-neutral-500">
                            {" "}
                            / ay
                          </span>
                        </p>
                        <p className="text-sm font-semibold text-neutral-600 tabular-nums break-words">
                          Toplam {plan.totalPriceLabel}
                        </p>
                      </>
                    )}
                  </div>

                  <p className="mt-4 text-sm font-medium text-neutral-700 leading-relaxed flex-1">
                    {plan.description}
                  </p>

                  <ul className="mt-4 space-y-1.5 text-xs sm:text-sm font-semibold text-neutral-600">
                    {PLAN_CARD_PERKS.map((perk) => (
                      <li key={perk} className="flex gap-2">
                        <span className="text-[#a67c52] shrink-0">•</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={(e) => handlePlanClick(e, plan)}
                    disabled={!hasUrl}
                    className={`mt-5 w-full min-h-12 rounded-2xl text-sm font-extrabold px-3 py-3 transition ${
                      hasUrl
                        ? "bg-[#1a120c] text-white shadow-lg shadow-neutral-900/15 hover:bg-black hover:shadow-xl active:scale-[0.98]"
                        : "bg-neutral-100 text-neutral-500 border border-neutral-200 cursor-not-allowed"
                    }`}
                  >
                    {hasUrl ? plan.ctaLabel : "Bağlantı hazırlanıyor"}
                  </button>
                  {!hasUrl ? (
                    <p className="mt-2 text-center text-xs font-medium text-neutral-500">
                      Bu paket için satın alma bağlantısı hazırlanıyor.
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        {typeof onOpenLegalPage === "function" ? (
          <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] sm:text-xs leading-relaxed text-neutral-600 px-1">
            Satın alma işlemine devam ederek{" "}
            <button
              type="button"
              onClick={() => onOpenLegalPage("mesafeli-satis-sozlesmesi")}
              className="font-semibold text-neutral-800 underline decoration-neutral-400/80 underline-offset-2 hover:text-neutral-950"
            >
              Mesafeli Satış Sözleşmesi
            </button>
            ,{" "}
            <button
              type="button"
              onClick={() => onOpenLegalPage("iade-iptal-politikasi")}
              className="font-semibold text-neutral-800 underline decoration-neutral-400/80 underline-offset-2 hover:text-neutral-950"
            >
              İade ve İptal Politikası
            </button>
            {" ve "}
            <button
              type="button"
              onClick={() => onOpenLegalPage("gizlilik-sozlesmesi")}
              className="font-semibold text-neutral-800 underline decoration-neutral-400/80 underline-offset-2 hover:text-neutral-950"
            >
              Gizlilik Sözleşmesi
            </button>{" "}
            metinlerini okuduğunuzu kabul etmiş olursunuz.
          </p>
        ) : null}

        {/* Ödeme sonrası + destek */}
        <section className="rounded-3xl border border-neutral-200/90 bg-white p-5 sm:p-8 shadow-[0_14px_40px_-28px_rgba(0,0,0,0.1)]">
          <h2 className="text-2xl md:text-3xl font-black text-neutral-950 mb-3">
            Ödeme sonrası nasıl aktifleşir?
          </h2>
          <p className="text-sm md:text-base font-medium text-neutral-800 leading-relaxed">
            Satın alma tamamlandıktan sonra Plus erişiminiz manuel olarak kontrol
            edilir ve en geç 24 saat içinde hesabınıza tanımlanır.
          </p>
          <p className="text-sm md:text-base font-medium text-neutral-700 mt-3 leading-relaxed">
            Erişimin doğru tanımlanabilmesi için ödeme yapmadan önce doğru Tusoskop
            hesabıyla giriş yaptığınızdan emin olun. Gerekirse Hesap ID'nizi
            destek mesajında paylaşabilirsiniz.
          </p>
          <p className="text-xs sm:text-sm font-medium text-neutral-600 mt-3 leading-relaxed">
            Ödeme sırasında sorun yaşarsanız veya Plus erişiminiz 24 saat içinde
            açılmazsa{" "}
            <span className="font-bold text-neutral-800">{SUPPORT_EMAIL}</span>{" "}
            üzerinden bize ulaşabilirsiniz.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <a
              href={getMailtoPaymentIssue(user)}
              onClick={() => trackSupportMail("support_payment_issue_click")}
              className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center rounded-2xl bg-[#1a120c] px-5 text-sm font-extrabold text-white shadow-lg shadow-neutral-900/15 transition hover:bg-black active:scale-[0.99]"
            >
              Ödeme sorunu bildir
            </a>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200/90 bg-[#fdfcfa] p-5 sm:p-8 shadow-inner">
          <h2 className="text-xl md:text-2xl font-black text-neutral-950 mb-2">
            Fikrini paylaş
          </h2>
          <p className="text-sm md:text-base font-medium text-neutral-700 leading-relaxed max-w-2xl">
            Tusoskop'u geliştirmek için olumlu ya da olumsuz tüm geri bildirimler
            değerlidir.
          </p>
          <a
            href={getMailtoFeedback(user)}
            onClick={() => trackSupportMail("feedback_email_click")}
            className="mt-4 inline-flex min-h-11 w-full sm:w-auto items-center justify-center rounded-2xl border-2 border-neutral-800 bg-white px-5 text-sm font-extrabold text-neutral-900 transition hover:bg-neutral-50 active:scale-[0.99]"
          >
            Geri bildirim gönder
          </a>
        </section>

        {/* Plus ile açılanlar */}
        <section className="rounded-3xl border border-neutral-200/90 bg-white/90 p-5 sm:p-8 shadow-inner">
          <h2 className="text-2xl md:text-3xl font-black text-neutral-950 mb-6">
            Plus ile açılanlar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              [
                "Sınırsız soru çözme",
                "Günlük soru sınırına takılmadan istediğiniz kadar soru çözebilirsiniz.",
              ],
              [
                "Sınırsız deneme",
                "Deneme pratiğinizi ayda tek denemeyle sınırlamadan sürdürebilirsiniz.",
              ],
              [
                "Tam tekrar erişimi",
                "Yanlışlarınız, favorileriniz ve tekrar kuyruğunuz sınırsız şekilde elinizin altında olur.",
              ],
              [
                "Gelişmiş deneme grafiği",
                "Deneme netlerinizi daha geniş geçmişle takip ederek gelişiminizi daha net görürsünüz.",
              ],
              [
                "Daha düzenli çalışma akışı",
                "Limitlere takılmadan, kaldığınız yerden çalışmaya devam edebilirsiniz.",
              ],
            ].map(([title, desc]) => (
              <article
                key={title}
                className="rounded-2xl border border-neutral-200/90 bg-[#fdfcfa] p-4 sm:p-5 min-w-0 shadow-sm"
              >
                <h3 className="text-base font-extrabold text-neutral-950 mb-1.5 leading-snug">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-neutral-700 leading-relaxed">
                  {desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        {typeof onOpenLegalPage === "function" ? (
          <Footer
            variant="premium"
            onOpenLegal={onOpenLegalPage}
            accentTheme={accentTheme}
            accentThemeKey={accentThemeKey}
          />
        ) : null}

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onBack}
            className="min-h-12 px-8 rounded-2xl border-2 border-neutral-300 bg-white text-neutral-900 font-extrabold text-sm w-full sm:w-auto max-w-md shadow-sm hover:bg-neutral-50 transition"
          >
            Şimdilik ücretsiz devam et
          </button>
        </div>
      </div>
    </div>
  );
}
