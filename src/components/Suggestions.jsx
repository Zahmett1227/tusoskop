import React from "react";

export default function Suggestions({ goDashboard }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-10">
        <h2 className="text-3xl font-black mb-6 text-emerald-400">
          2027/1 TUS birincisinden tavsiyeler
        </h2>
        <ul className="space-y-4 text-slate-300 leading-relaxed">
          <li>• Her gün az ama düzenli çalış.</li>
          <li>• Soru çözmeden TUS kazanılmaz.</li>
          <li>• Yanlış yaptığın soruları mutlaka tekrar et.</li>
          <li>• Son aylarda deneme ve tekrar ağırlıklı git.</li>
          <li>• Zayıf olduğun dersleri sona bırakma.</li>
          <li>• Kaynak sayısını değil, tekrar sayısını artır.</li>
          <li>• Motivasyon düşse bile rutini bırakma.</li>
        </ul>
        <div className="mt-8">
          <button
            onClick={goDashboard}
            className="px-5 py-3 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700"
          >
            Panele dön
          </button>
        </div>
      </div>
    </div>
  );
}