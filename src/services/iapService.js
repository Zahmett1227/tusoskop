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
 * Mevcut abonelikleri geri yükler. Aktif abonelik bulunursa sunucu doğrulaması yapar.
 * @returns {Promise<object|null>} Aktif abonelik bulunursa { premiumUntil } döner, yoksa null
 */
export async function restoreAndSyncPurchases() {
  if (!isNativeIOS()) throw new Error('IAP yalnızca iOS\'ta kullanılabilir.');
  const { transactions } = await IAP.restorePurchases();
  if (!transactions || transactions.length === 0) {
    return null;
  }
  // En son biten aboneliği bul (en uzun expirationDate)
  const sorted = [...transactions].sort((a, b) => (b.expirationDate || 0) - (a.expirationDate || 0));
  const latest = sorted[0];
  const verifyResult = await verifyAndActivatePurchase(latest.jwsRepresentation);
  return verifyResult;
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
