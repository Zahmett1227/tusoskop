import React, { useCallback, useState } from "react";
import { PRICING } from "../../constants/pricing";
import { PLUS_PLANS } from "../../config/plusPlans";
import { createPremiumPurchaseIntent } from "../../services/purchaseIntentService";
import CoffeeAnimation from "./CoffeeAnimation";

function shortAccountId(uid) {
  if (!uid || typeof uid !== "string") return "";
  if (uid.length <= 10) return uid;
  return `${uid.slice(0, 4)}...${uid.slice(-3)}`;
}

export default function PremiumInfoScreen({ onBack, user }) {
  const [copyDone, setCopyDone] = useState(false);
  const [banner, setBanner] = useState("");

  const handleCopyUid = useCallback(async () => {
    if (!user?.uid || typeof navigator?.clipboard?.writeText !== "function") return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2200);
    } catch (e) {
      console.error(e);
    }
  }, [user?.uid]);

  const handlePlanClick = useCallback(
    async (event, plan) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      setBanner("");

      if (!plan?.shopifyUrl?.trim()) {
        setBanner("Bu paket için satın alma bağlantısı hazırlanıyor.");
        return;
      }

      const url = plan.shopifyUrl.trim();

      if (!url.startsWith("https://")) {
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

      window.location.assign(url);
    },
    [user]
  );

  const emailDisplay = user?.email?.trim() ? user.email : "Email bilgisi yok";
  const uidShort = user?.uid ? shortAccountId(user.uid) : "";
  const uidLine =
    user?.uid && uidShort ? uidShort : "Hesap bilgisi bulunamadı";

  return (
    <div className="min-h-dvh bg-[#fcfbf9] text-black px-3 py-4 pb-10 sm:px-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-5 md:space-y-7">
        {banner ? (
          <div className="rounded-2xl border border-amber-200 bg-[#fff8ef] px-4 py-3 text-sm text-[#3d2a18]">
            {banner}
          </div>
        ) : null}

        {/* Hero */}
        <section className="rounded-3xl border border-neutral-200 bg-white p-4 sm:p-6 md:p-8 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.28)]">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] text-neutral-600 font-black mb-2">
            Tusoskop Plus
          </p>
          <h1 className="text-xl sm:text-2xl md:text-4xl font-black leading-tight mb-2">
            Çalışma akışınızı kesintiye uğratmadan devam edin
          </h1>
          <p className="text-sm md:text-base text-neutral-700 mb-4">
            Soru, deneme ve tekrar sınırlarına takılmadan çalışmak isteyenler için
            Plus erişim paketleri.
          </p>

          <div className="rounded-2xl border border-[#ead9c1] bg-[#fff8ef] px-3 py-4 sm:px-5 sm:py-5 flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="flex justify-center sm:justify-start w-full sm:w-auto">
              <div className="scale-90 sm:scale-100 origin-top">
                <CoffeeAnimation />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base md:text-lg font-black text-[#2f1f11] leading-snug">
                Aylık bir kahve ücretine Plus üyelik almak ister misiniz?
              </p>
              <p className="text-xs md:text-sm text-[#5c4736] mt-1.5 leading-relaxed">
                Kısa bir kahve molası fiyatına, çalışma düzeninizi sınırsız hale
                getirin.
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs sm:text-sm text-neutral-600 leading-snug">
            {PRICING.PLUS_STARTS_AT_LABEL}{" "}
            <span className="text-neutral-500 hidden sm:inline">
              {PRICING.PLUS_PLANS_DETAIL_LABEL}
            </span>
          </p>
        </section>

        {/* Hesap */}
        <section className="rounded-3xl border border-[#e8dfd4] bg-white p-4 sm:p-5 shadow-[0_12px_40px_-28px_rgba(60,40,20,0.35)]">
          <h2 className="text-sm font-black text-black mb-1">
            Plus erişimi bu hesaba tanımlanacak
          </h2>
          <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
            Ödeme yapmadan önce doğru hesapla giriş yaptığınızdan emin olun.
          </p>
          <div className="grid gap-2 text-sm">
            <p className="text-neutral-800 break-all">
              <span className="text-neutral-500 font-semibold">Email: </span>
              {emailDisplay}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-neutral-800 break-all min-w-0">
                <span className="text-neutral-500 font-semibold">Hesap ID: </span>
                <span className="font-mono text-[13px] tabular-nums">{uidLine}</span>
              </p>
              <button
                type="button"
                disabled={!user?.uid}
                onClick={handleCopyUid}
                className="shrink-0 min-h-10 px-4 rounded-2xl border border-[#c4a882] bg-[#faf6f0] text-[#2f1f11] text-xs font-bold disabled:opacity-40"
              >
                {copyDone ? "Hesap ID kopyalandı" : "Hesap ID'yi Kopyala"}
              </button>
            </div>
          </div>
        </section>

        {/* Paketler */}
        <section>
          <h2 className="text-lg font-black mb-3 px-0.5">Paketler</h2>
          <ul className="text-xs text-neutral-700 mb-4 px-0.5 space-y-1 list-none">
            {[
              "Sınırsız soru çözme",
              "Sınırsız deneme",
              "Sınırsız tekrar kuyruğu",
              "Sınırsız favori ve yanlış geçmişi",
              "Gelişmiş deneme net grafiği",
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-[#8b6914] shrink-0">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-stretch">
            {PLUS_PLANS.map((plan) => {
              const is1m = plan.id === "plus_1m";
              const hasUrl = Boolean(plan.shopifyUrl?.trim());
              const ring =
                plan.highlight &&
                "ring-2 ring-[#b08968] ring-offset-2 ring-offset-[#fcfbf9] shadow-[0_20px_55px_-30px_rgba(90,60,40,0.45)] scale-[1.01]";
              return (
                <article
                  key={plan.id}
                  className={`relative flex flex-col rounded-3xl border bg-white p-4 sm:p-5 min-h-0 min-w-0 ${
                    plan.highlight
                      ? "border-[#c9a88a] bg-[#fffefb]"
                      : "border-neutral-200"
                  } ${ring || "shadow-[0_14px_40px_-28px_rgba(0,0,0,0.12)]"}`}
                >
                  {plan.badge ? (
                    <span className="absolute -top-2.5 right-3 max-w-[calc(100%-1.5rem)] rounded-full bg-[#3d2918] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white whitespace-normal text-center leading-tight">
                      {plan.badge}
                    </span>
                  ) : null}
                  <h3 className="text-base font-black pr-2">{plan.label}</h3>
                  <p className="text-[11px] font-semibold text-neutral-500 mt-1">
                    {plan.durationLabel}
                  </p>

                  <div className="mt-3 space-y-1 min-w-0">
                    {is1m ? (
                      <p className="text-2xl font-black tabular-nums tracking-tight break-words">
                        {plan.totalPriceLabel}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-neutral-800 tabular-nums break-words">
                          {plan.monthlyPriceLabel}
                          <span className="font-semibold text-neutral-600"> / ay</span>
                        </p>
                        <p className="text-xs text-neutral-600 tabular-nums break-words">
                          Toplam {plan.totalPriceLabel}
                        </p>
                      </>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-neutral-700 leading-relaxed flex-1">
                    {plan.description}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => handlePlanClick(e, plan)}
                    disabled={!hasUrl}
                    className={`mt-4 w-full min-h-11 rounded-2xl font-black text-sm px-3 py-2.5 transition ${
                      hasUrl
                        ? "bg-[#2f1f11] text-white active:scale-[0.99] hover:bg-black"
                        : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                    }`}
                  >
                    {hasUrl ? plan.ctaLabel : "Bağlantı hazırlanıyor"}
                  </button>
                  {!hasUrl ? (
                    <p className="mt-2 text-[10px] text-neutral-500 text-center">
                      Bu paket için satın alma bağlantısı hazırlanıyor.
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        {/* Ödeme sonrası */}
        <section className="rounded-3xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-base font-black mb-2">Ödeme sonrası nasıl aktifleşir?</h2>
          <p className="text-sm text-neutral-700 leading-relaxed">
            Satın alma sonrası Plus erişimi bu hesaba tanımlanır. Erken erişim
            döneminde işlemler manuel kontrol edilebilir; bu yüzden ödeme yapmadan
            önce doğru hesapla giriş yaptığınızdan emin olun.
          </p>
          <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
            Ödeme kontrolünden sonra seçtiğiniz süre hesabınıza eklenir.
          </p>
        </section>

        {/* Plus ile açılanlar */}
        <section className="rounded-3xl border border-neutral-200 bg-[#fffefb] p-4 sm:p-6">
          <h2 className="text-lg font-black mb-4">Plus ile açılanlar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className="rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-4 min-w-0"
              >
                <h3 className="text-sm font-black mb-1 leading-snug">{title}</h3>
                <p className="text-xs text-neutral-700 leading-relaxed">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onBack}
            className="min-h-11 px-6 rounded-2xl border border-neutral-300 bg-white text-black font-bold text-sm w-full sm:w-auto max-w-md"
          >
            Şimdilik Free ile Devam Et
          </button>
        </div>
      </div>
    </div>
  );
}
