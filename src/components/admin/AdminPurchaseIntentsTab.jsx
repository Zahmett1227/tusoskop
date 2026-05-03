import React, { useCallback, useEffect, useState } from "react";
import {
  activateIntentAndGrantPremium,
  getPremiumPurchaseIntents,
} from "../../services/adminService";

function shortUid(uid) {
  if (!uid || typeof uid !== "string") return "—";
  if (uid.length <= 12) return uid;
  return `${uid.slice(0, 4)}...${uid.slice(-3)}`;
}

function grantButtonLabel(days) {
  if (days === 30) return "30 gün Plus ver";
  if (days === 90) return "90 gün Plus ver";
  if (days === 180) return "180 gün Plus ver";
  return `${days} gün Plus ver`;
}

export default function AdminPurchaseIntentsTab({ currentUser }) {
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
      <p className="text-slate-400 text-sm py-6">Yükleniyor...</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-slate-400 text-sm">
          Son 50 kayıt — Shopify ödeme öncesi niyet bildirimleri
        </p>
        <button
          type="button"
          onClick={() => refresh()}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 border border-slate-600 text-slate-200"
        >
          Yenile
        </button>
      </div>

      {error ? (
        <p className="text-rose-300 text-sm">{error}</p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-slate-500 text-sm">Henüz kayıt yok.</p>
      ) : (
        <div className="space-y-3">
          {items.map((row) => {
            const canActivate =
              row.uid &&
              row.status === "started" &&
              row.durationDays;
            const isBusy = busyId === row.id;
            return (
              <div
                key={row.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 gap-y-1 text-slate-200">
                  <p>
                    <span className="text-slate-500">Email: </span>
                    {row.email || "—"}
                  </p>
                  <p className="font-mono text-xs">
                    <span className="text-slate-500">UID: </span>
                    {shortUid(row.uid)}
                  </p>
                  <p>
                    <span className="text-slate-500">Plan: </span>
                    {row.planLabel || row.planId}
                  </p>
                  <p>
                    <span className="text-slate-500">SKU: </span>
                    {row.planSku || "—"}
                  </p>
                  <p>
                    <span className="text-slate-500">Aylık: </span>
                    {row.monthlyPriceLabel || "—"}
                  </p>
                  <p>
                    <span className="text-slate-500">Toplam: </span>
                    {row.totalPriceLabel || "—"}
                  </p>
                  <p>
                    <span className="text-slate-500">Süre (gün): </span>
                    {row.durationDays ?? "—"}
                  </p>
                  <p>
                    <span className="text-slate-500">Durum: </span>
                    <span className="font-bold">{row.status || "—"}</span>
                  </p>
                  <p className="md:col-span-2">
                    <span className="text-slate-500">Oluşturulma: </span>
                    {row.createdAt || "—"}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canActivate ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleActivate(row)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs disabled:opacity-50"
                    >
                      {isBusy ? "İşleniyor..." : grantButtonLabel(row.durationDays)}
                    </button>
                  ) : row.status === "manually_activated" ? (
                    <span className="text-xs text-emerald-300">
                      Manuel aktivasyon tamamlandı
                    </span>
                  ) : !row.uid ? (
                    <span className="text-xs text-amber-200">
                      UID yok — önce kullanıcı girişiyle oluşturulmalı
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
