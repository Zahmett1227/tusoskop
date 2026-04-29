import React from "react";
import { PLUS_MONTHLY_PRICE_LABEL } from "../../constants/pricing";

export default function PremiumInfoScreen({ onBack }) {
  return (
    <div className="min-h-dvh bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 md:p-8">
        <p className="text-xs uppercase tracking-widest text-emerald-300 font-black mb-2">TUSOSKOP Plus</p>
        <h1 className="text-3xl md:text-4xl font-black mb-2">Sinirsiz calisma modu</h1>
        <p className="text-slate-300 mb-5">
          Sinirsiz soru, sinirsiz deneme ve gelismis tekrar analizi ile hazirligini hızlandir.
        </p>
        <p className="text-2xl font-black text-emerald-300 mb-5">{PLUS_MONTHLY_PRICE_LABEL} / ay</p>

        <div className="space-y-2 text-sm text-slate-200 mb-6">
          <p>- Sinirsiz soru cozme</p>
          <p>- Sinirsiz deneme</p>
          <p>- Sinirsiz favori ve yanlis gecmisi</p>
          <p>- Gelismis deneme net grafigi</p>
          <p>- Tekrar kuyrugu ve detayli analiz</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 min-h-11 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-black"
          >
            Cok yakinda
          </button>
          <button
            type="button"
            onClick={onBack}
            className="min-h-11 px-4 rounded-2xl bg-slate-800 text-slate-200 font-bold"
          >
            Geri don
          </button>
        </div>
      </div>
    </div>
  );
}
