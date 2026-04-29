import React from "react";
import { PLUS_MONTHLY_PRICE_LABEL } from "../../constants/pricing";
import CoffeeAnimation from "./CoffeeAnimation";

export default function PremiumInfoScreen({ onBack }) {
  return (
    <div className="min-h-dvh bg-[#fcfbf9] text-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-5">
        <section className="rounded-3xl border border-neutral-200 bg-white p-5 md:p-8 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.28)]">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-600 font-black mb-3">Tusoskop Plus</p>
          <h1 className="text-2xl md:text-4xl font-black leading-tight mb-2">
            Daha akıcı, daha sınırsız bir çalışma deneyimi
          </h1>
          <p className="text-sm md:text-base text-neutral-700 mb-4">
            Soru sınırları olmadan çalış, tekrarlarını aksatma ve gelişimini daha net takip et.
          </p>

          <div className="rounded-2xl border border-[#ead9c1] bg-[#fff8ef] px-4 py-4 md:px-5 md:py-5 flex items-start gap-3 md:gap-4">
            <CoffeeAnimation />
            <div>
              <p className="text-base md:text-lg font-black text-[#2f1f11] leading-tight">
                Aylık bir kahve ücretine Plus üyelik almak ister misiniz?
              </p>
              <p className="text-xs md:text-sm text-[#5c4736] mt-1.5">
                Her gün çalışma akışını bölmeden devam etmek isteyenler için tasarlandı.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 inline-block">
            <p className="text-xs text-neutral-600">Tek plan, net fiyat</p>
            <p className="text-2xl font-black text-black">{PLUS_MONTHLY_PRICE_LABEL} / ay</p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {[
            ["Sınırsız soru çözme", "Ders ve konu seçerek, günlük sınıra takılmadan sınırsız soru çözebilirsin."],
            ["Sınırsız deneme", "Deneme pratiğini dilediğin sıklıkta sürdürebil."],
            ["Tam tekrar erişimi", "Tekrar kuyruğu, yanlışların ve favorilerin sınırsız şekilde elinin altında olsun."],
            ["Gelişmiş analiz", "Deneme performansını ve zayıf alanlarını daha detaylı takip et."],
            ["Daha akıcı çalışma düzeni", "Limit ekranlarıyla bölünmeden planına odaklan."],
          ].map(([title, desc]) => (
            <article key={title} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <h3 className="text-base font-black mb-1">{title}</h3>
              <p className="text-sm text-neutral-700">{desc}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-5 md:p-6">
          <h2 className="text-lg font-black mb-1">Tek plan, net fiyat</h2>
          <p className="text-sm text-neutral-700 mb-2">Plus üyelik şu an aylık {PLUS_MONTHLY_PRICE_LABEL}.</p>
          <p className="text-sm text-neutral-600">
            Basit, ulaşılabilir ve düzenli çalışanlar için mantıklı bir adım.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              className="min-h-11 px-5 rounded-2xl bg-black text-white font-black"
            >
              Plus&apos;ı İncele
            </button>
            <button
              type="button"
              onClick={onBack}
              className="min-h-11 px-5 rounded-2xl border border-neutral-300 bg-white text-black font-bold"
            >
              Şimdilik Free ile Devam Et
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
