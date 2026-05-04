import React, { useMemo, useState } from "react";
import { useQuestions } from "../hooks/useQuestions";

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

const SUBJECT_THEME_MAP = {
  Fizyoloji: {
    subject: "border-emerald-300/35 bg-gradient-to-br from-emerald-900/40 via-slate-950 to-slate-900/80",
    topic: "border-emerald-300/35 bg-gradient-to-br from-emerald-900/45 via-slate-900/90 to-slate-900/70",
    heading: "text-emerald-100",
    percent: "text-emerald-200",
  },
  Patoloji: {
    subject: "border-rose-300/35 bg-gradient-to-br from-rose-900/40 via-slate-950 to-slate-900/80",
    topic: "border-rose-300/35 bg-gradient-to-br from-rose-900/45 via-slate-900/90 to-slate-900/70",
    heading: "text-rose-100",
    percent: "text-rose-200",
  },
  Farmakoloji: {
    subject: "border-indigo-300/35 bg-gradient-to-br from-indigo-900/45 via-slate-950 to-slate-900/80",
    topic: "border-indigo-300/35 bg-gradient-to-br from-indigo-900/50 via-slate-900/90 to-slate-900/70",
    heading: "text-indigo-100",
    percent: "text-indigo-200",
  },
  Mikrobiyoloji: {
    subject: "border-cyan-300/35 bg-gradient-to-br from-cyan-900/40 via-slate-950 to-slate-900/80",
    topic: "border-cyan-300/35 bg-gradient-to-br from-cyan-900/45 via-slate-900/90 to-slate-900/70",
    heading: "text-cyan-100",
    percent: "text-cyan-200",
  },
  Anatomi: {
    subject: "border-sky-300/35 bg-gradient-to-br from-sky-900/40 via-slate-950 to-slate-900/80",
    topic: "border-sky-300/35 bg-gradient-to-br from-sky-900/45 via-slate-900/90 to-slate-900/70",
    heading: "text-sky-100",
    percent: "text-sky-200",
  },
  Biyokimya: {
    subject: "border-amber-300/35 bg-gradient-to-br from-amber-900/35 via-slate-950 to-slate-900/80",
    topic: "border-amber-300/35 bg-gradient-to-br from-amber-900/40 via-slate-900/90 to-slate-900/70",
    heading: "text-amber-100",
    percent: "text-amber-200",
  },
  Dahiliye: {
    subject: "border-violet-300/35 bg-gradient-to-br from-violet-900/40 via-slate-950 to-slate-900/80",
    topic: "border-violet-300/35 bg-gradient-to-br from-violet-900/45 via-slate-900/90 to-slate-900/70",
    heading: "text-violet-100",
    percent: "text-violet-200",
  },
  Pediatri: {
    subject: "border-pink-300/35 bg-gradient-to-br from-pink-900/40 via-slate-950 to-slate-900/80",
    topic: "border-pink-300/35 bg-gradient-to-br from-pink-900/45 via-slate-900/90 to-slate-900/70",
    heading: "text-pink-100",
    percent: "text-pink-200",
  },
  "Genel Cerrahi": {
    subject: "border-red-300/35 bg-gradient-to-br from-red-900/40 via-slate-950 to-slate-900/80",
    topic: "border-red-300/35 bg-gradient-to-br from-red-900/45 via-slate-900/90 to-slate-900/70",
    heading: "text-red-100",
    percent: "text-red-200",
  },
  "Kadın Hastalıkları ve Doğum": {
    subject: "border-fuchsia-300/35 bg-gradient-to-br from-fuchsia-900/40 via-slate-950 to-slate-900/80",
    topic: "border-fuchsia-300/35 bg-gradient-to-br from-fuchsia-900/45 via-slate-900/90 to-slate-900/70",
    heading: "text-fuchsia-100",
    percent: "text-fuchsia-200",
  },
  "Küçük Stajlar": {
    subject: "border-teal-300/35 bg-gradient-to-br from-teal-900/40 via-slate-950 to-slate-900/80",
    topic: "border-teal-300/35 bg-gradient-to-br from-teal-900/45 via-slate-900/90 to-slate-900/70",
    heading: "text-teal-100",
    percent: "text-teal-200",
  },
};

const DEFAULT_SUBJECT_THEME = {
  subject: "border-slate-600/70 bg-gradient-to-br from-slate-900/70 via-slate-950 to-slate-900/80",
  topic: "border-slate-600/70 bg-gradient-to-br from-slate-900/85 to-slate-900/60",
  heading: "text-slate-100",
  percent: "text-violet-100",
};

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
  const { questions: QUESTIONS } = useQuestions();
  const [openSubjects, setOpenSubjects] = useState({});
  const historyMap = useMemo(() => getQuestionHistoryMap(), []);

  const subjects = useMemo(() => {
    const list = QUESTIONS || [];
    const available = [...new Set(list.map((q) => q.ders))];
    const sortedKnown = SUBJECT_ORDER.filter((name) => available.includes(name));
    const extras = available.filter((name) => !SUBJECT_ORDER.includes(name)).sort((a, b) => a.localeCompare(b, "tr"));
    return [...sortedKnown, ...extras];
  }, [QUESTIONS]);

  const topicsBySubject = useMemo(() => {
    const list = QUESTIONS || [];
    return subjects.map((ders) => ({
      ders,
      konular: [...new Set(list.filter((q) => q.ders === ders).map((q) => q.konu))].sort((a, b) =>
        a.localeCompare(b, "tr")
      ),
    }));
  }, [subjects, QUESTIONS]);

  const toggleSubject = (ders) => {
    setOpenSubjects((prev) => ({
      ...prev,
      [ders]: !prev[ders],
    }));
  };

  const overallStats = useMemo(() => {
    const list = QUESTIONS || [];
    const totalQuestions = list.length;
    const solvedCount = Object.keys(historyMap).length;
    const correctCount = Object.values(historyMap).filter((item) => item?.isCorrect).length;
    const accuracy = solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0;
    const completion = totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0;
    return { totalQuestions, solvedCount, correctCount, accuracy, completion };
  }, [historyMap, QUESTIONS]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-violet-300/25 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/70 p-6 shadow-[0_25px_70px_-45px_rgba(139,92,246,0.9)]">
          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-14 -bottom-14 h-44 w-44 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center rounded-full border border-violet-200/20 bg-violet-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-violet-100/80">
                Premium Yeterlilik Analizi
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">Konu Yeterlilik Düzeyim</h1>
              <p className="mt-2 text-sm text-slate-300/80">
                Çözüm geçmişine göre konu bazlı yetkinlik seviyen, açık alanların ve tekrar ihtiyacın.
              </p>
            </div>
            <button
              onClick={onBack}
              className="rounded-2xl border border-violet-200/25 bg-slate-900/80 px-5 py-2.5 text-sm font-bold text-slate-100 transition hover:bg-slate-800/90 hover:border-violet-200/45"
            >
              Panele dön
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Genel doğruluk</p>
            <p className="mt-2 text-2xl font-black text-emerald-300">%{overallStats.accuracy}</p>
          </div>
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tamamlanma</p>
            <p className="mt-2 text-2xl font-black text-cyan-300">%{overallStats.completion}</p>
          </div>
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Çözülen</p>
            <p className="mt-2 text-2xl font-black text-white">{overallStats.solvedCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Toplam soru</p>
            <p className="mt-2 text-2xl font-black text-white">{overallStats.totalQuestions}</p>
          </div>
        </div>

        {topicsBySubject.map(({ ders, konular }) => {
          const subjectTheme = SUBJECT_THEME_MAP[ders] || DEFAULT_SUBJECT_THEME;
          return (
          <div
            key={ders}
            className={`overflow-hidden rounded-3xl border shadow-xl ${subjectTheme.subject}`}
          >
            <button
              onClick={() => toggleSubject(ders)}
              className="flex w-full cursor-pointer items-center justify-between px-5 py-4 transition hover:bg-black/20"
            >
              <div className="text-left">
                <p className={`text-base font-extrabold ${subjectTheme.heading}`}>{ders}</p>
                <p className="text-xs text-slate-300/80">{konular.length} konu başlığı</p>
              </div>
              <span className="text-lg text-slate-300">{openSubjects[ders] ? "▴" : "▾"}</span>
            </button>

            {openSubjects[ders] && (
              <div className="space-y-3 border-t border-white/10 px-4 py-4 pl-6 md:px-5 md:pl-10">
                {konular.map((konu) => {
                  const stats = getTopicStats(ders, konu, QUESTIONS, historyMap);
                  const solvedPercent = stats.total > 0 ? Math.round((stats.solvedCount / stats.total) * 100) : 0;
                  const warning = stats.solvedCount > 0 && (stats.percent ?? 0) < 20;

                  return (
                    <div
                      key={`${ders}-${konu}`}
                      className={`rounded-2xl border px-4 py-4 backdrop-blur-[1px] transition-transform duration-200 ease-out will-change-transform active:scale-[0.995] md:hover:scale-[1.02] md:hover:-translate-x-1 ${subjectTheme.topic}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className={`font-bold ${subjectTheme.heading}`}>{konu}</p>
                        <p className={`text-sm font-bold ${subjectTheme.percent}`}>{stats.percent === null ? "-" : `%${stats.percent} doğru`}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {stats.solvedCount > 0
                          ? `${stats.solvedCount} / ${stats.total} soru çözüldü • ${stats.correctCount} doğru`
                          : "Henüz çözülmedi"}
                      </p>

                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full ${getProgressColor(stats.percent)} transition-all duration-500`}
                          style={{ width: `${solvedPercent}%` }}
                        />
                      </div>

                      {warning && (
                        <p className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
                          ⚠ Bu konuyu bir kere daha tekrar etmen faydalı olur.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
}