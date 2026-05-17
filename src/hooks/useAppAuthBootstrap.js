import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { identifyClarityUser } from "../lib/clarity";
import { getFavoriteQuestions } from "../services/studyCollectionService";
import { isCurrentUserAdmin } from "../services/adminService";
import { ensureUserDocument } from "../services/userService";
import { getRemainingFreeUsage } from "../services/usageLimitService";

/**
 * Oturum, admin, kullanım özeti ve favori kimlikleri — App içindeki auth yan etkileri.
 */
export function useAppAuthBootstrap(setView) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [remainingUsage, setRemainingUsage] = useState(null);
  const [favoriteQuestionIds, setFavoriteQuestionIds] = useState(new Set());

  const refreshRemainingUsage = useCallback(async () => {
    const usage = await getRemainingFreeUsage(user, userData);
    setRemainingUsage(usage);
    return usage;
  }, [user, userData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
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
    favoriteQuestionIds,
    setFavoriteQuestionIds,
  };
}
