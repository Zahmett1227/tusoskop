import { useEffect, useMemo, useState } from "react";
import ResultScreen from "./ResultScreen.jsx";

export const MAX_GUESSES = 4;

// Tek bir vakayı oynatır. Açılan ipucu = 1 + yanlış tahmin sayısı.
export default function GameScreen({
  question,
  number,
  mode,
  savedState,
  onPersist,
  onFinish,
}) {
  // guesses: tıklanan şık indeksleri sırayla
  const [guesses, setGuesses] = useState(() => savedState?.guesses || []);
  const [shakeKey, setShakeKey] = useState(0);

  // Soru değişince (pratik modunda) durumu sıfırla.
  useEffect(() => {
    setGuesses(savedState?.guesses || []);
  }, [question.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const wrongCount = guesses.filter((g) => g !== question.correct).length;
  const solved = guesses.includes(question.correct);
  const lost = !solved && wrongCount >= MAX_GUESSES;
  const finished = solved || lost;

  const cluesShown = Math.min(1 + wrongCount, question.clues.length);

  const guessRecords = useMemo(
    () => guesses.map((g) => ({ correct: g === question.correct })),
    [guesses, question.correct]
  );

  // Durum kalıcılığı (günlük mod) + bitiş bildirimi.
  useEffect(() => {
    onPersist?.({ guesses, finished, solved });
    if (finished) {
      onFinish?.({
        solved,
        guessNumber: solved ? guesses.length : MAX_GUESSES,
        guesses: guessRecords,
      });
    }
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleGuess(idx) {
    if (finished || guesses.includes(idx)) return;
    const correct = idx === question.correct;
    setGuesses((g) => [...g, idx]);
    if (!correct) setShakeKey((k) => k + 1);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-5">
      {/* Üst bilgi */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="rounded-full bg-brand-100 px-3 py-1 font-semibold text-brand-700">
          {mode === "daily" ? `Günün Vakası #${number}` : "Pratik"}
        </span>
        <span className="font-medium text-slate-500">
          {question.ders}
          {question.konu ? ` · ${question.konu}` : ""}
        </span>
      </div>

      {/* Tahmin göstergesi */}
      <div className="mb-4 flex gap-1.5">
        {Array.from({ length: MAX_GUESSES }).map((_, i) => {
          const g = guessRecords[i];
          const cls = !g
            ? "bg-slate-200"
            : g.correct
              ? "bg-brand-500"
              : "bg-rose-400";
          return <div key={i} className={`h-1.5 flex-1 rounded-full ${cls}`} />;
        })}
      </div>

      {/* İpuçları */}
      <div key={shakeKey} className={`space-y-2 ${!finished && shakeKey ? "animate-shake" : ""}`}>
        {question.clues.slice(0, cluesShown).map((clue, i) => (
          <div
            key={i}
            className="animate-fade-up rounded-2xl border border-brand-100 bg-white p-4 text-[15px] leading-relaxed text-slate-800 shadow-sm"
          >
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {i + 1}
            </span>
            {clue}
          </div>
        ))}
        {!finished && cluesShown < question.clues.length && (
          <p className="px-1 text-center text-xs text-slate-400">
            Yanlış tahmin yeni ipucu açar — {question.clues.length - cluesShown} ipucu daha var
          </p>
        )}
      </div>

      {/* Soru */}
      <div className="mt-5 rounded-2xl bg-brand-700 p-4 text-[15px] font-semibold leading-relaxed text-white shadow">
        {question.prompt}
      </div>

      {/* Şıklar */}
      <div className="mt-4 grid gap-2.5">
        {question.options.map((opt, idx) => {
          const picked = guesses.includes(idx);
          const isCorrect = idx === question.correct;
          let cls =
            "border-slate-200 bg-white text-slate-800 hover:border-brand-400 hover:bg-brand-50";
          if (finished && isCorrect)
            cls = "border-brand-500 bg-brand-50 text-brand-800 font-semibold";
          else if (picked && !isCorrect)
            cls = "border-rose-200 bg-rose-50 text-rose-400 line-through";
          else if (finished) cls = "border-slate-200 bg-white text-slate-400";
          return (
            <button
              key={idx}
              type="button"
              disabled={finished || picked}
              onClick={() => handleGuess(idx)}
              className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left text-[15px] leading-snug transition active:scale-[0.99] disabled:cursor-default ${cls}`}
            >
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-current text-xs font-bold">
                {String.fromCharCode(65 + idx)}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {finished && (
        <ResultScreen
          question={question}
          number={number}
          mode={mode}
          solved={solved}
          guesses={guessRecords}
          maxGuesses={MAX_GUESSES}
        />
      )}
    </div>
  );
}
