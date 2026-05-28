import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, consumePendingRedirectResult } from "../firebase";
import { identifyClarityUser } from "../lib/clarity";
import { getFavoriteQuestions } from "../services/studyCollectionService";
import { isCurrentUserAdmin } from "../services/adminService";
import { ensureUserDocument } from "../services/userService";
import { getRemainingFreeUsage } from "../services/usageLimitService";
import {
  DEMO_USER,
  DEMO_USER_DATA,
  isDemoMode,
} from "../services/demoModeService";

/**
 * Oturum, admin, kullanım özeti ve favori kimlikleri — App içindeki auth yan etkileri.
 */
export function useAppAuthBootstrap(setView) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [remainingUsage, setRemainingUsage] = useState(null);
  const [favoriteQuestionIds, setFavoriteQuestionIds] = useState(new Set());
  const [demoActive, setDemoActive] = useState(false);
  const isDemo = isDemoMode(user, userData) || demoActive;

  const refreshRemainingUsage = useCallback(async () => {
    const usage = await getRemainingFreeUsage(user, userData);
    setRemainingUsage(usage);
    return usage;
  }, [user, userData]);

  const startDemoMode = useCallback(() => {
    setDemoActive(true);
    setUser(DEMO_USER);
    setUserData(DEMO_USER_DATA);
    setIsAdmin(false);
    setFavoriteQuestionIds(new Set());
    setView("dashboard");
  }, [setView]);

  const endDemoMode = useCallback(() => {
    setDemoActive(false);
    setUser(null);
    setUserData(null);
    setIsAdmin(false);
    setFavoriteQuestionIds(new Set());
    setRemainingUsage(null);
    setView("dashboard");
  }, [setView]);

  useEffect(() => {
    // popup-blocked fallback yalnız çağrıldığında bir redirect sonucu olur;
    // null kontrolü ile iOS Safari ITP'de güvenli geçer.
    consumePendingRedirectResult().catch(() => {
      /* sessizce yut */
    });
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (demoActive) return;
      try {
        if (currentUser?.uid) {
          const ensured = await ensureUserDocument(currentUser);
          setUserData(ensured);
        }
      } catch (error) {
        console.error("User profile sync error:", error);
      } finally {
        setUser(currentUser);
        if (!currentUser) {
          setIsAdmin(false);
          setUserData(null);
          setView("dashboard");
        }
      }
    });
    return () => unsubscribe();
  }, [demoActive, setView]);

  useEffect(() => {
    let active = true;
    const loadAdmin = async () => {
      if (isDemo || !user?.uid) {
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
  }, [isDemo, user]);

  useEffect(() => {
    refreshRemainingUsage().catch((error) => {
      console.error("Remaining usage load error:", error);
    });
  }, [refreshRemainingUsage]);

  useEffect(() => {
    if (!isDemo && user?.uid) {
      identifyClarityUser(user.uid);
    }
  }, [isDemo, user]);

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
    isDemo,
    isAdmin,
    remainingUsage,
    refreshRemainingUsage,
    favoriteQuestionIds,
    setFavoriteQuestionIds,
    startDemoMode,
    endDemoMode,
  };
}
