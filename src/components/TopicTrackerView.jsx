import { useEffect, useState } from 'react';
import { TRACKER_COLUMNS, TRACKER_TOPICS } from '../data/TopicTrackerData';

const STORAGE_KEY = 'tusoskop-topic-tracker-v1';

function readTrackerState() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export default function TopicTrackerView({ onBack }) {
  const [selectedLesson, setSelectedLesson] = useState('Tumu');
  const [query, setQuery] = useState('');
  const [trackerState, setTrackerState] = useState(readTrackerState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trackerState));
  }, [trackerState]);

  const lessons = ['Tumu', ...new Set(TRACKER_TOPICS.map((topic) => topic.ders))];
  const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');

  const filteredTopics = TRACKER_TOPICS.filter((topic) => {
    const matchesLesson =
      selectedLesson === 'Tumu' || topic.ders === selectedLesson;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      `${topic.ders} ${topic.konu}`
        .toLocaleLowerCase('tr-TR')
        .includes(normalizedQuery);

    return matchesLesson && matchesQuery;
  });

  const completedCells = filteredTopics.reduce((total, topic) => {
    const topicState = trackerState[topic.id] || {};
    return total + Object.values(topicState).filter(Boolean).length;
  }, 0);

  const totalCells = filteredTopics.length * TRACKER_COLUMNS.length;
  const completionRate =
    totalCells === 0 ? 0 : Math.round((completedCells / totalCells) * 100);

  const toggleCell = (topicId, columnName) => {
    setTrackerState((current) => {
      const currentTopic = current[topicId] || {};

      return {
        ...current,
        [topicId]: {
          ...currentTopic,
          [columnName]: !currentTopic[columnName],
        },
      };
    });
  };

  const clearFilteredProgress = () => {
    setTrackerState((current) => {
      const next = { ...current };

      filteredTopics.forEach((topic) => {
        delete next[topic.id];
      });

      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <button
                onClick={onBack}
                className="mb-4 text-sm font-semibold text-slate-400 transition hover:text-white"
              >
                ← Panele dön
              </button>

              <h1 className="text-3xl font-black text-emerald-400 md:text-4xl">
                Konu Takip Paneli
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                Her konu için tekrar ve kaynak adımlarını işaretleyebilirsin.
                Seçimlerin bu tarayıcıda saklanır.
              </p>
            </div>

            <div className="grid gap-3 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-sm md:min-w-72">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Görünen konu</span>
                <span className="font-bold text-white">{filteredTopics.length}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Tamamlanan adım</span>
                <span className="font-bold text-white">{completedCells}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">İlerleme</span>
                <span className="font-bold text-emerald-400">%{completionRate}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Konu veya ders ara"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
            />

            <button
              onClick={clearFilteredProgress}
              type="button"
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-red-500 hover:text-red-300"
            >
              Görünenleri sıfırla
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {lessons.map((lesson) => {
              const isActive = selectedLesson === lesson;

              return (
                <button
                  key={lesson}
                  onClick={() => setSelectedLesson(lesson)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {lesson === 'Tumu' ? 'Tümü' : lesson}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/90">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/80 text-left text-slate-300">
                  <th className="sticky left-0 z-20 border-b border-r border-slate-800 bg-slate-950 px-4 py-4 font-semibold">
                    Ders
                  </th>
                  <th className="sticky left-[140px] z-20 border-b border-r border-slate-800 bg-slate-950 px-4 py-4 font-semibold">
                    Konu
                  </th>
                  {TRACKER_COLUMNS.map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap border-b border-slate-800 px-3 py-4 text-center font-semibold"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredTopics.map((topic) => {
                  const topicState = trackerState[topic.id] || {};

                  return (
                    <tr key={topic.id} className="border-b border-slate-800/80">
                      <td className="sticky left-0 z-10 border-r border-slate-800 bg-slate-900 px-4 py-4 font-semibold text-slate-200">
                        {topic.ders}
                      </td>
                      <td className="sticky left-[140px] z-10 min-w-80 border-r border-slate-800 bg-slate-900 px-4 py-4 text-slate-300">
                        {topic.konu}
                      </td>
                      {TRACKER_COLUMNS.map((column) => {
                        const checked = Boolean(topicState[column]);

                        return (
                          <td key={`${topic.id}-${column}`} className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleCell(topic.id, column)}
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                                checked
                                  ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                                  : 'border-slate-700 bg-slate-950 text-slate-500 hover:border-slate-500'
                              }`}
                              aria-pressed={checked}
                              aria-label={`${topic.konu} - ${column}`}
                            >
                              {checked ? '✓' : ''}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {filteredTopics.length === 0 && (
                  <tr>
                    <td
                      colSpan={TRACKER_COLUMNS.length + 2}
                      className="px-6 py-10 text-center text-slate-400"
                    >
                      Aradığın filtreye uygun konu bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
