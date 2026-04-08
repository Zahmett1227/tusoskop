import React, { useEffect, useMemo, useState } from 'react';
import { TRACKER_COLUMNS, TRACKER_TOPICS } from '../data/TopicTrackerData';

const STORAGE_KEY = 'tusoskop_tracker_v2';

export default function TopicTracker({ onBack }) {
  const [progressMap, setProgressMap] = useState({});
  const [selectedLesson, setSelectedLesson] = useState('Tümü');
  const [searchTerm, setSearchTerm] = useState('');
  // AKORDEON İÇİN YENİ STATE: Hangi konunun açık olduğunu tutar
  const [expandedTopic, setExpandedTopic] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProgressMap(JSON.parse(saved));
      } catch {
        setProgressMap({});
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressMap));
  }, [progressMap]);

  const lessons = useMemo(() => {
    return ['Tümü', ...new Set(TRACKER_TOPICS.map((item) => item.ders))];
  }, []);

  const filteredTopics = useMemo(() => {
    return TRACKER_TOPICS.filter((topic) => {
      const matchesLesson =
        selectedLesson === 'Tümü' || topic.ders === selectedLesson;

      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        topic.konu.toLowerCase().includes(q) ||
        topic.ders.toLowerCase().includes(q);

      return matchesLesson && matchesSearch;
    });
  }, [selectedLesson, searchTerm]);

  const toggleCell = (topicId, columnName) => {
    const key = `${topicId}__${columnName}`;
    setProgressMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const totalCells = filteredTopics.length * TRACKER_COLUMNS.length;

  const completedCells = useMemo(() => {
    let count = 0;

    for (const topic of filteredTopics) {
      for (const col of TRACKER_COLUMNS) {
        const key = `${topic.id}__${col}`;
        if (progressMap[key]) count++;
      }
    }

    return count;
  }, [filteredTopics, progressMap]);

  const percent = totalCells
    ? Math.round((completedCells / totalCells) * 100)
    : 0;

  const getTopicCompletedCount = (topicId) => {
    return TRACKER_COLUMNS.filter(
      (col) => progressMap[`${topicId}__${col}`]
    ).length;
  };

  const clearAll = () => {
    const ok = window.confirm(
      'Tüm konu takip işaretlemeleri silinsin mi?'
    );
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    setProgressMap({});
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ÜST ALAN */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-emerald-400 tracking-tight">
              Konu Takip
            </h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base">
              Konuları işaretle, tekrarlarını takip et, ilerlemeni kaybetme.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={clearAll}
              className="px-4 py-3 rounded-2xl bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition"
            >
              Tümünü temizle
            </button>

            <button
              onClick={onBack}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold transition"
            >
              Panele dön
            </button>
          </div>
        </div>

        {/* İSTATİSTİK KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400 text-sm">Filtrelenen konu sayısı</p>
            <p className="text-3xl font-black mt-2">{filteredTopics.length}</p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400 text-sm">Tamamlanan kutucuk</p>
            <p className="text-3xl font-black mt-2">
              {completedCells} / {totalCells}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-500/20 bg-slate-900 p-5">
            <p className="text-slate-400 text-sm">İlerleme</p>
            <p className="text-3xl font-black mt-2 text-emerald-400">%{percent}</p>
          </div>
        </div>

        {/* FİLTRELER */}
        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900 p-4 md:p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Ders filtresi</label>
              <select
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-emerald-500"
              >
                {lessons.map((lesson) => (
                  <option key={lesson} value={lesson}>
                    {lesson}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Konu ara</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Örn: inflamasyon, kardiyoloji..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* MASAÜSTÜ TABLO */}
        <div className="hidden lg:block overflow-x-auto rounded-[2rem] border border-slate-800 bg-slate-900 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
          <table className="min-w-[1500px] w-full border-collapse">
            <thead>
              <tr className="bg-slate-950">
                <th className="sticky left-0 z-20 bg-slate-950 border-b border-r border-slate-800 px-4 py-4 text-left min-w-[160px]">
                  Ders
                </th>
                <th className="sticky left-[160px] z-20 bg-slate-950 border-b border-r border-slate-800 px-4 py-4 text-left min-w-[320px]">
                  Konu
                </th>
                {TRACKER_COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="border-b border-r border-slate-800 px-4 py-4 text-center min-w-[120px] text-sm text-slate-300"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredTopics.map((topic) => {
                const topicDone = getTopicCompletedCount(topic.id);
                const rowCompleted = topicDone === TRACKER_COLUMNS.length;

                return (
                  <tr
                    key={topic.id}
                    className={`transition ${
                      rowCompleted
                        ? 'bg-emerald-500/5'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="sticky left-0 z-10 bg-slate-900 border-b border-r border-slate-800 px-4 py-4 font-semibold text-emerald-300 min-w-[160px]">
                      {topic.ders}
                    </td>

                    <td className="sticky left-[160px] z-10 bg-slate-900 border-b border-r border-slate-800 px-4 py-4 min-w-[320px]">
                      <div className="font-semibold">{topic.konu}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {topicDone} / {TRACKER_COLUMNS.length} tamamlandı
                      </div>
                    </td>

                    {TRACKER_COLUMNS.map((col) => {
                      const key = `${topic.id}__${col}`;
                      const checked = !!progressMap[key];

                      return (
                        <td
                          key={col}
                          className="border-b border-r border-slate-800 px-4 py-4 text-center"
                        >
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCell(topic.id, col)}
                              className="w-5 h-5 accent-emerald-500 cursor-pointer"
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBİL / TABLET İÇİN AKORDEON GÖRÜNÜMÜ */}
        <div className="lg:hidden flex flex-col gap-2">
          {filteredTopics.map((topic) => {
            const topicDone = getTopicCompletedCount(topic.id);
            const rowCompleted = topicDone === TRACKER_COLUMNS.length;
            const isExpanded = expandedTopic === topic.id;

            return (
              <div 
                key={topic.id} 
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  rowCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/80'
                }`}
              >
                {/* KONU BAŞLIĞI (Her zaman görünür, tıklanabilir) */}
                <button
                  onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                  className="w-full flex items-center justify-between p-4 text-left focus:outline-none hover:bg-slate-800/50 active:bg-slate-800"
                >
                  <div className="flex-1 pr-4">
                     <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-1 block">
                       {topic.ders}
                     </span>
                     <h3 className="text-sm font-semibold text-slate-200 leading-tight">
                       {topic.konu}
                     </h3>
                  </div>
                  
                  {/* İlerleme Özeti ve Ok İşareti */}
                  <div className="flex items-center gap-3 shrink-0">
                     <span className={`text-xs font-bold ${rowCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>
                       {topicDone}/{TRACKER_COLUMNS.length}
                     </span>
                     <div className={`flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-slate-700' : ''}`}>
                       <span className="text-slate-400 text-xs">▼</span>
                     </div>
                  </div>
                </button>

                {/* İŞARETLEME KUTUCUKLARI (Sadece tıklandığında açılır) */}
                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-slate-800/50 bg-slate-950/30">
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {TRACKER_COLUMNS.map((col) => {
                        const key = `${topic.id}__${col}`;
                        const checked = !!progressMap[key];

                        return (
                          <button
                            key={col}
                            type="button"
                            onClick={() => toggleCell(topic.id, col)}
                            className={`flex min-h-[44px] items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                              checked
                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400'
                                : 'border-slate-700 bg-slate-900 text-slate-400 active:border-slate-500'
                            }`}
                          >
                            <span className="truncate mr-2">{col}</span>
                            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                                checked ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800'
                            }`}>
                              {checked && <span className="text-xs">✓</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredTopics.length === 0 && (
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900 p-10 text-center mt-6">
            <p className="text-xl font-bold text-white">Sonuç bulunamadı</p>
            <p className="text-slate-400 mt-2">
              Arama kelimesini veya ders filtresini değiştir.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}