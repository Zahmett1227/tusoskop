import React from "react";

export default function Summary({ currentSubject, score, total, onRetry, goDashboard }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-10">
        <h2 className="text-3xl font-black mb-4 text-emerald-400">
          Test Tamamlandı
        </h2>
        <p className="text-xl text-slate-200 mb-3">{currentSubject}</p>
        <p className="text-slate-400 mb-8">
          Skor: <span className="text-white font-bold">{score} / {total}</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold hover:opacity-90"
          >
            Tekrar çöz
          </button>
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