export default function Header({ onStats, onHelp }) {
  return (
    <header className="sticky top-0 z-10 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>🩺</span>
          <h1 className="text-xl font-extrabold tracking-tight text-brand-700">
            Tanıdle
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <IconButton label="Nasıl oynanır" onClick={onHelp}>?</IconButton>
          <IconButton label="İstatistikler" onClick={onStats}>📊</IconButton>
        </div>
      </div>
    </header>
  );
}

function IconButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full text-lg text-brand-700 transition hover:bg-brand-50 active:scale-95"
    >
      {children}
    </button>
  );
}
