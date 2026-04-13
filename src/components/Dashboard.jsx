import React from "react";
import SubjectCard from "./SubjectCard";
import TusCountDown from "./TusCountDown";
import { SUBJECTS } from "../data/subjects";
import { QUESTIONS } from "../data/questions";

export default function Dashboard({ setView, startSubject }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10 md:mb-14">
          <div className="text-4xl md:text-5xl mb-3">🩺</div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-emerald-400">
            TUSOSKOP
          </h1>
          <p className="mt-4 text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            Branş seç, test çöz, açıklamayla öğren. Hayalindeki bölüme bir adım at.
          </p>
        </header>

        <div className="mb-10">
          <TusCountDown />
        </div>

        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="flex w-full flex-col items-stretch justify-center gap-3 lg:flex-row lg:items-center">
            <button
              onClick={() => setView("questionSetup")}
              className="group relative overflow-hidden w-full lg:flex-1 lg:min-w-[420px] px-10 py-6 rounded-3xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 text-slate-950 text-lg md:text-xl font-black tracking-wide shadow-[0_0_25px_rgba(16,185,129,0.45)] hover:shadow-[0_0_50px_rgba(34,211,238,0.55)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 animate-pulse"
            >
              <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.45),transparent)] -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="absolute -top-8 -left-8 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
              <span className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-cyan-200/20 blur-2xl" />
              <span className="relative z-10 flex items-center justify-center gap-4">
                <span className="text-2xl">⚡</span>
                <span>Ders / Konu Seçerek Çöz</span>
                <span className="text-xl transition-transform duration-300 group-hover:translate-x-2">→</span>
              </span>
            </button>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col">
              <button
                onClick={() => setView("examSetSelect")}
                className="group relative overflow-hidden w-full lg:min-w-[220px] px-6 py-4 rounded-3xl bg-gradient-to-r from-fuchsia-700 via-violet-700 to-fuchsia-700 text-white text-base font-bold border border-fuchsia-300/20 shadow-[0_0_18px_rgba(168,85,247,0.18)] hover:border-fuchsia-300/40 hover:shadow-[0_0_28px_rgba(168,85,247,0.25)] hover:scale-[1.02] transition-all duration-300"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <span className="text-lg">🧪</span>
                  <span>Deneme Çöz</span>
                </span>
              </button>

              <button
                onClick={() => setView("tracker")}
                className="group relative overflow-hidden w-full lg:min-w-[220px] px-6 py-4 rounded-3xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white text-base font-bold border border-emerald-400/20 shadow-[0_0_18px_rgba(16,185,129,0.10)] hover:border-emerald-400/40 hover:shadow-[0_0_28px_rgba(16,185,129,0.18)] hover:scale-[1.02] transition-all duration-300"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <span className="text-lg">📚</span>
                  <span>TUS HARİTAM</span>
                </span>
              </button>

              <button
                onClick={() => setView("suggestions")}
                className="group relative overflow-hidden w-full lg:min-w-[220px] px-6 py-4 rounded-3xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white text-base font-bold border border-cyan-400/20 shadow-[0_0_18px_rgba(34,211,238,0.10)] hover:border-cyan-400/40 hover:shadow-[0_0_28px_rgba(34,211,238,0.18)] hover:scale-[1.02] transition-all duration-300"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <span className="text-lg">💡</span>
                  <span>ÖNERİLER</span>
                </span>
              </button>
            </div>
          </div>
          <p className="text-sm md:text-base text-emerald-300/90 font-medium text-center">
            İstediğin ders ve konudan hızlı test başlat, tam deneme çöz, eksiklerini gör.
          </p>
        </div>

        {["Temel", "Klinik"].map((type) => (
          <section key={type} className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl md:text-2xl font-bold text-slate-200 border-b border-slate-800 pb-3 w-full">
                {type} Bilimler
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
              {SUBJECTS.filter((s) => s.type === type).map((s) => (
                <SubjectCard
                  key={s.name}
                  subject={s}
                  count={QUESTIONS.filter((item) => item.ders === s.name).length}
                  onClick={() => startSubject(s.name)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}