import { useMemo, useRef, useState } from "react";
import { suggest } from "../lib/match.js";

// Tanı yazma kutusu + canlı otomatik tamamlama (klavye + dokunmatik).
export default function AnswerInput({ dictionary, onGuess, disabled }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef(null);

  const suggestions = useMemo(
    () => suggest(value, dictionary || []),
    [value, dictionary]
  );

  function submit(text) {
    const t = (text ?? value).trim();
    if (!t || disabled) return;
    onGuess(t);
    setValue("");
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") submit();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit(active >= 0 ? suggestions[active] : value);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Tanını yaz… (örn. apandisit)"
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={onKeyDown}
          className="flex-1 rounded-2xl border-2 border-brand-200 bg-white px-4 py-3.5 text-[15px] outline-none transition focus:border-brand-500 disabled:opacity-60"
        />
        <button
          type="button"
          disabled={disabled || !value.trim()}
          onClick={() => submit()}
          className="rounded-2xl bg-brand-600 px-5 font-bold text-white transition hover:bg-brand-700 active:scale-95 disabled:opacity-40"
        >
          Tahmin
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                // onMouseDown blur'dan önce tetiklenir → seçim kaybolmaz
                onMouseDown={(e) => {
                  e.preventDefault();
                  clearTimeout(blurTimer.current);
                  submit(s);
                }}
                className={`block w-full px-4 py-2.5 text-left text-[15px] transition ${
                  i === active ? "bg-brand-50 text-brand-800" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
