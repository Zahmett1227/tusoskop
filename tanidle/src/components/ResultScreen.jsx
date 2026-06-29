import { useState } from "react";
import { buildShareText, share } from "../lib/share.js";
import { renderResultCard, shareImageBlob } from "../lib/shareImage.js";

// Tusoskop dönüşüm hunisi: oyun sonunda kaynak + CTA.
const TUSOSKOP_URL = "https://tusoskop.com";

export default function ResultScreen({
  question,
  number,
  mode,
  solved,
  guesses,
  maxGuesses,
}) {
  const [shareMsg, setShareMsg] = useState("");
  const [imgMsg, setImgMsg] = useState("");
  const [imgBusy, setImgBusy] = useState(false);

  async function handleShare() {
    const text = buildShareText({ number, guesses, solved, maxGuesses });
    const res = await share(text);
    setShareMsg(
      res === "shared" ? "Paylaşıldı" : res === "copied" ? "Panoya kopyalandı" : "Kopyalanamadı"
    );
    setTimeout(() => setShareMsg(""), 2000);
  }

  async function handleShareImage() {
    setImgBusy(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const blob = await renderResultCard({
        number,
        guesses,
        solved,
        maxGuesses,
        ders: question.ders,
        konu: question.konu,
      });
      const res = await shareImageBlob(
        blob,
        buildShareText({ number, guesses, solved, maxGuesses })
      );
      setImgMsg(res === "shared" ? "Paylaşıldı" : "Görsel indirildi");
    } catch {
      setImgMsg("Görsel oluşturulamadı");
    } finally {
      setImgBusy(false);
      setTimeout(() => setImgMsg(""), 2500);
    }
  }

  return (
    <div className="animate-fade-up mt-6 space-y-4">
      {/* Sonuç başlığı */}
      <div
        className={`rounded-2xl p-4 text-center font-bold ${
          solved ? "bg-brand-50 text-brand-700" : "bg-rose-50 text-rose-600"
        }`}
      >
        {solved ? (
          <>🎉 Doğru! {guesses.length}. tahminde bildin.</>
        ) : (
          <>Bu sefer olmadı.</>
        )}
        <div className="mt-1 text-base font-extrabold text-slate-800">
          {question.answer}
        </div>
      </div>

      {/* Açıklama */}
      {question.exp && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="mb-1 text-sm font-bold text-slate-700">Açıklama</h3>
          <p className="text-[15px] leading-relaxed text-slate-700">{question.exp}</p>
        </div>
      )}

      {/* Paylaş (yalnızca günün vakası) */}
      {mode === "daily" && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="rounded-2xl bg-brand-600 py-3.5 font-bold text-white shadow transition hover:bg-brand-700 active:scale-[0.99]"
          >
            {shareMsg || "Sonucu Paylaş"}
          </button>
          <button
            type="button"
            onClick={handleShareImage}
            disabled={imgBusy}
            className="rounded-2xl border border-brand-300 bg-white py-3.5 font-bold text-brand-700 shadow-sm transition hover:bg-brand-50 active:scale-[0.99] disabled:opacity-60"
          >
            {imgMsg || (imgBusy ? "Hazırlanıyor…" : "🖼️ Görsel")}
          </button>
        </div>
      )}

      {/* Tusoskop CTA */}
      <a
        href={TUSOSKOP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl border border-brand-200 bg-white p-4 text-center transition hover:bg-brand-50"
      >
        <p className="text-sm text-slate-600">
          Bu vaka <strong className="text-brand-700">Tusoskop</strong> TUS soru
          bankasından alındı — 7.000+ soru, akıllı tekrar ve deneme sınavları.
        </p>
        <span className="mt-1 inline-block text-sm font-bold text-brand-700">
          Tusoskop'ta çalışmaya başla →
        </span>
      </a>
    </div>
  );
}
