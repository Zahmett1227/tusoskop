import React from "react";

export default function CoffeeAnimation() {
  return (
    <div className="relative w-16 h-16 shrink-0" aria-hidden="true">
      <style>
        {`
          @keyframes coffee-steam-rise {
            0% { opacity: 0; transform: translateY(10px) scale(0.95); }
            20% { opacity: 0.55; }
            80% { opacity: 0.25; }
            100% { opacity: 0; transform: translateY(-14px) scale(1.08); }
          }
        `}
      </style>
      <div className="absolute bottom-2 left-2 right-2 h-8 rounded-b-2xl rounded-t-lg border border-amber-300 bg-gradient-to-b from-[#f5e7d1] to-[#e9d5b2]" />
      <div className="absolute bottom-4 left-5 right-5 h-2 rounded-full bg-[#7a4a22]/80" />
      <div className="absolute bottom-4 -right-1 w-3 h-4 border-2 border-amber-300 rounded-r-full" />

      <span
        className="absolute left-4 top-1 w-[3px] h-5 rounded-full bg-amber-500/60"
        style={{ animation: "coffee-steam-rise 2.4s ease-in-out infinite" }}
      />
      <span
        className="absolute left-7 top-0 w-[3px] h-6 rounded-full bg-amber-500/55"
        style={{ animation: "coffee-steam-rise 2.4s ease-in-out 0.6s infinite" }}
      />
      <span
        className="absolute left-10 top-1 w-[3px] h-5 rounded-full bg-amber-500/50"
        style={{ animation: "coffee-steam-rise 2.4s ease-in-out 1.2s infinite" }}
      />
    </div>
  );
}
