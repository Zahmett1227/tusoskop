import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  activateIntentAndGrantPremium,
  getPremiumPurchaseIntents,
  updatePremiumPurchaseIntentOrder,
} from "../../services/adminService";
import { trackClarityEvent } from "../../lib/clarity";

function shortUid(uid) {
  if (!uid || typeof uid !== "string") return "—";
  if (uid.length <= 14) return uid;
  return `${uid.slice(0, 5)}…${uid.slice(-4)}`;
}

function intentStatusLabel(status) {
  switch (status) {
    case "started":
      return "Bekliyor";
    case "payment_checked":
      return "Ödeme kontrol edildi";
    case "manually_activated":
      return "Aktive edildi";
    case "apple_activated":
      return "App Store (otomatik)";
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
      return "bg-amber-500/12 text-amber-200 border-amber-400/28";
    case "payment_checked":
      return "bg-sky-500/12 text-sky-200 border-sky-400/30";
    case "manually_activated":
      return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";
    case "apple_activated":
      return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";
    case "cancelled":
      return "bg-rose-500/12 text-rose-200 border-rose-400/28";
    case "needs_review":
      return "bg-violet-500/12 text-violet-200 border-violet-400/25";
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

function canGrantPlus(row) {
  return Boolean(
    row.uid &&
      row.durationDays &&
      (row.status === "started" || row.status === "payment_checked")
  );
}

function shopifyOrderDisplay(row) {
  const name = row.shopifyOrderName;
  if (name && String(name).trim()) {
    return `Shopify Order: ${String(name).trim()}`;
  }
  return "Sipariş no yok";
}

const HIDDEN_INTENTS_STORAGE_KEY = "tusoskop-admin-purchase-intents-hidden-ids";

function loadHiddenIntentIds() {
  try {
    if (typeof window === "undefined") return new Set();
    const raw = window.localStorage.getItem(HIDDEN_INTENTS_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter(Boolean));
  } catch {
    return new Set();
  }
}

function saveHiddenIntentIds(set) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      HIDDEN_INTENTS_STORAGE_KEY,
      JSON.stringify([...set])
    );
  } catch {
    /* sessiz */
  }
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

function IntentOrderModal({ intent, adminUid, onClose, onSaved }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setValue(
      intent?.shopifyOrderName
        ? String(intent.shopifyOrderName).replace(/^#+/, "")
        : ""
    );
    setLocalError("");
  }, [intent?.id, intent?.shopifyOrderName]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async () => {
    if (!adminUid || !intent?.id) return;
    setLocalError("");
    setSaving(true);
    try {
      const input = value.trim().startsWith("#") ? value.trim() : `#${value.trim()}`;
      await updatePremiumPurchaseIntentOrder({
        intentId: intent.id,
        shopifyOrderName: input,
        adminUid,
      });
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
      setLocalError(e?.message || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="intent-order-title"
        className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="intent-order-title" className="text-lg font-black text-white mb-1">
          Shopify sipariş no
        </h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Örnek: 1001, #1001 veya #1042. Kayıt tek # ile saklanır.
        </p>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
          Sipariş numarası
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="#1001"
          className="w-full min-h-11 px-3 rounded-xl bg-slate-950 border border-slate-600 text-white text-sm font-mono mb-3"
          autoComplete="off"
        />
        {localError ? (
          <p className="text-rose-300 text-xs font-medium mb-3">{localError}</p>
        ) : null}
        <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="min-h-10 px-4 rounded-xl border border-slate-600 text-slate-200 text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            type="button"
            disabled={saving || !value.trim()}
            onClick={handleSave}
            className="min-h-10 px-4 rounded-xl bg-cyan-500 text-slate-950 text-sm font-extrabold disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
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
  const [orderModalIntent, setOrderModalIntent] = useState(null);
  const [hiddenIds, setHiddenIds] = useState(() => loadHiddenIntentIds());
  const [showHidden, setShowHidden] = useState(false);

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

  useEffect(() => {
    try {
      trackClarityEvent("admin_purchase_intents_view");
    } catch {
      /* sessiz */
    }
  }, []);

  const hideIntentId = useCallback((id) => {
    if (!id) return;
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveHiddenIntentIds(next);
      return next;
    });
  }, []);

  const unhideIntentId = useCallback((id) => {
    if (!id) return;
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      saveHiddenIntentIds(next);
      return next;
    });
  }, []);

  const visibleItems = useMemo(() => {
    if (showHidden) return items;
    return items.filter((row) => !hiddenIds.has(row.id));
  }, [items, hiddenIds, showHidden]);

  const hiddenCount = useMemo(
    () => items.filter((row) => hiddenIds.has(row.id)).length,
    [items, hiddenIds]
  );

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
      {orderModalIntent ? (
        <IntentOrderModal
          key={orderModalIntent.id}
          intent={orderModalIntent}
          adminUid={currentUser?.uid}
          onClose={() => setOrderModalIntent(null)}
          onSaved={refresh}
        />
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-slate-400 text-sm font-medium max-w-xl leading-relaxed">
            Son 50 kayıt — Shopify ödeme öncesi niyet bildirimleri. Sipariş numarasını
            Orders ekranından alıp kaydederek taleple eşleştirin.
          </p>
          <button
            type="button"
            onClick={() => refresh()}
            className="shrink-0 min-h-10 px-4 rounded-xl text-xs font-extrabold bg-slate-800/90 border border-slate-600 text-slate-100 hover:bg-slate-800 transition shadow-sm"
          >
            Yenile
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/50 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              role="switch"
              aria-checked={showHidden}
              onClick={() => setShowHidden((v) => !v)}
              className={`relative inline-flex h-8 w-[3.25rem] shrink-0 items-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 ${
                showHidden
                  ? "border-cyan-500/50 bg-cyan-600/90"
                  : "border-slate-600 bg-slate-800"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  showHidden ? "translate-x-[1.35rem]" : "translate-x-1"
                }`}
              />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-100 leading-tight">
                Gizlenenleri göster
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Listeden gizlediğin kayıtlar silinmez; bu cihazda saklanır.
              </p>
            </div>
          </div>
          {hiddenCount > 0 ? (
            <span className="inline-flex items-center rounded-full border border-slate-600 bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">
              {hiddenCount} gizli
            </span>
          ) : (
            <span className="text-[11px] text-slate-600 font-medium">Gizli yok</span>
          )}
        </div>
      </div>

      {error ? (
        <p className="text-rose-300 text-sm font-medium">{error}</p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-slate-500 text-sm font-medium">Henüz kayıt yok.</p>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90">
          <p className="font-bold">Görünen kayıt yok</p>
          <p className="text-amber-200/80 text-xs mt-1 leading-relaxed">
            Tüm talepler listeden gizli. Üstteki &quot;Gizlenenleri göster&quot; anahtarını
            açarak tekrar görebilir veya gizlemeyi tek tek kaldırabilirsin.
          </p>
        </div>
      ) : (
        <>
          {hiddenCount > 0 && !showHidden ? (
            <p className="text-[11px] text-slate-500 font-medium">
              {items.length} kayıttan {visibleItems.length} görünüyor ·{" "}
              {hiddenCount} gizli
            </p>
          ) : null}
          {/* Mobil kartlar */}
          <div className="md:hidden space-y-3">
            {visibleItems.map((row) => {
              const canPlus = canGrantPlus(row);
              const isBusy = busyId === row.id;
              const amount = row.totalPriceLabel || "—";
              const isRowHidden = hiddenIds.has(row.id);
              return (
                <div
                  key={row.id}
                  className={`rounded-3xl border p-4 shadow-lg shadow-black/20 ${
                    showHidden && isRowHidden
                      ? "border-slate-600/80 bg-slate-950/50 ring-1 ring-slate-600/30"
                      : "border-slate-700/80 bg-slate-900/60"
                  }`}
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
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {showHidden && isRowHidden ? (
                        <span className="rounded-full border border-slate-500/60 bg-slate-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-300">
                          Listede gizli
                        </span>
                      ) : null}
                      <IntentStatusBadge status={row.status} />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mb-3 break-words">
                    {shopifyOrderDisplay(row)}
                  </p>
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
                  <div className="mt-4 flex flex-col gap-2">
                    {isRowHidden ? (
                      <button
                        type="button"
                        onClick={() => unhideIntentId(row.id)}
                        className="min-h-9 w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-xs font-extrabold hover:bg-emerald-500/15"
                      >
                        Listede tekrar göster
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => hideIntentId(row.id)}
                        className="min-h-9 w-full rounded-xl border border-slate-600/80 bg-slate-950/40 text-slate-400 text-xs font-bold hover:text-slate-200 hover:border-slate-500"
                      >
                        Listeden gizle
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setOrderModalIntent(row)}
                      className="min-h-10 w-full rounded-xl border border-slate-600 bg-slate-800/50 text-slate-100 text-xs font-extrabold hover:bg-slate-800"
                    >
                      Sipariş no ekle
                    </button>
                    {canPlus ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleActivate(row)}
                        className="min-h-11 w-full rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs disabled:opacity-50 shadow-md"
                      >
                        {isBusy ? "İşleniyor…" : grantButtonLabel(row.durationDays)}
                      </button>
                    ) : row.status === "manually_activated" ? (
                      <span className="text-xs font-semibold text-emerald-300/90 py-1">
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
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90">
                  <th className="px-3 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    E-posta
                  </th>
                  <th className="px-3 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    UID
                  </th>
                  <th className="px-3 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Plan
                  </th>
                  <th className="px-3 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                    Tutar
                  </th>
                  <th className="px-3 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400 min-w-[7.5rem]">
                    Shopify
                  </th>
                  <th className="px-3 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Durum
                  </th>
                  <th className="px-3 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Tarih
                  </th>
                  <th className="px-3 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400 text-right min-w-[11rem]">
                    Aksiyon
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/90">
                {visibleItems.map((row) => {
                  const canPlus = canGrantPlus(row);
                  const isBusy = busyId === row.id;
                  const amount = row.totalPriceLabel || "—";
                  const orderShort = row.shopifyOrderName
                    ? String(row.shopifyOrderName).trim()
                    : null;
                  const isRowHidden = hiddenIds.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${
                        showHidden && isRowHidden
                          ? "bg-slate-950/45 hover:bg-slate-900/60 ring-1 ring-inset ring-slate-700/50"
                          : "bg-slate-950/20 hover:bg-slate-900/50"
                      }`}
                    >
                      <td className="px-3 py-3.5 text-slate-100 font-medium align-top max-w-[180px]">
                        <span className="break-all">{row.email || "—"}</span>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-xs text-slate-300 align-top whitespace-nowrap">
                        {shortUid(row.uid)}
                      </td>
                      <td className="px-3 py-3.5 text-slate-100 align-top min-w-[120px]">
                        <div className="font-semibold">
                          {row.planLabel || row.planId}
                        </div>
                        {row.planSku ? (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {row.planSku}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3.5 font-bold text-slate-100 tabular-nums align-top whitespace-nowrap">
                        {amount}
                      </td>
                      <td className="px-3 py-3.5 align-top max-w-[140px]">
                        <span
                          className="text-[11px] font-medium text-slate-400 leading-snug line-clamp-2 break-all"
                          title={orderShort || undefined}
                        >
                          {orderShort || (
                            <span className="text-slate-500 italic">Sipariş no yok</span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 align-top">
                        <IntentStatusBadge status={row.status} />
                      </td>
                      <td className="px-3 py-3.5 text-slate-400 text-xs align-top whitespace-nowrap">
                        {row.createdAt || "—"}
                      </td>
                      <td className="px-3 py-3.5 text-right align-top">
                        <div className="inline-flex flex-col items-end gap-2">
                          {isRowHidden ? (
                            <button
                              type="button"
                              onClick={() => unhideIntentId(row.id)}
                              className="min-h-8 px-2.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 text-[11px] font-extrabold text-emerald-200 hover:bg-emerald-500/15"
                            >
                              Göster
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => hideIntentId(row.id)}
                              className="min-h-8 px-2.5 rounded-lg border border-slate-600/90 bg-slate-950/50 text-[11px] font-bold text-slate-500 hover:text-slate-300 hover:border-slate-500"
                            >
                              Gizle
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setOrderModalIntent(row)}
                            className="min-h-8 px-2.5 rounded-lg border border-slate-600 bg-slate-800/60 text-[11px] font-extrabold text-slate-100 hover:bg-slate-800"
                          >
                            Sipariş no
                          </button>
                          {canPlus ? (
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
                        </div>
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
