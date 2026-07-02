import React from "react";

/**
 * Mikro deneme soru kartı — reklam trafiği için sade, mobil öncelikli.
 *
 * Erişilebilirlik: şıklar gerçek <button>; doğru/yanlış YALNIZCA renkle değil,
 * ikon + metin ile de belirtilir. Cevaptan sonra şıklar kilitlenir.
 */

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 10.5l3.5 3.5L15 6.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 6l8 8M14 6l-8 8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const OPTION_LABELS = ["A", "B", "C", "D", "E"];

export default function QuizQuestionCard({
  question,
  index,
  selectedIndex,
  onSelect,
  onNext,
  isLast,
}) {
  const answered = selectedIndex !== null && selectedIndex !== undefined;
  const isCorrect = answered && selectedIndex === question.correctIndex;

  return (
    <div className="w-full">
      {question.topic && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
          {question.subject} · {question.topic}
        </div>
      )}

      <h2 className="text-lg font-bold leading-snug text-slate-100 sm:text-xl">
        {question.questionText}
      </h2>

      <div className="mt-5 flex flex-col gap-2.5" role="listbox" aria-label="Cevap şıkları">
        {question.options.map((option, optionIndex) => {
          const isThisCorrect = optionIndex === question.correctIndex;
          const isThisSelected = optionIndex === selectedIndex;

          let stateClass =
            "border-slate-700 bg-slate-800/60 text-slate-100 hover:border-emerald-500/60 hover:bg-slate-800 active:scale-[0.99]";
          if (answered) {
            if (isThisCorrect) {
              stateClass = "border-emerald-500 bg-emerald-500/15 text-emerald-50";
            } else if (isThisSelected) {
              stateClass = "border-rose-500 bg-rose-500/15 text-rose-50";
            } else {
              stateClass = "border-slate-800 bg-slate-800/30 text-slate-400";
            }
          }

          return (
            <button
              key={optionIndex}
              type="button"
              role="option"
              aria-selected={isThisSelected}
              disabled={answered}
              onClick={() => onSelect(optionIndex)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 disabled:cursor-default ${stateClass}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                  answered && isThisCorrect
                    ? "bg-emerald-500 text-slate-950"
                    : answered && isThisSelected
                      ? "bg-rose-500 text-white"
                      : "bg-slate-700 text-slate-200"
                }`}
              >
                {answered && isThisCorrect ? (
                  <CheckIcon className="h-4 w-4" />
                ) : answered && isThisSelected ? (
                  <CrossIcon className="h-4 w-4" />
                ) : (
                  OPTION_LABELS[optionIndex]
                )}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-5">
          <div
            className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${
              isCorrect
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/40 bg-rose-500/10 text-rose-300"
            }`}
            role="status"
          >
            {isCorrect ? <CheckIcon className="h-5 w-5" /> : <CrossIcon className="h-5 w-5" />}
            {isCorrect ? "Doğru!" : "Yanlış"}
          </div>

          <div className="mt-3 rounded-2xl border border-slate-700/70 bg-slate-800/40 px-4 py-3.5">
            <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-400">
              Açıklama
            </p>
            <p className="text-[14px] leading-relaxed text-slate-200">{question.explanation}</p>
          </div>

          <button
            type="button"
            onClick={onNext}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-base font-black text-slate-950 transition-colors hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            {isLast ? "Sonucumu Gör" : "Sonraki Soru"}
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
              <path
                d="M4 10h11M11 5l5 5-5 5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {!isLast && index === 0 && (
            <p className="mt-3 text-center text-sm font-semibold text-slate-400">
              2 soru daha çözerek mini analizini gör.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
