import React, { useEffect, useState } from "react";

export default function AdminNoteModal({ user, isOpen, onClose, onSave }) {
  const [note, setNote] = useState(user?.adminNote || "");

  useEffect(() => {
    setNote(user?.adminNote || "");
  }, [user?.id, user?.adminNote]);

  if (!isOpen || !user) return null;

  const submit = async () => {
    await onSave(note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 p-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6">
        <h3 className="text-xl font-black text-white mb-2">Admin Notu</h3>
        <p className="text-xs text-slate-400 mb-5">
          Hedef kullanici: {user.displayName || user.email || user.id}
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={6}
          className="w-full mb-5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
          placeholder="Kullaniciya ozel admin notu"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={submit}
            className="flex-1 px-3 py-2 rounded-xl bg-cyan-400 text-slate-950 font-black"
          >
            Notu Kaydet
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
