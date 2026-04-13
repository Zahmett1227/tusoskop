import React from "react";

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
  if (!examQ) return null;

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      
      {/* SOL TARAF: SORU ALANI */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-12 md:py-10 border-r border-slate-900">
        <div className="max-w-3xl mx-auto space-y-8">
          <button onClick={goDashboard} className="text-emerald-400 text-sm hover:underline">
            ← Sınavdan Çık
          </button>

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

          <div className="space-y-3">
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

          <div className="grid grid-cols-2 gap-4 pt-6">
            <button onClick={handleExamBlank} className="px-6 py-4 rounded-2xl border border-slate-800 bg-slate-900/50 font-bold hover:bg-slate-800 transition-all">
              Boş Bırak
            </button>
            <button onClick={handleExamNext} className="px-6 py-4 rounded-2xl bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all">
              {examIndex < examQuestions.length - 1 ? "Sonraki Soru" : "Sınavı Bitir"}
            </button>
          </div>
        </div>
      </div>

      {/* SAĞ TARAF: REALİST MODERNİST OPTİK FORM */}
      <div className="w-80 bg-[#f4f4f2] hidden lg:flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.3)]">
        {/* Optik Başlık */}
        <div className="p-6 bg-[#e5e5e3] border-b border-[#d1d1cf]">
          <h3 className="text-slate-800 font-black text-center tracking-tighter text-xl">CEVAP KAĞIDI</h3>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="bg-white p-2 border border-[#d1d1cf] rounded">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Aday</p>
              <p className="text-xs text-slate-800 font-bold truncate">AHMET</p>
            </div>
            <div className="bg-white p-2 border border-[#d1d1cf] rounded">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Hedef</p>
              <p className="text-xs text-emerald-600 font-bold">TUS 65+</p>
            </div>
          </div>
        </div>

        {/* Optik Kabarcıklar (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-300">
          {examQuestions.map((_, idx) => {
            const currentAnswer = idx === examIndex ? examSelected : examAnswers[idx];
            return (
              <div 
                key={idx} 
                onClick={() => onJump(idx)}
                className={`flex items-center gap-3 p-1.5 rounded-lg cursor-pointer transition-colors ${
                  idx === examIndex ? "bg-cyan-100/50 ring-1 ring-cyan-200" : "hover:bg-slate-200/50"
                }`}
              >
                <span className="w-6 text-[10px] font-bold text-slate-400 text-right">{idx + 1}</span>
                <div className="flex gap-1.5">
                  {['A', 'B', 'C', 'D', 'E'].map((letter, letterIdx) => (
                    <div 
                      key={letter}
                      className={`w-6 h-6 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-bold transition-all ${
                        currentAnswer === letterIdx 
                          ? "bg-[#2d2d2d] text-white border-[#2d2d2d] shadow-inner scale-110" 
                          : "bg-white text-slate-400"
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

        {/* Optik Alt Bilgi */}
        <div className="p-4 bg-[#e5e5e3] border-t border-[#d1d1cf] text-center">
          <p className="text-[10px] text-slate-500 font-medium">
            Toplam 200 Soru • Optik Form V1.0
          </p>
        </div>
      </div>

    </div>
  );
}