import React, { useMemo, useState } from "react";
import { QUESTIONS } from "../data/questions";

const HISTORY_KEY = "tusoskop-question-history";
const SUBJECT_ORDER = [
  "Fizyoloji",
  "Patoloji",
  "Farmakoloji",
  "Mikrobiyoloji",
  "Anatomi",
  "Biyokimya",
  "Dahiliye",
  "Pediatri",
  "Genel Cerrahi",
  "Kadın Hastalıkları ve Doğum",
  "Küçük Stajlar",
];

function getQuestionHistoryMap() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const map = {};
    list.forEach((item) => {
      if (item?.questionId) map[item.questionId] = item;
    });
    return map;
  } catch {
    return {};
  }
}

function getTopicStats(ders, konu, questions, historyMap) {
  const topicQuestions = questions.filter((q) => q.ders === ders && q.konu === konu);
  const solved = topicQuestions.map((q) => historyMap[q.id]).filter(Boolean);
  const solvedCount = solved.length;
  const correctCount = solved.filter((x) => x.isCorrect).length;
  const percent = solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : null;

  return {
    total: topicQuestions.length,
    solvedCount,
    correctCount,
    percent,
  };
}

function getProgressColor(percent) {
  if (percent === null) return "bg-slate-700";
  if (percent >= 70) return "bg-gradient-to-r from-emerald-400 to-teal-500";
  if (percent >= 40) return "bg-gradient-to-r from-yellow-300 to-amber-500";
  return "bg-gradient-to-r from-red-400 to-orange-500";
}

export default function TopicTracker({ onBack }) {
  const [openSubjects, setOpenSubjects] = useState({});
  const historyMap = useMemo(() => getQuestionHistoryMap(), []);

  const subjects = useMemo(() => {
    const available = [...new Set(QUESTIONS.map((q) => q.ders))];
    const sortedKnown = SUBJECT_ORDER.filter((name) => available.includes(name));
    const extras = available.filter((name) => !SUBJECT_ORDER.includes(name)).sort((a, b) => a.localeCompare(b, "tr"));
    return [...sortedKnown, ...extras];
  }, []);

  const topicsBySubject = useMemo(() => {
    return subjects.map((ders) => ({
      ders,
      konular: [...new Set(QUESTIONS.filter((q) => q.ders === ders).map((q) => q.konu))].sort((a, b) =>
        a.localeCompare(b, "tr")
      ),
    }));
  }, [subjects]);

  const toggleSubject = (ders) => {
    setOpenSubjects((prev) => ({
      ...prev,
      [ders]: !prev[ders],
    }));
  };

  return (
    <div className="min-h-screen bg-[#020617] px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="rounded-3xl border border-slate-700/70 bg-slate-950/80 p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-emerald-300">Konu Haritam</h1>
              <p className="mt-2 text-sm text-slate-400">
                Deneme ve konu çözüm geçmişine göre konu bazlı başarı durumun.
              </p>
            </div>
            <button
              onClick={onBack}
              className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-slate-800"
            >
              Panele dön
            </button>
          </div>
        </div>

        {topicsBySubject.map(({ ders, konular }) => (
          <div key={ders} className="rounded-3xl border border-slate-700/70 bg-slate-950/80 shadow-xl overflow-hidden">
            <button
              onClick={() => toggleSubject(ders)}
              className="flex w-full items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-900/80 transition"
            >
              <div className="text-left">
                <p className="text-base font-extrabold text-slate-100">{ders}</p>
                <p className="text-xs text-slate-400">{konular.length} konu</p>
              </div>
              <span className="text-lg text-slate-300">{openSubjects[ders] ? "^" : "⌄"}</span>
            </button>

            {openSubjects[ders] && (
              <div className="space-y-3 border-t border-slate-800 px-4 py-4 md:px-5">
                {konular.map((konu) => {
                  const stats = getTopicStats(ders, konu, QUESTIONS, historyMap);
                  const solvedPercent = stats.total > 0 ? Math.round((stats.solvedCount / stats.total) * 100) : 0;
                  const warning = stats.solvedCount > 0 && (stats.percent ?? 0) < 20;

                  return (
                    <div key={`${ders}-${konu}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-bold text-slate-100">{konu}</p>
                        <p className="text-sm font-bold text-slate-300">{stats.percent === null ? "-" : `%${stats.percent} doğru`}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {stats.solvedCount > 0
                          ? `${stats.solvedCount} / ${stats.total} soru çözüldü • ${stats.correctCount} doğru`
                          : "Henüz çözülmedi"}
                      </p>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full ${getProgressColor(stats.percent)} transition-all duration-500`}
                          style={{ width: `${solvedPercent}%` }}
                        />
                      </div>

                      {warning && (
                        <p className="mt-3 text-xs font-semibold text-amber-300">
                          ⚠ Bu konuyu bir kere daha okuman gerekiyor.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}