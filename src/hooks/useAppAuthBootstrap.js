import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  consumePendingRedirectResult,
  loginWithApple,
  loginWithGoogle,
} from "../firebase";
import { identifyClarityUser } from "../lib/clarity";
import { getFavoriteQuestions } from "../services/studyCollectionService";
import { isCurrentUserAdmin } from "../services/adminService";
import { ensureUserDocument, withAppReviewAccess } from "../services/userService";
import { getRemainingFreeUsage } from "../services/usageLimitService";
import { isNativePlatform } from "../utils/device";
import { getLastProvider } from "../utils/authPersistence";

/**
 * Oturum, admin, kullanım özeti ve favori kimlikleri — App içindeki auth yan etkileri.
 */
export function useAppAuthBootstrap(setView) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [remainingUsage, setRemainingUsage] = useState(null);
  const [favoriteQuestionIds, setFavoriteQuestionIds] = useState(new Set());
  // İlk onAuthStateChanged tetiklenene kadar splash göstermek için.
  const [isAuthReady, setIsAuthReady] = useState(false);
  // Native auto-login fallback durumu: "idle" | "pending" | "failed"
  const [autoLoginState, setAutoLoginState] = useState("idle");
  // Auto-login yalnızca bir kez denensin (sonsuz döngü önlemi).
  const autoLoginAttemptedRef = useRef(false);

  const refreshRemainingUsage = useCallback(async () => {
    const usage = await getRemainingFreeUsage(user, userData);
    setRemainingUsage(usage);
    return usage;
  }, [user, userData]);

  // Firestore'dan kullanıcı belgesini yeniden okuyup userData'yı tazeler.
  // IAP satın alma sonrası premium durumunun anında yansıması için kullanılır.
  const refreshUserData = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) return null;
    try {
      const ensured = await ensureUserDocument(currentUser);
      const next = withAppReviewAccess(currentUser, ensured);
      setUserData(next);
      return next;
    } catch (error) {
      console.error("refreshUserData error:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    // popup-blocked fallback yalnız çağrıldığında bir redirect sonucu olur;
    // null kontrolü ile iOS Safari ITP'de güvenli geçer.
    consumePendingRedirectResult().catch(() => {
      /* sessizce yut */
    });
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser?.uid) {
          const ensured = await ensureUserDocument(currentUser);
          setUserData(withAppReviewAccess(currentUser, ensured));
        }
      } catch (error) {
        console.error("User profile sync error:", error);
      } finally {
        setUser(currentUser);
        if (currentUser) {
          setAutoLoginState("idle");
        } else {
          setIsAdmin(false);
          setUserData(null);
          setView("dashboard");
          // Native + son provider kayıtlı + henüz denenmediyse: sessiz auto-login.
          if (
            isNativePlatform() &&
            getLastProvider() &&
            !autoLoginAttemptedRef.current
          ) {
            autoLoginAttemptedRef.current = true;
            const lastProvider = getLastProvider();
            setAutoLoginState("pending");
            try {
              if (lastProvider === "apple") {
                await loginWithApple();
              } else {
                await loginWithGoogle();
              }
              // Başarılıysa onAuthStateChanged tekrar tetiklenir; state'i orada idle yaparız.
            } catch {
              setAutoLoginState("failed");
            }
          }
        }
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, [setView]);

  useEffect(() => {
    let active = true;
    const loadAdmin = async () => {
      if (!user?.uid) {
        setIsAdmin(false);
        return;
      }
      const admin = await isCurrentUserAdmin(user.uid);
      if (active) setIsAdmin(admin);
    };
    loadAdmin();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    refreshRemainingUsage().catch((error) => {
      console.error("Remaining usage load error:", error);
    });
  }, [refreshRemainingUsage]);

  useEffect(() => {
    if (user?.uid) {
      identifyClarityUser(user.uid);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const loadFavorites = async () => {
      const list = await getFavoriteQuestions(user);
      if (!active) return;
      setFavoriteQuestionIds(new Set(list.map((item) => Number(item.questionId))));
    };
    loadFavorites();
    return () => {
      active = false;
    };
  }, [user]);

  return {
    user,
    userData,
    isAdmin,
    remainingUsage,
    refreshRemainingUsage,
    refreshUserData,
    favoriteQuestionIds,
    setFavoriteQuestionIds,
    isAuthReady,
    autoLoginState,
  };
}
