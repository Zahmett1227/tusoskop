import React, { useState, useEffect, useCallback } from 'react';
import { IAP_PRODUCT_IDS, IAP_PLAN_MAP } from '../../config/iap';
import { loadProducts, purchaseProduct, verifyAndActivatePurchase } from '../../services/iapService';

const ORDERED_PRODUCT_IDS = IAP_PRODUCT_IDS; // 1m, 3m, 6m sırası

export default function SubscriptionModal({ open, onClose, onSuccess, accentTheme }) {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Ürünleri yükle
  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoadingProducts(true);
    loadProducts()
      .then((prods) => {
        setProducts(prods || []);
        // Varsayılan seçim: 3 aylık (önerilen)
        const default3m = prods?.find((p) => p.productId === 'com.tusoskop.app.plus.3m');
        const defaultSel = default3m ? default3m.productId : (prods?.[0]?.productId || null);
        setSelectedProductId(defaultSel);
      })
      .catch((e) => setError(e?.message || 'Ürünler yüklenemedi'))
      .finally(() => setLoadingProducts(false));
  }, [open]);

  // Sıralanmış ürün listesi (1m, 3m, 6m)
  const sortedProducts = ORDERED_PRODUCT_IDS
    .map((id) => products.find((p) => p.productId === id))
    .filter(Boolean);

  const handlePurchase = useCallback(async () => {
    if (!selectedProductId) return;
    setError(null);
    setPurchasing(true);
    try {
      const txData = await purchaseProduct(selectedProductId);
      const verifyResult = await verifyAndActivatePurchase(txData.jwsRepresentation);
      onSuccess?.(verifyResult?.premiumUntil || null);
      onClose?.();
    } catch (e) {
      if (e?.message === 'USER_CANCELLED' || String(e?.message).includes('USER_CANCELLED')) {
        // Kullanıcı iptal etti — sessizce geç
      } else {
        setError(e?.message || 'Satın alma tamamlanamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setPurchasing(false);
    }
  }, [selectedProductId, onSuccess, onClose]);

  const handleRestore = useCallback(async () => {
    setError(null);
    setRestoring(true);
    try {
      const { restoreAndSyncPurchases } = await import('../../services/iapService');
      const result = await restoreAndSyncPurchases();
      if (result?.premiumUntil) {
        onSuccess?.(result.premiumUntil);
        onClose?.();
      } else {
        setError('Aktif abonelik bulunamadı.');
      }
    } catch (e) {
      setError(e?.message || 'Geri yükleme başarısız. Lütfen tekrar deneyin.');
    } finally {
      setRestoring(false);
    }
  }, [onSuccess, onClose]);

  if (!open) return null;

  const selectedPlan = selectedProductId ? IAP_PLAN_MAP[selectedProductId] : null;
  const isLoading = purchasing || restoring;

  return (
    <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-[0_-8px_60px_-10px_rgba(0,0,0,0.3)] sm:shadow-[0_28px_80px_-28px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
              Tusoskop
            </p>
            <h2 className="text-2xl font-black text-neutral-950 leading-tight">
              Plus Abonelik
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition disabled:opacity-40"
            aria-label="Kapat"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4 max-h-[80dvh] overflow-y-auto">
          {/* Hata mesajı */}
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {error}
            </div>
          ) : null}

          {/* Ürün yükleniyor */}
          {loadingProducts ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
              <p className="text-sm font-medium text-neutral-500">Paketler yükleniyor…</p>
            </div>
          ) : (
            <>
              {/* Plan kartları */}
              <div className="space-y-3">
                {sortedProducts.map((product) => {
                  const planInfo = IAP_PLAN_MAP[product.productId];
                  if (!planInfo) return null;
                  const isSelected = selectedProductId === product.productId;
                  const isHighlight = planInfo.highlight;

                  return (
                    <button
                      key={product.productId}
                      type="button"
                      onClick={() => setSelectedProductId(product.productId)}
                      disabled={isLoading}
                      className={`relative w-full text-left rounded-2xl border-2 p-4 transition disabled:opacity-60 ${
                        isSelected
                          ? isHighlight
                            ? 'border-[#b99671] bg-gradient-to-br from-[#fff8ef] to-white ring-2 ring-[#c9a16f]'
                            : 'border-neutral-800 bg-white ring-2 ring-neutral-800/20'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      {planInfo.badge ? (
                        <span
                          className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                            isHighlight
                              ? 'bg-gradient-to-r from-[#bf8a4c] to-[#9a6b32] text-white'
                              : 'bg-neutral-800 text-white'
                          }`}
                        >
                          {planInfo.badge}
                        </span>
                      ) : null}

                      <div className="flex items-start justify-between gap-2 pr-16">
                        <div>
                          <p className="text-base font-extrabold text-neutral-950">
                            {planInfo.durationLabel}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-neutral-500">
                            Otomatik yenilenen abonelik
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black tabular-nums text-neutral-950">
                            {product.localizedPrice}
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <div
                          className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isHighlight ? 'border-[#b99671] bg-[#b99671]' : 'border-neutral-800 bg-neutral-800'
                          }`}
                          aria-hidden="true"
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      ) : (
                        <div
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-neutral-300"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Satın al butonu */}
              <button
                type="button"
                onClick={handlePurchase}
                disabled={isLoading || !selectedProductId || loadingProducts}
                className="w-full min-h-14 rounded-2xl bg-gradient-to-r from-[#bf8a4c] to-[#9a6b32] text-white font-black text-base shadow-[0_8px_24px_-8px_rgba(154,107,50,0.6)] hover:brightness-105 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {purchasing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    İşleniyor…
                  </span>
                ) : selectedPlan ? (
                  `${selectedPlan.durationLabel} Abonelik Başlat`
                ) : (
                  'Abonelik Başlat'
                )}
              </button>

              {/* Otomatik yenileme notu */}
              <p className="text-[11px] font-medium text-neutral-500 text-center leading-relaxed">
                Abonelik seçilen dönem sonunda otomatik yenilenir. İptal için bitiş tarihinden en az 24 saat önce iptal edilmeli.
              </p>
              <p className="text-[11px] font-medium text-neutral-500 text-center leading-relaxed">
                Aboneliği iptal etmek için iOS Ayarlar &gt; Apple ID &gt; Abonelikler&apos;e gidin.
              </p>
            </>
          )}

          {/* Restore butonu */}
          <button
            type="button"
            onClick={handleRestore}
            disabled={isLoading}
            className="w-full text-center text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition py-1 disabled:opacity-50"
          >
            {restoring ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                Geri yükleniyor…
              </span>
            ) : (
              'Satın Almaları Geri Yükle'
            )}
          </button>

          {/* Yasal linkler */}
          <div className="flex justify-center gap-4 pb-2">
            <a
              href="https://tusoskop.com/gizlilik-politikasi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-neutral-500 underline underline-offset-2 decoration-neutral-400 hover:text-neutral-700"
            >
              Gizlilik Politikası
            </a>
            <span className="text-neutral-300 text-[11px]">•</span>
            <a
              href="https://tusoskop.com/kullanim-kosullari"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-neutral-500 underline underline-offset-2 decoration-neutral-400 hover:text-neutral-700"
            >
              Kullanım Koşulları
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
