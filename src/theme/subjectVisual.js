/**
 * Branş görsel kimliği — accent temadan bağımsız, düşük doygunluklu sol şeritler.
 * Tailwind JIT için tam sınıf adları burada sabit tutulur.
 */
export const SUBJECT_VISUAL = {
  Fizyoloji: {
    bar: "bg-teal-500/85",
    border: "border-l-4 border-l-teal-500/75",
    dot: "bg-teal-400",
  },
  Patoloji: {
    bar: "bg-rose-500/80",
    border: "border-l-4 border-l-rose-500/70",
    dot: "bg-rose-400",
  },
  Farmakoloji: {
    bar: "bg-violet-500/80",
    border: "border-l-4 border-l-violet-500/70",
    dot: "bg-violet-400",
  },
  Mikrobiyoloji: {
    bar: "bg-amber-500/85",
    border: "border-l-4 border-l-amber-500/70",
    dot: "bg-amber-400",
  },
  Anatomi: {
    bar: "bg-sky-500/85",
    border: "border-l-4 border-l-sky-500/70",
    dot: "bg-sky-400",
  },
  Biyokimya: {
    bar: "bg-lime-500/85",
    border: "border-l-4 border-l-lime-500/65",
    dot: "bg-lime-400",
  },
  Dahiliye: {
    bar: "bg-emerald-500/85",
    border: "border-l-4 border-l-emerald-500/75",
    dot: "bg-emerald-400",
  },
  Pediatri: {
    bar: "bg-pink-500/80",
    border: "border-l-4 border-l-pink-500/70",
    dot: "bg-pink-400",
  },
  "Genel Cerrahi": {
    bar: "bg-orange-500/85",
    border: "border-l-4 border-l-orange-500/70",
    dot: "bg-orange-400",
  },
  "Kadın Hastalıkları ve Doğum": {
    bar: "bg-fuchsia-500/80",
    border: "border-l-4 border-l-fuchsia-500/65",
    dot: "bg-fuchsia-400",
  },
  "Küçük Stajlar": {
    bar: "bg-cyan-500/85",
    border: "border-l-4 border-l-cyan-500/70",
    dot: "bg-cyan-400",
  },
};

const FALLBACK = {
  bar: "bg-slate-500/75",
  border: "border-l-4 border-l-slate-500/65",
  dot: "bg-slate-400",
};

export function getSubjectVisual(ders) {
  if (!ders) return FALLBACK;
  return SUBJECT_VISUAL[ders] || FALLBACK;
}
