import React from "react";
import { EXAM_SETS, FIXED_EXAM_CARD_SUBTITLE } from "../data/exams";

export default function ExamSetSelectScreen({ onSelectSet, goDashboard }) {
  const categories = [
    { name: "Kamp", icon: "⛺", color: "text-orange-400", bg: "border-orange-500/20" },
    { name: "Bahar", icon: "🌸", color: "text-emerald-400", bg: "border-emerald-500/20" },
    { name: "Tekrar", icon: "🔄", color: "text-cyan-400", bg: "border-cyan-500/20" }
  ];

  return (
    <div
      className="min-h-dvh bg-slate-950 text-white p-4 md:p-10 overflow-y-auto"
      style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))", paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter">Sınav Merkezi</h2>
            <p className="text-slate-500 font-medium">
              Sabit 200 soruluk denemelerden birini seç. İlk 100 Temel, son 100 Klinik; her kullanıcıda aynı set ve sıra.
            </p>
          </div>
          <button onClick={goDashboard} className="px-6 py-2 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all font-bold">
            ← Geri Dön
          </button>
        </header>

        {/* 3 SÜTUNLU YAPI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <div key={cat.name} className="flex flex-col gap-4">
              {/* Kategori Başlığı */}
              <div className={`flex items-center gap-3 p-4 rounded-3xl border-b-4 ${cat.bg} bg-slate-900/40 mb-2`}>
                <span className="text-2xl">{cat.icon}</span>
                <h3 className={`text-xl font-black uppercase tracking-widest ${cat.color}`}>
                  {cat.name} DENEMELERİ
                </h3>
              </div>

              {/* Bu Kategoriye Ait Denemeler */}
              <div className="space-y-3">
                {EXAM_SETS.filter(exam => exam.category === cat.name).map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => onSelectSet(exam.id)}
                    className="w-full group bg-slate-900/30 border border-slate-800 p-5 rounded-3xl text-left hover:border-slate-600 hover:bg-slate-900/60 transition-all duration-300"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-200 group-hover:text-white">{exam.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 font-black uppercase">
                          {FIXED_EXAM_CARD_SUBTITLE} • {exam.difficulty}
                          {exam.setVersion ? ` • Set ${exam.setVersion}` : ""}
                        </p>
                        {exam.description ? (
                          <p className="text-[11px] text-slate-400 mt-2 leading-snug font-medium normal-case">
                            {exam.description}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-xl opacity-20 group-hover:opacity-100 transition-opacity">🚀</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}