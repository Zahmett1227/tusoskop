import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header.jsx";
import GameScreen from "./components/GameScreen.jsx";
import SubjectBar from "./components/SubjectBar.jsx";
import StatsModal from "./components/StatsModal.jsx";
import HowToModal from "./components/HowToModal.jsx";
import { useStats } from "./hooks/useStats.js";
import { pickDaily, dateKey, dayIndexFromDate } from "./lib/daily.js";
import { loadDailyState, saveDailyState } from "./lib/storage.js";

const SEEN_HELP_KEY = "tanidle.seenHelp";

export default function App() {
  const [questions, setQuestions] = useState(null);
  const [dictionary, setDictionary] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [mode, setMode] = useState("daily");
  const [practiceQ, setPracticeQ] = useState(null);
  const [practiceSubject, setPracticeSubject] = useState(null);
  const [finished, setFinished] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(() => !localStorage.getItem(SEEN_HELP_KEY));

  const { stats, record } = useStats();
  const dKey = dateKey();
  const dIndex = dayIndexFromDate();
  const recordedRef = useRef(false);

  // Veri yükle (vakalar + otomatik tamamlama sözlüğü).
  useEffect(() => {
    Promise.all([
      fetch("/questions.json").then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch("/answers.json").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([qs, dict]) => {
        setQuestions(qs);
        setDictionary(dict);
      })
      .catch(() => setLoadError(true));
  }, []);

  const daily = questions ? pickDaily(questions) : null;
  const savedDaily = loadDailyState(dKey);

  // Pratik için branş listesi (soru sayısına göre azalan).
  const subjects = useMemo(() => {
    if (!questions) return [];
    const counts = {};
    for (const q of questions) counts[q.ders] = (counts[q.ders] || 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [questions]);

  // Sayfa açılışında günün oyunu zaten bitmişse footer'ı göster.
  useEffect(() => {
    if (mode === "daily" && savedDaily?.finished) {
      setFinished(true);
      recordedRef.current = true; // o gün zaten işlendi
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  function closeHelp() {
    localStorage.setItem(SEEN_HELP_KEY, "1");
    setShowHelp(false);
  }

  const handleDailyPersist = useCallback(
    (state) => {
      const saved = loadDailyState(dKey);
      saveDailyState(dKey, { ...state, recorded: saved?.recorded || recordedRef.current });
    },
    [dKey]
  );

  const handleDailyFinish = useCallback(
    (result) => {
      setFinished(true);
      const saved = loadDailyState(dKey);
      if (recordedRef.current || saved?.recorded) {
        recordedRef.current = true;
        return;
      }
      recordedRef.current = true;
      record({ ...result, dayIndex: dIndex });
      saveDailyState(dKey, { ...(saved || {}), finished: true, recorded: true });
      setTimeout(() => setShowStats(true), 900);
    },
    [record, dIndex, dKey]
  );

  function startPractice(subject = practiceSubject) {
    if (!questions?.length) return;
    const pool = subject ? questions.filter((q) => q.ders === subject) : questions;
    if (!pool.length) return;
    let q;
    do {
      q = pool[Math.floor(Math.random() * pool.length)];
    } while (daily && q.id === daily.question.id && pool.length > 1);
    setPracticeSubject(subject);
    setPracticeQ(q);
    setMode("practice");
    setFinished(false);
  }

  function backToDaily() {
    setMode("daily");
    setFinished(savedDaily?.finished || false);
  }

  return (
    <div className="min-h-full">
      <Header onStats={() => setShowStats(true)} onHelp={() => setShowHelp(true)} />

      {loadError && (
        <p className="mx-auto max-w-2xl px-4 py-12 text-center text-slate-500">
          Vakalar yüklenemedi. Lütfen sayfayı yenileyin.
        </p>
      )}

      {!questions && !loadError && (
        <p className="mx-auto max-w-2xl px-4 py-12 text-center text-slate-400">
          Vakalar yükleniyor…
        </p>
      )}

      {questions && mode === "daily" && daily && (
        <GameScreen
          key={`daily-${dKey}`}
          question={daily.question}
          number={daily.number}
          mode="daily"
          dictionary={dictionary}
          savedState={savedDaily}
          onPersist={handleDailyPersist}
          onFinish={handleDailyFinish}
        />
      )}

      {questions && mode === "practice" && (
        <SubjectBar
          subjects={subjects}
          active={practiceSubject}
          onSelect={(s) => startPractice(s)}
        />
      )}

      {questions && mode === "practice" && practiceQ && (
        <GameScreen
          key={`practice-${practiceQ.id}`}
          question={practiceQ}
          number={daily?.number}
          mode="practice"
          dictionary={dictionary}
          onFinish={() => setFinished(true)}
        />
      )}

      {/* Bitiş sonrası aksiyon çubuğu */}
      {finished && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-2 px-4 py-3">
            {mode === "daily" ? (
              <button
                type="button"
                onClick={startPractice}
                className="flex-1 rounded-xl bg-brand-600 py-3 font-bold text-white transition hover:bg-brand-700 active:scale-[0.99]"
              >
                Pratik Modu — Yeni Vaka
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={backToDaily}
                  className="rounded-xl border border-brand-300 px-4 py-3 font-bold text-brand-700 transition hover:bg-brand-50"
                >
                  Günün Vakası
                </button>
                <button
                  type="button"
                  onClick={startPractice}
                  className="flex-1 rounded-xl bg-brand-600 py-3 font-bold text-white transition hover:bg-brand-700 active:scale-[0.99]"
                >
                  Yeni Vaka
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showStats && <StatsModal stats={stats} onClose={() => setShowStats(false)} />}
      {showHelp && <HowToModal onClose={closeHelp} />}
    </div>
  );
}
