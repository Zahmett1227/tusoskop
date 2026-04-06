export default function SubjectCard({ subject, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        group relative overflow-hidden text-left p-6 rounded-3xl
        bg-slate-900/80 border border-emerald-500/20
        shadow-[0_0_0_rgba(16,185,129,0)]
        hover:border-emerald-400/60
        hover:shadow-[0_0_25px_rgba(16,185,129,0.18)]
        hover:-translate-y-1
        transition-all duration-300 w-full
      "
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-400/5 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-400/10 blur-2xl rounded-full group-hover:bg-emerald-400/20 transition-all duration-300" />

      <div className="relative z-10">
        <div className="text-xl font-bold mb-2 text-white group-hover:text-emerald-300 transition-colors duration-300">
          {subject.name}
        </div>

        <div className="text-sm text-slate-400 mb-4">
          Mini konu testi
        </div>

        <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 text-emerald-300 px-3 py-1 text-xs font-bold">
          {count} soru hazır
        </div>
      </div>
    </button>
  );
}