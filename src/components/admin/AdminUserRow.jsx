import React, { useState } from "react";
import {
  formatPremiumUntil,
  getPremiumLabel,
  isUserPremium,
} from "../../utils/premiumUtils";

export default function AdminUserRow({ user, onOpenGrant, onOpenNote }) {
  const [copyFeedback, setCopyFeedback] = useState("");
  const uid = user?.uid || user?.id || "-";
  const shortUid = uid === "-" ? "-" : `${uid.slice(0, 6)}...${uid.slice(-4)}`;
  const name = user?.displayName || "-";
  const email = user?.email || "Email yok";
  const premiumLabel = getPremiumLabel(user);
  const active = isUserPremium(user);
  const until = user?.lifetimePremium ? "Omur boyu" : formatPremiumUntil(user?.premiumUntil);
  const source = user?.premiumSource || "-";

  const handleCopyUid = async () => {
    if (!uid || uid === "-") return;
    try {
      await navigator.clipboard.writeText(uid);
      setCopyFeedback("UID kopyalandi");
      setTimeout(() => setCopyFeedback(""), 1200);
    } catch {
      setCopyFeedback("Kopyalanamadi");
      setTimeout(() => setCopyFeedback(""), 1200);
    }
  };

  return (
    <tr className="border-b border-slate-800">
      <td className="px-3 py-3 text-sm text-white">{name}</td>
      <td className="px-3 py-3 text-xs text-slate-300">
        <div>{email}</div>
        {!user?.email && (
          <div className="text-[10px] text-slate-500 mt-1">
            Kullanici tekrar giris yapinca otomatik guncellenir
          </div>
        )}
      </td>
      <td className="px-3 py-3 text-xs text-slate-300 font-mono">
        <div className="flex items-center gap-2">
          <span>{shortUid}</span>
          <button
            type="button"
            onClick={handleCopyUid}
            className="min-h-8 px-2 py-1 rounded-md border border-slate-700 text-[10px] text-slate-200"
          >
            Kopyala
          </button>
        </div>
        {copyFeedback && <div className="text-[10px] text-emerald-300 mt-1">{copyFeedback}</div>}
      </td>
      <td className={`px-3 py-3 text-xs ${active ? "text-emerald-300" : "text-slate-300"}`}>
        {premiumLabel}
      </td>
      <td className="px-3 py-3 text-xs text-slate-300">{until}</td>
      <td className="px-3 py-3 text-xs text-slate-300">{source}</td>
      <td className="px-3 py-3 text-right">
        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={() => onOpenGrant(user)}
            className="px-3 py-1.5 rounded-lg bg-emerald-400 text-slate-950 text-xs font-black"
          >
            Premium
          </button>
          <button
            type="button"
            onClick={() => onOpenNote(user)}
            className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 text-xs font-black"
          >
            Not
          </button>
        </div>
      </td>
    </tr>
  );
}
