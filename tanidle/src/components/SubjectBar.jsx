// Pratik modunda branş seçimi — yatay kaydırılabilir chip çubuğu.
export default function SubjectBar({ subjects, active, onSelect }) {
  return (
    <div className="sticky top-[57px] z-[9] border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip active={active === null} onClick={() => onSelect(null)}>
          Tümü
        </Chip>
        {subjects.map((s) => (
          <Chip key={s.name} active={active === s.name} onClick={() => onSelect(s.name)}>
            {s.name}
            <span className={active === s.name ? "text-brand-100" : "text-slate-400"}>
              {" "}
              {s.count}
            </span>
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95 ${
        active
          ? "bg-brand-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
