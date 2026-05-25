import React, { useCallback, useEffect, useState } from "react";
import { loadAllQuestions } from "../../data/questions.js";
import {
  SOCIAL_CONTENT_TYPE_LABELS,
  SOCIAL_STATUS_LABELS,
} from "../../social/socialTypes.js";
import {
  approveSocialContent,
  deleteAllSocialDrafts,
  generateTodaySocialContent,
  listSocialContent,
  markContentExported,
  markContentFailed,
  markContentPublished,
  recheckSafety,
  regenerateVisual,
  rejectSocialContent,
  updateSocialContent,
} from "../../services/socialMediaService.js";
import { exportContentToDownloads } from "../../social/exportPackage.js";
import { publishContent } from "../../social/publisher.js";
import SocialMediaContentPreview from "./SocialMediaContentPreview.jsx";
import SocialMediaEditor from "./SocialMediaEditor.jsx";

export default function SocialMediaTab({ currentUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("pending_review");
  const [selected, setSelected] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listSocialContent({ max: 80 });
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  const handleGenerateToday = async () => {
    setBusy(true);
    setMessage("");
    try {
      const questions = await loadAllQuestions();
      const { ids } = await generateTodaySocialContent({
        questions,
        adminUid: currentUser.uid,
      });
      setMessage(`${ids.length} içerik üretildi ve onay kuyruğuna eklendi.`);
      await refresh();
    } catch (err) {
      setMessage(`Hata: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (item) => {
    setBusy(true);
    try {
      await approveSocialContent(item.id, currentUser.uid, item.scheduledAt || null);
      await refresh();
      setMessage("Onaylandı.");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (item) => {
    const reason = window.prompt("Red nedeni (opsiyonel):") || "";
    setBusy(true);
    try {
      await rejectSocialContent(item.id, currentUser.uid, reason);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async (item) => {
    setBusy(true);
    try {
      await exportContentToDownloads({ ...item, id: item.id });
      await markContentExported(item.id, currentUser.uid);
      await refresh();
      setMessage("Export paketi indirildi.");
    } catch (err) {
      setMessage(`Export hatası: ${err?.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleTryPublish = async (item) => {
    setBusy(true);
    setMessage("");
    try {
      const result = await publishContent(item.id);
      if (result?.success && result?.mode === "api") {
        await markContentPublished(item.id, currentUser.uid, result);
        setMessage("Instagram API ile paylaşıldı.");
      } else if (result?.mode === "export") {
        await exportContentToDownloads({ ...item, id: item.id });
        await markContentExported(item.id, currentUser.uid);
        setMessage(result?.message || "API yapılandırılmadı — export paketi indirildi.");
      } else {
        await markContentFailed(item.id, currentUser.uid, result?.message);
        setMessage(result?.message || "Paylaşım başarısız.");
      }
      await refresh();
    } catch (err) {
      await markContentFailed(item.id, currentUser.uid, err?.message);
      setMessage(`Paylaşım hatası: ${err?.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerateVisual = async (item) => {
    setBusy(true);
    try {
      const questions = await loadAllQuestions();
      await regenerateVisual(item.id, item, currentUser.uid, questions);
      await refresh();
      setMessage("Görsel yeniden üretildi.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDrafts = async () => {
    if (!window.confirm("Onay bekleyen ve reddedilen tüm taslaklar silinecek. Emin misin?")) return;
    setBusy(true);
    setMessage("");
    try {
      const count = await deleteAllSocialDrafts(currentUser.uid);
      setMessage(`${count} taslak silindi.`);
      await refresh();
    } catch (err) {
      setMessage(`Hata: ${err?.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async (patch) => {
    if (!selected) return;
    setBusy(true);
    try {
      await updateSocialContent(selected.id, patch, currentUser.uid);
      await recheckSafety(selected.id, { ...selected, ...patch }, currentUser.uid);
      setEditorOpen(false);
      setSelected(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Sosyal Medya İçerikleri</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Otomatik üretilen içerikler önce onaylanır. Paylaşım yalnızca resmi Instagram
            Graph API ile (sunucu tarafı) veya export paketi ile yapılır.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={handleGenerateToday}
            className="min-h-10 px-4 rounded-xl bg-emerald-500 text-slate-950 text-sm font-black disabled:opacity-50"
          >
            Bugünün içeriklerini üret
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleDeleteDrafts}
            className="min-h-10 px-4 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 text-sm font-bold disabled:opacity-50"
          >
            Taslakları sil
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={refresh}
            className="min-h-10 px-4 rounded-xl border border-slate-600 text-slate-200 text-sm font-bold"
          >
            Yenile
          </button>
        </div>
      </div>

      {message ? (
        <p className="mb-4 text-sm text-emerald-300 font-medium">{message}</p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { id: "pending_review", label: "Onay bekleyen" },
          { id: "approved", label: "Onaylı" },
          { id: "scheduled", label: "Zamanlanmış" },
          { id: "exported", label: "Export" },
          { id: "published", label: "Paylaşıldı" },
          { id: "all", label: "Tümü" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`min-h-9 px-3 rounded-xl text-xs font-extrabold border ${
              filter === f.id
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-slate-900 text-slate-400 border-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Yükleniyor…</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500 text-sm">Bu filtrede içerik yok.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-700/90 bg-slate-900/50 p-4 md:p-5"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-bold text-emerald-400">
                    {SOCIAL_CONTENT_TYPE_LABELS[item.type] || item.type}
                  </p>
                  <h3 className="text-lg font-black text-white">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {SOCIAL_STATUS_LABELS[item.status] || item.status}
                    {item.safetyReport && !item.safetyReport.passed ? " · Güvenlik uyarısı" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setSelected(item);
                      setEditorOpen(true);
                    }}
                    className="min-h-9 px-3 rounded-lg border border-slate-600 text-xs font-bold text-slate-200"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleRegenerateVisual(item)}
                    className="min-h-9 px-3 rounded-lg border border-slate-600 text-xs font-bold text-slate-200"
                  >
                    Görseli yenile
                  </button>
                  {item.status === "pending_review" ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleApprove(item)}
                        className="min-h-9 px-3 rounded-lg bg-emerald-600 text-xs font-black text-white"
                      >
                        Onayla
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleReject(item)}
                        className="min-h-9 px-3 rounded-lg bg-red-900/80 text-xs font-bold text-red-200"
                      >
                        Reddet
                      </button>
                    </>
                  ) : null}
                  {["approved", "scheduled", "pending_review"].includes(item.status) ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleExport(item)}
                        className="min-h-9 px-3 rounded-lg border border-cyan-700 text-xs font-bold text-cyan-300"
                      >
                        Export et
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleTryPublish(item)}
                        className="min-h-9 px-3 rounded-lg border border-emerald-700 text-xs font-bold text-emerald-300"
                      >
                        Paylaşımı dene
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              <SocialMediaContentPreview content={item} />
            </article>
          ))}
        </div>
      )}

      {editorOpen && selected ? (
        <SocialMediaEditor
          content={selected}
          onClose={() => {
            setEditorOpen(false);
            setSelected(null);
          }}
          onSave={handleSaveEdit}
        />
      ) : null}
    </div>
  );
}
