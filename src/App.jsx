import React, { useMemo, useState } from 'react';
import SubjectCard from './components/SubjectCard';
import { TUS_DATA } from './data/tusData';
import { SUBJECTS } from './data/subjects';
import TopicTracker from './components/TopicTrackerView';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const questions = useMemo(() => {
    return currentSubject ? TUS_DATA[currentSubject] || [] : [];
  }, [currentSubject]);

  const q = questions[currentIndex];
  const progress = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;

  const startSubject = (subjectName) => {
    if (!TUS_DATA[subjectName] || TUS_DATA[subjectName].length === 0) return;

    setCurrentSubject(subjectName);
    setCurrentIndex(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setView('study');
  };

  const goDashboard = () => {
    setView('dashboard');
    setCurrentSubject(null);
    setCurrentIndex(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
  };

  const handleSelect = (index) => {
    if (showResult || !q) return;

    setSelected(index);
    setShowResult(true);

    if (index === q.correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setView('summary');
    }
  };

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-14">
            <div className="text-5xl mb-3">🩺</div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-emerald-400">
              TUSOSKOP
            </h1>
            <p className="mt-4 text-slate-400 text-lg">
              Branş seç, mini test çöz, açıklamayla öğren.
            </p>
          </header>

          {['Temel', 'Klinik'].map((type) => (
            <section key={type} className="mb-12">
              <h2 className="text-2xl font-bold mb-5 text-slate-200 border-b border-slate-800 pb-3">
                {type} Bilimler
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {SUBJECTS.filter((s) => s.type === type).map((s) => (
                  <SubjectCard
                    key={s.name}
                    subject={s}
                    count={TUS_DATA[s.name]?.length || 0}
                    onClick={() => startSubject(s.name)}
                  />
                ))}
              </div>
            </section>
          ))}

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
  <button
    onClick={() => setView('suggestions')}
    className="px-6 py-3 rounded-2xl bg-emerald-500 text-white font-bold hover:opacity-90"
  >
    Öneriler
  </button>

  <button
    onClick={() => setView('tracker')}
    className="px-6 py-3 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700"
  >
    Konu Takip
  </button>
</div>
        </div>
      </div>
    );
  }

  if (view === 'suggestions') {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-10">
          <h2 className="text-3xl font-black mb-6 text-emerald-400">
            2027/1 TUS birincisinden tavsiyeler
          </h2>

          <ul className="space-y-4 text-slate-300 leading-relaxed">
            <li>• Kural 1:</li>
            <li>• Pratisyen iken TUS kazanılmaz.</li>
            <li>• Para biriktir</li>
            <li>• Ve hemen ardından istifa et.</li>
            <li> PROFESYONEL TUS VE HALK SAĞLIĞI UZMANI DR.TUĞBA ÇAĞLAR </li>
          </ul>

          <div className="mt-8">
            <button
              onClick={() => setView('dashboard')}
              className="px-5 py-3 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700"
            >
              Panele dön
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (view === 'tracker') {
  return <TopicTracker onBack={goDashboard} />;
}

  if (view === 'summary') {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-10">
          <h2 className="text-3xl font-black mb-4 text-emerald-400">
            Test Tamamlandı
          </h2>

          <p className="text-xl text-slate-200 mb-3">{currentSubject}</p>

          <p className="text-slate-400 mb-8">
            Skor:{' '}
            <span className="text-white font-bold">
              {score} / {questions.length}
            </span>
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => startSubject(currentSubject)}
              className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold hover:opacity-90"
            >
              Tekrar çöz
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

  if (!q) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-2xl font-bold mb-3">Soru bulunamadı</p>

          <button
            onClick={goDashboard}
            className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700"
          >
            Panele dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <button
              onClick={goDashboard}
              className="text-slate-400 hover:text-white font-semibold"
            >
              ← Panele dön
            </button>

            <div className="text-sm text-slate-400 text-right">
              <div>
                {currentIndex + 1} / {questions.length}
              </div>
              <div className="text-emerald-400 font-semibold">
                Skor: {score}
              </div>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div>
              <p className="text-emerald-400 font-bold text-sm uppercase tracking-wider">
                {currentSubject}
              </p>

              <h2 className="text-2xl md:text-3xl font-black mt-2 leading-tight">
                {q.q}
              </h2>
            </div>

            <div className="flex gap-1 text-yellow-500 text-xl shrink-0">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={i < q.diff ? 'opacity-100' : 'opacity-20'}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = q.correct === i;

              let classes =
                'w-full text-left p-5 rounded-2xl border-2 transition flex items-center gap-4 ';

              if (showResult) {
                if (isCorrect) {
                  classes += 'border-emerald-500 bg-emerald-500/10';
                } else if (isSelected && !isCorrect) {
                  classes += 'border-red-500 bg-red-500/10';
                } else {
                  classes += 'border-slate-800 bg-slate-900/40';
                }
              } else {
                classes +=
                  'border-slate-800 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={showResult}
                  className={classes}
                >
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                      showResult
                        ? isCorrect
                          ? 'bg-emerald-500 text-white'
                          : isSelected
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>

                  <span className="text-lg">{opt}</span>
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="mt-8 rounded-[1.5rem] border border-slate-800 bg-slate-950 p-6">
              <p
                className={`text-2xl font-black mb-3 ${
                  selected === q.correct ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {selected === q.correct ? 'Doğru cevap' : 'Yanlış cevap'}
              </p>

              <p className="text-slate-300 leading-relaxed mb-5">
                <span className="font-bold text-white">Açıklama:</span> {q.exp}
              </p>

              <button
                onClick={handleNext}
                className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold hover:opacity-90"
              >
                {currentIndex < questions.length - 1
                  ? 'Sonraki soru'
                  : 'Testi bitir'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
