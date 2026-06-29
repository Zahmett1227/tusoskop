import { useCallback, useEffect, useState } from "react";
import { loadStats, recordResult } from "../lib/storage.js";
import { firebaseEnabled, auth, db } from "../firebase.js";

// İstatistik kaynağı: localStorage (her zaman). Giriş yapılırsa Firestore'a
// (tanidleStats/{uid}) best-effort yedeklenir — başarısızlık oyunu etkilemez.
export function useStats() {
  const [stats, setStats] = useState(() => loadStats());
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!firebaseEnabled) return;
    let unsub = () => {};
    (async () => {
      const { onAuthStateChanged } = await import("firebase/auth");
      unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    })();
    return () => unsub();
  }, []);

  const syncRemote = useCallback(
    async (next) => {
      if (!firebaseEnabled || !auth?.currentUser) return;
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(
          doc(db, "tanidleStats", auth.currentUser.uid),
          { ...next, updatedAt: Date.now() },
          { merge: true }
        );
      } catch {
        /* offline / kural reddi — sessizce yut */
      }
    },
    []
  );

  const record = useCallback(
    (result) => {
      const next = recordResult(result);
      setStats(next);
      syncRemote(next);
      return next;
    },
    [syncRemote]
  );

  return { stats, record, user };
}
