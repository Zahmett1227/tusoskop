import React, { useCallback, useEffect, useState } from "react";
import { loadAllQuestions } from "../../data/questions.js";
import {
  SOCIAL_CONTENT_TYPE_LABELS,
  SOCIAL_STATUS_LABELS,
} from "../../social/socialTypes.js";
import {
  approveSocialContent,
  deleteAllSocialDrafts,
  deleteSocialContent,
  generateTodaySocialContent,
  listSocialContent,
  recheckSafety,
  regenerateVisual,
  triggerInstagramStory,
  updateSocialContent,
} from "../../services/socialMediaService.js";
import SocialMediaContentPreview from "./SocialMediaContentPreview.jsx";
import SocialMediaEditor from "./SocialMediaEditor.jsx";

export default function SocialMediaTab({ currentUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("pending_review");
  const [selected, setSelected] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "ok" });

  const showMsg = (text, type = "ok") => setMessage({ text, type });

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

  const filtered =
    filter === "all" ? items : items.filter((i) => i.status === filter);

  const handleGenerateToday = async () => {
    setBusy(true);
    showMsg("");
    try {
      const questions = await loadAllQuestions();
      const { ids } = await generateTodaySocialContent({
        questions,
        adminUid: currentUser.uid,
      });
      showMsg(`${ids.length} içerik üretildi ve onay kuyruğuna eklendi.`);
      await refresh();
    } catch (err) {
      showMsg(`Hata: ${err?.message || err}`, "err");
    } finally {
      setBusy(false);
    }
  };

  const handleTriggerWorkflow = async () => {
    if (
      !window.confirm(
        "GitHub Actions workflow'u tetikle? Birkaç dakika içinde Instagram'a 3 slaytlı carousel paylaşılacak."
      )
    )
      return;
    setBusy(true);
    showMsg("");
    try {
      await triggerInstagramStory(currentUser.uid);
      showMsg(
        "✓ Workflow tetiklendi! GitHub Actions → daily-story.yml çalışıyor. Birkaç dakika içinde carousel paylaşılır.",
        "ok"
      );
    } catch (err) {
      showMsg(`Hata: ${err?.message || err}`, "err");
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (item) => {
    setBusy(true);
    try {
      await approveSocialContent(item.id, currentUser.uid, item.scheduledAt || null);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "approved", approvedBy: currentUser.uid } : i
        )
      );
      setFilter("approved");
      showMsg("Onaylandı. 'Onaylı' sekmesine geçildi.");
    } catch (err) {
      showMsg(`Onayla hatası: ${err?.message || err}`, "err");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`"${item.title}" silinecek. Emin misin?`)) return;
    setBusy(true);
    try {
      await deleteSocialContent(item.id, currentUser.uid);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showMsg("İçerik silindi.");
    } catch (err) {
      showMsg(`Hata: ${err?.message}`, "err");
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
      showMsg("Görsel yeniden üretildi.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDrafts = async () => {
    if (
      !window.confirm(
        "Onay bekleyen ve reddedilen tüm taslaklar silinecek. Emin misin?"
      )
    )
      return;
    setBusy(true);
    showMsg("");
    try {
      const count = await deleteAllSocialDrafts(currentUser.uid);
      showMsg(`${count} taslak silindi.`);
      await refresh();
    } catch (err) {
      showMsg(`Hata: ${err?.message}`, "err");
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
      {/* Başlık + butonlar */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Sosyal Medya</h2>
          <p className="text-sm text-slate-400 mt-1">
            Post Paylaş → GitHub Actions çalışır → 3 slaytlı carousel Instagram'a gönderilir (günde 3 otomatik).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={handleTriggerWorkflow}
            className="min-h-10 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-black disabled:opacity-50 shadow-lg"
          >
            📸 Post Paylaş
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleGenerateToday}
            className="min-h-10 px-4 rounded-xl bg-emerald-500 text-slate-950 text-sm font-black disabled:opacity-50"
          >
            İçerik Üret
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleDeleteDrafts}
            className="min-h-10 px-4 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 text-sm font-bold disabled:opacity-50"
          >
            Taslakları Sil
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

      {/* Mesaj */}
      {message.text ? (
        <p
          className={`mb-4 text-sm font-medium ${
            message.type === "err" ? "text-red-400" : "text-emerald-300"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      {/* Filtreler */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { id: "pending_review", label: "Onay bekleyen" },
          { id: "approved", label: "Onaylı" },
          { id: "published", label: "Paylaşıldı" },
          { id: "rejected", label: "Reddedilen" },
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

      {/* Liste */}
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
                    {item.safetyReport && !item.safetyReport.passed
                      ? " · Güvenlik uyarısı"
                      : ""}
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
                    Görseli Yenile
                  </button>
                  {item.status === "pending_review" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleApprove(item)}
                      className="min-h-9 px-3 rounded-lg bg-emerald-600 text-xs font-black text-white"
                    >
                      Onayla
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDeleteItem(item)}
                    className="min-h-9 px-3 rounded-lg bg-red-900/60 border border-red-700/50 text-xs font-bold text-red-300"
                  >
                    Sil
                  </button>
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
