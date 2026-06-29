import { useEffect, useMemo, useState } from "react";
import ResultScreen from "./ResultScreen.jsx";
import AnswerInput from "./AnswerInput.jsx";
import { isCorrect } from "../lib/match.js";

// Tahmin hakkı = ipucu sayısı + 1 (son ipucu açılınca bir hak daha kalır).
export function maxGuessesFor(question) {
  return question.clues.length + 1;
}

// Tek bir vakayı oynatır (serbest metin / tanı modeli).
export default function GameScreen({
  question,
  number,
  mode,
  dictionary,
  savedState,
  onPersist,
  onFinish,
}) {
  // guesses: yazılan tanı metinleri (sırayla)
  const [guesses, setGuesses] = useState(() => savedState?.guesses || []);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    setGuesses(savedState?.guesses || []);
  }, [question.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxGuesses = maxGuessesFor(question);
  const records = useMemo(
    () => guesses.map((g) => ({ text: g, correct: isCorrect(g, question.answer) })),
    [guesses, question.answer]
  );
  const solved = records.some((r) => r.correct);
  const wrongCount = records.filter((r) => !r.correct).length;
  const lost = !solved && guesses.length >= maxGuesses;
  const finished = solved || lost;
  const cluesShown = Math.min(1 + wrongCount, question.clues.length);

  useEffect(() => {
    onPersist?.({ guesses, finished, solved });
    if (finished) {
      onFinish?.({
        solved,
        guessNumber: solved ? guesses.length : maxGuesses,
        guesses: records.map((r) => ({ correct: r.correct })),
      });
    }
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleGuess(text) {
    if (finished) return;
    setGuesses((g) => [...g, text]);
    if (!isCorrect(text, question.answer)) setShakeKey((k) => k + 1);
  }

  const wrongGuesses = records.filter((r) => !r.correct);

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
        {Array.from({ length: maxGuesses }).map((_, i) => {
          const r = records[i];
          const cls = !r ? "bg-slate-200" : r.correct ? "bg-brand-500" : "bg-rose-400";
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

      {/* Tahmin girişi */}
      {!finished && (
        <div className="mt-4">
          <AnswerInput dictionary={dictionary} onGuess={handleGuess} />
          <p className="mt-2 px-1 text-xs text-slate-400">
            {maxGuesses - wrongCount} tahmin hakkın kaldı
          </p>
        </div>
      )}

      {/* Yanlış denenenler */}
      {wrongGuesses.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {wrongGuesses.map((r, i) => (
            <span
              key={i}
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm text-rose-500 line-through"
            >
              {r.text}
            </span>
          ))}
        </div>
      )}

      {finished && (
        <ResultScreen
          question={question}
          number={number}
          mode={mode}
          solved={solved}
          guesses={records.map((r) => ({ correct: r.correct }))}
          maxGuesses={maxGuesses}
        />
      )}
    </div>
  );
}
