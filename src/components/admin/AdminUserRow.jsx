import React, { useState } from "react";
import {
  formatPremiumUntil,
  getPremiumLabel,
  isUserPremium,
} from "../../utils/premiumUtils";

function formatPremiumSource(src) {
  if (!src || src === "none") return "—";
  if (src === "admin") return "Admin";
  if (src === "shopify") return "Shopify";
  if (src === "apple") return "App Store";
  if (src === "app_review") return "App Review";
  return String(src);
}

function statusPillClass(label) {
  if (label === "Plus aktif" || label === "Ömür boyu Plus") {
    return "bg-emerald-500/15 text-emerald-200 border-emerald-400/35";
  }
  if (label === "Süresi dolmuş") {
    return "bg-amber-500/12 text-amber-200 border-amber-400/30";
  }
  return "bg-slate-700/70 text-slate-300 border-slate-600/50";
}

export default function AdminUserRow({ user, onOpenGrant, onOpenNote }) {
  const [copyFeedback, setCopyFeedback] = useState("");
  const uidRaw = user?.uid || user?.id;
  const uid = uidRaw != null && String(uidRaw).trim() !== "" ? String(uidRaw) : "";
  const shortUid = !uid ? "—" : `${uid.slice(0, 6)}…${uid.slice(-4)}`;
  const name = user?.displayName || user?.name || "-";
  const email =
    (user?.email && String(user.email).trim()) ||
    (user?.lastKnownEmail && String(user.lastKnownEmail).trim()) ||
    "Email yok";
  const hasFirestoreEmail =
    typeof user?.emailFromFirestore === "string" &&
    user.emailFromFirestore.trim().length > 0;
  const premiumLabel = getPremiumLabel(user);
  const active = isUserPremium(user);
  const until = user?.lifetimePremium
    ? "Ömür boyu"
    : formatPremiumUntil(user?.premiumUntil);
  const source = formatPremiumSource(user?.premiumSource);

  const handleCopyUid = async () => {
    if (!uid) return;
    try {
      await navigator.clipboard.writeText(uid);
      setCopyFeedback("UID kopyalandı");
      setTimeout(() => setCopyFeedback(""), 1200);
    } catch {
      setCopyFeedback("Kopyalanamadı");
      setTimeout(() => setCopyFeedback(""), 1200);
    }
  };

  return (
    <tr className="bg-slate-950/15 hover:bg-slate-900/45 transition-colors">
      <td className="px-4 py-3.5 text-sm font-semibold text-white align-top max-w-[140px]">
        <span className="line-clamp-2">{name}</span>
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-300 align-top max-w-[200px]">
        <div className="break-all font-medium">{email}</div>
        {!hasFirestoreEmail && (
          <div className="text-[10px] text-slate-500 mt-1.5 leading-snug font-medium">
            Veritabanında e-posta yok; listede görünen adres talep kaydından
            okunuyor olabilir. Kalıcı kayıt için kullanıcının giriş yapması yeterlidir.
          </div>
        )}
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-300 font-mono align-top whitespace-nowrap">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="tabular-nums">{shortUid}</span>
          <button
            type="button"
            onClick={handleCopyUid}
            className="shrink-0 self-start min-h-8 px-2.5 py-1 rounded-lg border border-slate-600/90 text-[10px] font-extrabold text-slate-100 hover:bg-slate-800/80 transition"
          >
            Kopyala
          </button>
        </div>
        {copyFeedback ? (
          <div className="text-[10px] text-emerald-300 mt-1 font-semibold">{copyFeedback}</div>
        ) : null}
      </td>
      <td className="px-4 py-3.5 align-top">
        <span
          className={`inline-flex max-w-[11rem] rounded-full border px-2.5 py-1 text-[11px] font-extrabold leading-tight ${statusPillClass(premiumLabel)}`}
        >
          {premiumLabel}
        </span>
      </td>
      <td className={`px-4 py-3.5 text-xs align-top whitespace-nowrap font-medium ${active ? "text-emerald-200/90" : "text-slate-400"}`}>
        {until}
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-400 align-top font-medium">
        {source}
      </td>
      <td className="px-4 py-3.5 text-right align-top">
        <div className="inline-flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenGrant(user)}
            className="min-h-9 px-3 rounded-xl bg-emerald-500 text-slate-950 text-[11px] font-extrabold shadow-md hover:bg-emerald-400 transition"
          >
            Plus yönet
          </button>
          <button
            type="button"
            onClick={() => onOpenNote(user)}
            className="min-h-9 px-3 rounded-xl border border-slate-600 bg-slate-900/60 text-slate-100 text-[11px] font-bold hover:bg-slate-800 transition"
          >
            Not
          </button>
        </div>
      </td>
    </tr>
  );
}
