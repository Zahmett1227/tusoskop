import React, { useState, useEffect } from "react";
import { generateNicknameSuggestions, validateNickname } from "../../utils/nicknameUtils";
import { checkNicknameAvailable } from "../../services/leaderboardService";

export default function NicknameSetupModal({ onConfirm, onSkip, accentTheme }) {
  const theme = accentTheme || {};
  const [nickname, setNickname] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSuggestions(generateNicknameSuggestions(3));
  }, []);

  const handleChange = (e) => {
    setNickname(e.target.value);
    setError("");
  };

  const handleSuggestion = (s) => {
    setNickname(s);
    setError("");
  };

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    const validation = validateNickname(trimmed);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    setChecking(true);
    const available = await checkNicknameAvailable(trimmed);
    setChecking(false);
    if (!available) {
      setError("Bu rumuz zaten kullanımda. Başka bir tane dene.");
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-[2rem] bg-slate-900 border-t border-white/[0.08] p-6 pb-10 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-700" />

        <div className="mb-5 text-center">
          <div className="text-2xl mb-1">🏆</div>
          <h2 className="text-xl font-black text-white tracking-tight">Sıralamaya Katıl</h2>
          <p className="text-slate-400 text-sm mt-1">
            Rumuzunu seç. Adın ve e-posta adresin hiçbir zaman görünmez.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSuggestion(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                ${nickname === s
                  ? `${theme.primary || "bg-emerald-500"} text-slate-950 border-transparent`
                  : "bg-white/[0.06] border-white/[0.10] text-slate-300 hover:bg-white/[0.10]"
                }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative mb-1">
          <input
            type="text"
            value={nickname}
            onChange={handleChange}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="ya da kendi rumuzu yaz..."
            maxLength={20}
            className="w-full rounded-2xl bg-white/[0.05] border border-white/[0.10] text-white placeholder-slate-500
              px-4 py-3 text-sm font-medium focus:outline-none focus:border-white/30 transition-colors"
          />
          <span className="absolute right-3 top-3 text-xs text-slate-600">{nickname.length}/20</span>
        </div>

        {error && (
          <p className="text-rose-400 text-xs font-medium mb-3 px-1">{error}</p>
        )}

        <p className="text-slate-600 text-xs mb-5 px-1">
          3–20 karakter • Harf, rakam, alt çizgi
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!nickname.trim() || checking || submitting}
          className={`w-full py-3.5 rounded-2xl font-black text-slate-950 text-sm
            transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
            ${theme.primary || "bg-emerald-500"} ${theme.primaryHover || "hover:bg-emerald-400"}`}
        >
          {checking ? "Kontrol ediliyor…" : submitting ? "Kaydediliyor…" : "Sıralamaya Katıl"}
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="w-full mt-3 py-2.5 rounded-2xl font-bold text-slate-500 text-sm
            hover:text-slate-400 transition-colors"
        >
          Şimdi Değil
        </button>
      </div>
    </div>
  );
}
