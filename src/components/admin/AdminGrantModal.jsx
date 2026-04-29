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

  const submitGrant = async () => {
    const approved = window.confirm(
      `${user.displayName || user.email || user.id} icin premium islemi onaylaniyor. Devam edilsin mi?`
    );
    if (!approved) return;
    await onGrant({ days: Number(days), reason });
    setReason("");
  };

  const submitRevoke = async () => {
    const approved = window.confirm(
      `${user.displayName || user.email || user.id} icin premium iptal edilecek. Devam edilsin mi?`
    );
    if (!approved) return;
    await onRevoke({ reason });
    setReason("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 p-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6">
        <h3 className="text-xl font-black text-white mb-2">Premium Islem</h3>
        <p className="text-xs text-slate-400 mb-5">
          Hedef kullanici: {user.displayName || user.email || user.id}
        </p>

        <label className="block text-xs text-slate-400 mb-2">Gun sayisi (0 = lifetime)</label>
        <input
          type="number"
          min="0"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
        />

        <label className="block text-xs text-slate-400 mb-2">Aciklama</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full mb-5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
          placeholder="Opsiyonel not"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={submitGrant}
            className="flex-1 px-3 py-2 rounded-xl bg-emerald-400 text-slate-950 font-black"
          >
            Premium Ver
          </button>
          <button
            type="button"
            onClick={submitRevoke}
            className="flex-1 px-3 py-2 rounded-xl bg-rose-400 text-slate-950 font-black"
          >
            Premium Iptal
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
