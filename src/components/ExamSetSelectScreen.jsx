export default function ExamSetSelectScreen({ onSelectSet, goDashboard }) {
  const examSets = [
    {
      key: "sonbahar",
      title: "Sonbahar",
      desc: "Klasik genel deneme. Dengeli dağılım, gerçek sınav hissi.",
    },
    {
      key: "kamp",
      title: "Kamp",
      desc: "Yoğun çalışma modu. Tempolu ve odaklı deneme seti.",
    },
    {
      key: "tekrar",
      title: "Tekrar",
      desc: "Tekrar amaçlı çözüm için uygun, ritim koruyan deneme.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={goDashboard}
          className="mb-4 text-sm text-emerald-400"
        >
          ← Panele dön
        </button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black text-fuchsia-400">
            Deneme Seç
          </h1>
          <p className="mt-3 text-slate-400 text-sm md:text-base max-w-2xl">
            Başlamadan önce bir deneme seti seç. Her biri aynı sistemle çalışır ama farklı his verir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {examSets.map((set) => (
            <button
              key={set.key}
              onClick={() => onSelectSet(set.key)}
              className="text-left rounded-3xl border border-slate-800 bg-slate-900/70 p-5 md:p-6 hover:border-fuchsia-500/50 hover:bg-slate-900 transition-all"
            >
              <div className="text-2xl mb-3">🧪</div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                {set.title}
              </h2>
              <p className="mt-3 text-slate-400 text-sm md:text-base leading-6">
                {set.desc}
              </p>
              <div className="mt-5 text-fuchsia-400 font-bold text-sm">
                Bu denemeyi başlat →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}