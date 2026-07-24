import { IAP } from '../plugins/iap';
import { IAP_PRODUCT_IDS } from '../config/iap';
import { isNativeIOS } from '../utils/device';

// In-memory cache — ürünler bir kez yüklenince saklanır
let _cachedProducts = null;

/**
 * App Store'dan ürün bilgilerini yükler. İkinci çağrıda cache döner.
 * @returns {Promise<Array>} Ürün nesneleri listesi
 */
export async function loadProducts() {
  if (!isNativeIOS()) return [];
  if (_cachedProducts) return _cachedProducts;

  const { products } = await IAP.getProducts({ productIds: IAP_PRODUCT_IDS });
  _cachedProducts = products || [];
  return _cachedProducts;
}

/**
 * Belirtilen ürünü satın al ve JWS representation döner.
 * @param {string} productId - App Store product ID
 * @returns {Promise<object>} { transactionId, productId, jwsRepresentation, originalTransactionId, purchaseDate, expirationDate }
 */
export async function purchaseProduct(productId) {
  if (!isNativeIOS()) throw new Error('IAP yalnızca iOS\'ta kullanılabilir.');
  const result = await IAP.purchaseProduct({ productId });
  return result;
}

/**
 * Firebase Function'ı çağırarak JWS token'ı doğrular ve Firestore'da premium aktif eder.
 * @param {string} jwsRepresentation - StoreKit 2 JWS token
 * @returns {Promise<object>} { success: true, premiumUntil: string (ISO date) }
 */
export async function verifyAndActivatePurchase(jwsRepresentation) {
  const { functions } = await import('../firebase');
  const { httpsCallable } = await import('firebase/functions');
  const verifyFn = httpsCallable(functions, 'verifyApplePurchase');
  const result = await verifyFn({ jwsRepresentation });
  return result.data;
}

/**
 * StoreKit işlemini kuyruktan kaldırır. SUNUCU DOĞRULAMASI BAŞARILI OLDUKTAN
 * SONRA çağrılmalı — aksi halde doğrulanmamış işlemi bitirip ödeme kaybına
 * yol açar. Hata sessizce yutulur (finish idempotent; kritik değil).
 * @param {string|number} transactionId
 */
export async function finishTransaction(transactionId) {
  if (!isNativeIOS() || transactionId == null) return;
  try {
    await IAP.finishTransaction({ transactionId: String(transactionId) });
  } catch {
    /* finish idempotent; StoreKit gerekirse yeniden teslim eder */
  }
}

/**
 * Bir satın almayı doğrula, premium'u aktive et ve işlemi bitir (doğru sıra).
 * @param {object} txData - purchaseProduct / restore / transactionUpdate çıktısı
 * @returns {Promise<object>} verifyAndActivatePurchase sonucu
 */
export async function verifyActivateAndFinish(txData) {
  const verifyResult = await verifyAndActivatePurchase(txData.jwsRepresentation);
  await finishTransaction(txData.transactionId);
  return verifyResult;
}

/**
 * Mevcut abonelikleri geri yükler. Aktif abonelik bulunursa sunucu doğrulaması yapar.
 * @returns {Promise<object|null>} Aktif abonelik bulunursa { premiumUntil } döner, yoksa null
 */
export async function restoreAndSyncPurchases() {
  if (!isNativeIOS()) throw new Error('IAP yalnızca iOS\'ta kullanılabilir.');
  const { transactions } = await IAP.restorePurchases();
  if (!transactions || transactions.length === 0) {
    return null;
  }
  // En son biten aboneliği önce dene; ilk doğrulama başarısızsa (aile paylaşımı /
  // çoklu abonelik) diğerlerini sırayla dene — tek denemede pes etme.
  const sorted = [...transactions].sort(
    (a, b) => (b.expirationDate || 0) - (a.expirationDate || 0)
  );
  let lastError = null;
  for (const tx of sorted) {
    try {
      const verifyResult = await verifyActivateAndFinish(tx);
      if (verifyResult?.premiumUntil) return verifyResult;
    } catch (e) {
      lastError = e;
    }
  }
  if (lastError) throw lastError;
  return null;
}

/**
 * Aktif abonelikleri kontrol eder.
 * @returns {Promise<Array>} Aktif abonelik nesneleri
 */
export async function checkActiveSubscriptions() {
  if (!isNativeIOS()) return [];
  const { subscriptions } = await IAP.getActiveSubscriptions();
  return subscriptions || [];
}

/**
 * Açılışta / öne gelişte aktif abonelikleri sunucuyla senkronlar. Yenileme
 * (auto-renew) sonrası premiumUntil'ı günceller ve bitirilmemiş işlemleri finish
 * eder. Aktif abonelik yoksa sessizce null döner.
 * @returns {Promise<object|null>}
 */
export async function syncActiveSubscriptions() {
  if (!isNativeIOS()) return null;
  let subs = [];
  try {
    subs = await checkActiveSubscriptions();
  } catch {
    return null;
  }
  if (!subs.length) return null;
  const sorted = [...subs].sort((a, b) => (b.expirationDate || 0) - (a.expirationDate || 0));
  for (const tx of sorted) {
    try {
      const verifyResult = await verifyActivateAndFinish(tx);
      if (verifyResult?.premiumUntil) return verifyResult;
    } catch {
      /* sonraki işlemi dene */
    }
  }
  return null;
}

/**
 * Uygulama açıkken gelen işlem güncellemelerini (yenileme/geri ödeme) dinler.
 * Her güncellemede sunucu doğrulaması + finish yapılır; başarılıysa onSynced çağrılır.
 * @param {(result: object) => void} onSynced
 * @returns {Promise<{remove: () => void}|null>} dinleyici tutamacı
 */
export async function registerTransactionUpdateListener(onSynced) {
  if (!isNativeIOS()) return null;
  return IAP.addListener('transactionUpdate', async (txData) => {
    try {
      const result = await verifyActivateAndFinish(txData);
      if (result?.premiumUntil) onSynced?.(result);
    } catch {
      /* doğrulama başarısızsa işlem bitirilmez; sonraki açılışta yeniden denenir */
    }
  });
}
