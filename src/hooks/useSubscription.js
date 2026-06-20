import { useState, useEffect, useCallback } from 'react';
import { isNativeIOS } from '../utils/device';
import { loadProducts, restoreAndSyncPurchases } from '../services/iapService';

export function useSubscription() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isNativeIOS()) return;
    setLoading(true);
    loadProducts()
      .then(setProducts)
      .catch((e) => setError(e?.message || 'Ürünler yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  const restore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await restoreAndSyncPurchases();
    } catch (e) {
      setError(e?.message || 'Geri yükleme başarısız');
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, loading, error, restore };
}
