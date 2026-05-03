import React, { useState } from "react";

export default function AdminGrantModal({
  user,
  isOpen,
  onClose,
  onGrant,
  onRevoke,
}) {
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState("");

  if (!isOpen || !user) return null;

  const targetLabel =
    user.displayName || user.email || user.uid || user.id || "Kullanıcı";

  const submitGrant = async () => {
    const approved = window.confirm(
      `${targetLabel} için Plus işlemi onaylanıyor. Devam edilsin mi?`
    );
    if (!approved) return;
    await onGrant({ days: Number(days), reason });
    setReason("");
  };

  const submitRevoke = async () => {
    const approved = window.confirm(
      `${targetLabel} için Plus iptal edilecek. Devam edilsin mi?`
    );
    if (!approved) return;
    await onRevoke({ reason });
    setReason("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 p-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/40">
        <h3 className="text-xl font-black text-white mb-2">Plus işlemi</h3>
        <p className="text-xs text-slate-400 mb-5 font-medium">
          Hedef kullanıcı: {targetLabel}
        </p>

        <label className="block text-xs text-slate-400 mb-2 font-semibold">
          Gün sayısı (0 = ömür boyu)
        </label>
        <input
          type="number"
          min="0"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-full mb-4 min-h-11 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-medium"
        />

        <label className="block text-xs text-slate-400 mb-2 font-semibold">
          Açıklama
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full mb-5 min-h-[88px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-medium"
          placeholder="İsteğe bağlı not"
        />

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={submitGrant}
            className="flex-1 min-h-11 px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-sm shadow-md hover:bg-emerald-400 transition"
          >
            Plus ver
          </button>
          <button
            type="button"
            onClick={submitRevoke}
            className="flex-1 min-h-11 px-3 py-2 rounded-xl bg-rose-500 text-white font-extrabold text-sm shadow-md hover:bg-rose-400 transition"
          >
            Plus iptal
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 hover:bg-slate-700 transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
