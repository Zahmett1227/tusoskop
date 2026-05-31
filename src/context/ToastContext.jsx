/* eslint-disable react-refresh/only-export-components -- Provider + paylaşılan hook */
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext({
  showToast: () => {},
});

/**
 * Uygulama genelinde hafif, native alert() yerine geçen toast bildirimleri.
 * Kütüphane kullanmaz; tamamen state + CSS tabanlıdır.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * @param {string} message
   * @param {{ type?: "info"|"success"|"error", duration?: number }} [opts]
   */
  const showToast = useCallback((message, opts = {}) => {
    if (!message) return;
    const id = ++idRef.current;
    const type = opts.type || "info";
    const duration = opts.duration ?? (type === "error" ? 5000 : 3200);
    setToasts((prev) => [...prev, { id, message: String(message), type }]);
    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 z-[100] flex flex-col items-center gap-2 px-4"
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto w-full max-w-md rounded-2xl border px-4 py-3 text-sm font-semibold text-left shadow-xl backdrop-blur-md transition-all animate-toast-in ${
              t.type === "error"
                ? "border-rose-500/40 bg-rose-950/85 text-rose-100"
                : t.type === "success"
                  ? "border-emerald-500/40 bg-emerald-950/85 text-emerald-100"
                  : "border-slate-600/50 bg-slate-900/90 text-slate-100"
            }`}
          >
            <span className="mr-2" aria-hidden>
              {t.type === "error" ? "⚠" : t.type === "success" ? "✓" : "ℹ"}
            </span>
            {t.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
