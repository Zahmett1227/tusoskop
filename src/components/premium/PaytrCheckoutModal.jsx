import React, { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { isUserPremium } from "../../utils/premiumUtils";
import { trackClarityEvent } from "../../lib/clarity";
import {
  PAYTR_IFRAME_URL,
  PAYTR_IFRAME_RESIZER_SRC,
} from "../../services/paytrService";

/**
 * PayTR iFrame ödeme modal'ı.
 *
 * - `token` ile PayTR güvenli ödeme sayfasını iframe içinde açar.
 * - Ödeme sonucunu PayTR callback'i users/{uid} dokümanını güncelleyerek bildirir;
 *   burada onSnapshot ile premium aktif olduğu an "başarılı" ekranına geçilir.
 * - iframeResizer scripti yüklenince iframe yüksekliği içeriğe göre ayarlanır.
 */
export default function PaytrCheckoutModal({ token, uid, onClose, onSuccess }) {
  const [phase, setPhase] = useState("paying"); // paying | success
  const iframeRef = useRef(null);
  // Modalın açıldığı andaki premium bitiş tarihini sakla; onSnapshot sadece
  // bu modal açıldıktan SONRA oluşan bir premium değişikliğini yakalamalı.
  const baseUntilRef = useRef(null);

  // iframeResizer scriptini yükle ve iframe'e bağla
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    function attachResizer() {
      try {
        if (window.iFrameResize && iframeRef.current) {
          window.iFrameResize({ checkOrigin: false }, "#paytriframe");
        }
      } catch {
        /* resizer kritik değil */
      }
    }

    const existing = document.querySelector(
      `script[src="${PAYTR_IFRAME_RESIZER_SRC}"]`
    );
    if (existing) {
      attachResizer();
    } else {
      const script = document.createElement("script");
      script.src = PAYTR_IFRAME_RESIZER_SRC;
      script.async = true;
      script.onload = () => {
        if (!cancelled) attachResizer();
      };
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Ödeme sonucu: callback users/{uid} dokümanını günceller → bu ödemeye ait
  // yeni bir premium tanımı gelince "başarılı" ekranına geç.
  // İlk snapshot'ta mevcut premiumUntil'i kaydet; sadece bundan SONRA gelen
  // daha ileri bir premiumUntil değeri bu ödemenin başarısı sayılır.
  useEffect(() => {
    if (!uid) return undefined;
    let initialized = false;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      const data = snap.exists() ? snap.data() : null;
      if (!initialized) {
        // İlk tetiklenme: mevcut durumu baz al, başarı saymaz.
        baseUntilRef.current = data?.premiumUntil ?? null;
        initialized = true;
        return;
      }
      if (!data || !isUserPremium(data)) return;
      // premiumUntil bu modal açılmadan öncekinden farklıysa bu ödeme aktive etti.
      if (data.premiumUntil !== baseUntilRef.current) {
        setPhase("success");
        try {
          trackClarityEvent("paytr_payment_success");
        } catch {
          /* sessiz */
        }
      }
    });
    return () => unsub();
  }, [uid]);

  // ESC ile kapat
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-3 sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="PayTR ile güvenli ödeme"
        className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span aria-hidden>🔒</span>
            <p className="text-sm font-extrabold text-neutral-900">
              PayTR ile güvenli ödeme
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-9 rounded-xl border border-neutral-300 px-3 text-xs font-extrabold text-neutral-700 hover:bg-neutral-50"
          >
            Kapat
          </button>
        </div>

        {phase === "success" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
              ✓
            </div>
            <h3 className="text-2xl font-black text-neutral-950">
              Plus erişiminiz açıldı!
            </h3>
            <p className="max-w-sm text-sm font-medium text-neutral-600 leading-relaxed">
              Ödemeniz başarıyla alındı ve Plus üyeliğiniz hesabınıza tanımlandı.
              Artık sınırsız çalışabilirsiniz.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.reload();
              }}
              className="mt-2 min-h-12 rounded-2xl bg-[#1a120c] px-8 text-sm font-extrabold text-white shadow-lg transition hover:bg-black"
            >
              Çalışmaya devam et
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-neutral-50">
            <iframe
              ref={iframeRef}
              src={`${PAYTR_IFRAME_URL}/${token}`}
              id="paytriframe"
              title="PayTR ödeme"
              frameBorder="0"
              scrolling="no"
              style={{ width: "100%", minHeight: "520px", border: "none" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
