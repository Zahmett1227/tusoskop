import React, { useEffect, useState } from 'react';

const TARGET_DATE = new Date('2026-08-24T10:00:00');

const calculateTimeLeft = () => {
  const now = new Date();
  const diff = TARGET_DATE - now;

  if (diff <= 0) {
    return {
      finished: true,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  return {
    finished: false,
    months,
    days,
    hours,
    minutes,
  };
};

export default function TusCountdown({ isLightTheme = false }) {

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000 * 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`mb-10 rounded-[2rem] border p-5 md:p-7 ${isLightTheme ? "border-emerald-300 bg-[#fffefb] shadow-md" : "border-emerald-500/20 bg-slate-900/90 shadow-[0_0_30px_rgba(16,185,129,0.08)]"}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`text-sm uppercase tracking-[0.2em] font-bold mb-2 ${isLightTheme ? "text-emerald-600" : "text-emerald-400"}`}>
            TUS Sayacı
          </p>

          {timeLeft.finished ? (
            <h2 className={`text-2xl md:text-4xl font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>
              TUS günü geldi.... Hazırlan Asker
            </h2>
          ) : (
            <>
              <h2 className={`text-2xl md:text-4xl font-black leading-tight ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                TUS’a sadece{' '}
                <span className="text-emerald-400">{timeLeft.months} ay</span>{' '}
                <span className="text-emerald-400">{timeLeft.days} gün</span>{' '}
                kaldı
              </h2>

              <p className={`mt-3 text-sm md:text-base ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                Yaklaşık {timeLeft.hours} saat {timeLeft.minutes} dakika daha.
              </p>
            </>
          )}
        </div>

        <div className="shrink-0">
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border flex items-center justify-center shadow-inner ${isLightTheme ? "border-emerald-300 bg-emerald-100" : "border-emerald-400/20 bg-emerald-500/10"}`}>
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              className={isLightTheme ? "text-emerald-600" : "text-emerald-300"}
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M12 7V12L15.5 14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
