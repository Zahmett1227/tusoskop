export default function QuestionSetupScreen({
  selectedLesson,
  setSelectedLesson,
  selectedTopic,
  setSelectedTopic,
  availableLessons,
  availableTopics,
  startTopicTest,
  goDashboard,
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-10">
        <h2 className="text-3xl font-black mb-6 text-emerald-400">
          Ders ve konu seç
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Ders</label>
            <select
              value={selectedLesson}
              onChange={(e) => {
                setSelectedLesson(e.target.value);
                setSelectedTopic("");
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-emerald-500"
            >
              <option value="">Ders seç</option>
              {availableLessons.map((lesson) => (
                <option key={lesson} value={lesson}>
                  {lesson}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Konu</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              disabled={!selectedLesson}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-emerald-500 disabled:opacity-50"
            >
              <option value="">Konu seç</option>
              {availableTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-8">
          <button
            onClick={startTopicTest}
            disabled={!selectedLesson || !selectedTopic}
            className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold hover:opacity-90 disabled:opacity-50"
          >
            Soruları başlat
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