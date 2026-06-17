import React from "react";

export default function AvatarIcon({ size = 28, className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`shrink-0 rounded-full flex items-center justify-center border border-white/[0.12] bg-gradient-to-br from-slate-600/40 to-slate-700/30 ${className}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-slate-300/70"
        style={{ width: size * 0.56, height: size * 0.56 }}
      >
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6H4z" />
      </svg>
    </div>
  );
}
