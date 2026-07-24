import { useState } from "react";
import { accentThemes } from "../theme/accentThemes";

const DEFAULT_ACCENT = "emerald";

export function useAppAccentTheme() {
  const [accentThemeKey, setAccentThemeKey] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_ACCENT;
    const localKey = localStorage.getItem("tusoskop-accent-theme-preference");
    if (localKey && accentThemes[localKey]) return localKey;
    const sessionKey = sessionStorage.getItem("tusoskop-accent-theme");
    if (sessionKey && accentThemes[sessionKey]) return sessionKey;
    // Sabit marka rengi — her açılışta rastgele renk marka tutarlılığını bozuyordu.
    sessionStorage.setItem("tusoskop-accent-theme", DEFAULT_ACCENT);
    return DEFAULT_ACCENT;
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
