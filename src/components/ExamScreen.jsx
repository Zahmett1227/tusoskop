import React, { useState } from "react";

export default function ExamScreen({
  examQ,
  examIndex,
  examQuestions,
  examAnswers,
  examSelected,
  onJump,
  handleExamSelect,
  handleExamBlank,
  handleExamNext,
  goDashboard,
}) {
  const [isOpticalOpen, setIsOpticalOpen] = useState(false); // Mobil için optik kontrolü

  if (!examQ) return null;

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden relative">
      
      {/* SOL TARAF: SORU ALANI */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-12 md:py-10 border-r border-slate-900">
        <div className="max-w-3xl mx-auto space-y-8">
          <button onClick={goDashboard} className="text-emerald-400 text-sm hover:underline">
            ← Sınavdan Çık
          </button>

          {/* Soru Kartı */}
          <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900/40 p-6 md:p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <span className="px-4 py-1.5 rounded-full bg-slate-800 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Soru {examIndex + 1}
              </span>
              <span className="text-cyan-400 text-xs font-medium uppercase tracking-widest">
                {examQ.ders}
              </span>
            </div>
            <h2 className="text-lg md:text-2xl font-bold leading-relaxed text-slate-100">
              {examQ.q}
            </h2>
          </div>

          {/* Şıklar */}
          <div className="space-y-3 pb-24"> {/* Alt butonlar için boşluk bırakıldı */}
            {examQ.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleExamSelect(i)}
                className={`w-full text-left rounded-2xl border-2 p-4 md:p-6 flex items-start gap-4 transition-all duration-300 group ${
                  examSelected === i
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${
                  examSelected === i ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 text-sm md:text-base leading-6 text-slate-300">
                  {opt}
                </span>
              </button>
            ))}
          </div>

          {/* Alt Kontrol Paneli (Sabitlenmiş) */}
          <div className="fixed bottom-0 left-0 right-0 lg:static p-4 lg:p-0 bg-slate-950/80 backdrop-blur-md lg:bg-transparent border-t border-slate-800 lg:border-none grid grid-cols-2 gap-4 pt-6">
            <button onClick={handleExamBlank} className="px-6 py-4 rounded-2xl border border-slate-800 bg-slate-900/50 font-bold hover:bg-slate-800 transition-all text-sm md:text-base">
              Boş Bırak
            </button>
            <button onClick={handleExamNext} className="px-6 py-4 rounded-2xl bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm md:text-base">
              {examIndex < examQuestions.length - 1 ? "Sonraki Soru" : "Sınavı Bitir"}
            </button>
          </div>
        </div>
      </div>

      {/* SAĞ TARAF / MOBİL MODAL: OPTİK FORM */}
      <div className={`
        fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-0
        w-full lg:w-80 bg-[#f4f4f2] flex flex-col shadow-2xl transition-transform duration-300
        ${isOpticalOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"}
        lg:flex
      `}>
        {/* Mobil Kapatma Butonu */}
        <button 
          onClick={() => setIsOpticalOpen(false)}
          className="lg:hidden absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold z-10"
        >
          ✕
        </button>

        {/* Optik Başlık */}
        <div className="p-6 bg-[#e5e5e3] border-b border-[#d1d1cf]">
          <h3 className="text-slate-800 font-black text-center tracking-tighter text-xl mb-4">CEVAP KAĞIDI</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2 border border-[#d1d1cf] rounded shadow-sm">
              <p className="text-[9px] text-slate-400 uppercase font-black mb-0.5">Aday</p>
              <p className="text-[11px] text-slate-800 font-bold truncate">TUSİYER</p>
            </div>
            <div className="bg-white p-2 border border-[#d1d1cf] rounded shadow-sm">
              <p className="text-[9px] text-slate-400 uppercase font-black mb-0.5">ÖSYM</p>
              <p className="text-[11px] text-slate-800 font-bold">2026-TUS</p>
            </div>
          </div>
        </div>

        {/* Optik Kabarcıklar */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-300">
          {examQuestions.map((_, idx) => {
            const currentAnswer = idx === examIndex ? examSelected : examAnswers[idx];
            const rowBg = idx % 2 === 0 ? "bg-[#f4f4f2]" : "bg-[#ebebe9]";
            const activeStyle = idx === examIndex ? "bg-cyan-100/80 ring-1 ring-cyan-300 z-10" : rowBg;

            return (
              <div 
                key={idx} 
                onClick={() => {
                  onJump(idx);
                  if(window.innerWidth < 1024) setIsOpticalOpen(false); // Mobilde soruya atlayınca optiği kapat
                }}
                className={`flex items-center gap-3 p-1.5 rounded transition-all cursor-pointer group ${activeStyle}`}
              >
                <span className={`w-6 text-[10px] font-black ${idx === examIndex ? "text-cyan-700" : "text-slate-400"} text-right`}>
                  {idx + 1}
                </span>
                <div className="flex gap-1.5">
                  {['A', 'B', 'C', 'D', 'E'].map((letter, letterIdx) => (
                    <div 
                      key={letter}
                      className={`w-6 h-6 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-bold transition-all ${
                        currentAnswer === letterIdx 
                          ? "bg-[#2d2d2d] text-white border-[#2d2d2d] shadow-inner scale-105" 
                          : "bg-white text-slate-400 group-hover:border-slate-500"
                      }`}
                    >
                      {currentAnswer === letterIdx ? "" : letter}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBİL OPTİK AÇMA BUTONU (Floating Action Button) */}
      <button 
        onClick={() => setIsOpticalOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-500 text-slate-950 shadow-2xl flex items-center justify-center z-40 animate-bounce"
      >
        <span className="text-xs font-black">OPTİK</span>
      </button>

    </div>
  );
}