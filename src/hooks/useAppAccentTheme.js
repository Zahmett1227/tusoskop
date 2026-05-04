import { useState } from "react";
import { accentThemes, getRandomAccentTheme } from "../theme/accentThemes";

export function useAppAccentTheme() {
  const [accentThemeKey, setAccentThemeKey] = useState(() => {
    if (typeof window === "undefined") return "emerald";
    const localKey = localStorage.getItem("tusoskop-accent-theme-preference");
    if (localKey && accentThemes[localKey]) return localKey;
    const sessionKey = sessionStorage.getItem("tusoskop-accent-theme");
    if (sessionKey && accentThemes[sessionKey]) return sessionKey;
    const randomKey = getRandomAccentTheme();
    sessionStorage.setItem("tusoskop-accent-theme", randomKey);
    return randomKey;
  });

  const accentTheme = accentThemes[accentThemeKey] || accentThemes.emerald;

  const handleAccentThemeChange = (themeKey) => {
    if (!accentThemes[themeKey]) return;
    setAccentThemeKey(themeKey);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("tusoskop-accent-theme", themeKey);
      localStorage.setItem("tusoskop-accent-theme-preference", themeKey);
    }
  };

  return { accentThemeKey, accentTheme, handleAccentThemeChange };
}
