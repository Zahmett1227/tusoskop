import React, { useCallback, useEffect, useState } from "react";
import {
  activateIntentAndGrantPremium,
  getPremiumPurchaseIntents,
} from "../../services/adminService";

function shortUid(uid) {
  if (!uid || typeof uid !== "string") return "—";
  if (uid.length <= 14) return uid;
  return `${uid.slice(0, 5)}…${uid.slice(-4)}`;
}

function intentStatusLabel(status) {
  switch (status) {
    case "started":
      return "Bekliyor";
    case "manually_activated":
      return "Aktive edildi";
    case "cancelled":
      return "İptal";
    case "needs_review":
      return "İncelenecek";
    default:
      return status || "—";
  }
}

function intentStatusPillClass(status) {
  switch (status) {
    case "started":
      return "bg-amber-500/15 text-amber-200 border-amber-400/30";
    case "manually_activated":
      return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";
    case "cancelled":
      return "bg-slate-600/40 text-slate-300 border-slate-500/30";
    case "needs_review":
      return "bg-violet-500/15 text-violet-200 border-violet-400/25";
    default:
      return "bg-slate-700/50 text-slate-300 border-slate-600/40";
  }
}

function grantButtonLabel(days) {
  if (days === 30) return "30 gün Plus ver";
  if (days === 90) return "90 gün Plus ver";
  if (days === 180) return "180 gün Plus ver";
  return `${days} gün Plus ver`;
}

function IntentStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ${intentStatusPillClass(status)}`}
    >
      {intentStatusLabel(status)}
    </span>
  );
}

export default function AdminPurchaseIntentsTab({
  currentUser,
  onPremiumActivated,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getPremiumPurchaseIntents(50);
      setItems(list);
    } catch (e) {
      console.error(e);
      setError("Ödeme talepleri yüklenemedi.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleActivate = async (intent) => {
    if (!currentUser?.uid || !intent?.id) return;
    setBusyId(intent.id);
    setError("");
    try {
      await activateIntentAndGrantPremium({
        intentId: intent.id,
        intent,
        adminUid: currentUser.uid,
        adminEmail: currentUser.email || null,
      });
      if (typeof onPremiumActivated === "function") {
        await onPremiumActivated();
      }
      await refresh();
    } catch (e) {
      console.error(e);
      setError(e?.message || "Aktivasyon başarısız.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <p className="text-slate-400 text-sm py-8 font-medium">Yükleniyor…</p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate-400 text-sm font-medium max-w-xl leading-relaxed">
          Son 50 kayıt — Shopify ödeme öncesi niyet bildirimleri
        </p>
        <button
          type="button"
          onClick={() => refresh()}
          className="shrink-0 min-h-10 px-4 rounded-xl text-xs font-extrabold bg-slate-800/90 border border-slate-600 text-slate-100 hover:bg-slate-800 transition shadow-sm"
        >
          Yenile
        </button>
      </div>

      {error ? (
        <p className="text-rose-300 text-sm font-medium">{error}</p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-slate-500 text-sm font-medium">Henüz kayıt yok.</p>
      ) : (
        <>
          {/* Mobil kartlar */}
          <div className="md:hidden space-y-3">
            {items.map((row) => {
              const canActivate =
                row.uid &&
                row.status === "started" &&
                row.durationDays;
              const isBusy = busyId === row.id;
              const amount = row.totalPriceLabel || "—";
              return (
                <div
                  key={row.id}
                  className="rounded-3xl border border-slate-700/80 bg-slate-900/60 p-4 shadow-lg shadow-black/20"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        E-posta
                      </p>
                      <p className="text-sm font-semibold text-white break-all">
                        {row.email || "—"}
                      </p>
                    </div>
                    <IntentStatusBadge status={row.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500 font-bold uppercase tracking-wide">
                        UID
                      </p>
                      <p className="font-mono text-slate-200 mt-0.5 break-all">
                        {shortUid(row.uid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold uppercase tracking-wide">
                        Tutar
                      </p>
                      <p className="text-slate-100 font-bold mt-0.5">{amount}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500 font-bold uppercase tracking-wide">
                        Plan
                      </p>
                      <p className="text-slate-100 font-semibold mt-0.5">
                        {row.planLabel || row.planId}
                      </p>
                      {row.planSku ? (
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {row.planSku}
                        </p>
                      ) : null}
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500 font-bold uppercase tracking-wide">
                        Tarih
                      </p>
                      <p className="text-slate-300 mt-0.5">{row.createdAt || "—"}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {canActivate ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleActivate(row)}
                        className="flex-1 min-h-11 px-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs disabled:opacity-50 shadow-md"
                      >
                        {isBusy ? "İşleniyor…" : grantButtonLabel(row.durationDays)}
                      </button>
                    ) : row.status === "manually_activated" ? (
                      <span className="text-xs font-semibold text-emerald-300/90 py-2">
                        Aktive edildi
                      </span>
                    ) : !row.uid ? (
                      <span className="text-xs font-medium text-amber-200/90">
                        UID yok — önce kullanıcı girişi gerekir
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Masaüstü tablo */}
          <div className="hidden md:block overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/40 shadow-xl shadow-black/25">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90">
                  <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    E-posta
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    UID
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Plan
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                    Tutar
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Durum
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Tarih
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400 text-right">
                    Aksiyon
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/90">
                {items.map((row) => {
                  const canActivate =
                    row.uid &&
                    row.status === "started" &&
                    row.durationDays;
                  const isBusy = busyId === row.id;
                  const amount = row.totalPriceLabel || "—";
                  return (
                    <tr
                      key={row.id}
                      className="bg-slate-950/20 hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-slate-100 font-medium align-top max-w-[200px]">
                        <span className="break-all">{row.email || "—"}</span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-300 align-top whitespace-nowrap">
                        {shortUid(row.uid)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-100 align-top min-w-[140px]">
                        <div className="font-semibold">
                          {row.planLabel || row.planId}
                        </div>
                        {row.planSku ? (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {row.planSku}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-100 tabular-nums align-top whitespace-nowrap">
                        {amount}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <IntentStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs align-top whitespace-nowrap">
                        {row.createdAt || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right align-top">
                        {canActivate ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleActivate(row)}
                            className="inline-flex min-h-9 items-center justify-center px-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-[11px] disabled:opacity-50 shadow-md hover:bg-emerald-400 transition"
                          >
                            {isBusy ? "…" : grantButtonLabel(row.durationDays)}
                          </button>
                        ) : row.status === "manually_activated" ? (
                          <span className="text-xs font-semibold text-emerald-300">
                            Aktive edildi
                          </span>
                        ) : !row.uid ? (
                          <span className="text-[11px] text-amber-200/90 font-medium">
                            UID yok
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
