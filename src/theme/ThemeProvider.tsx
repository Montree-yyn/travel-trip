import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { isThemeMode, saveSettingsPartial, SETTINGS_SYNC_EVENT } from "@/sync/settingsBridge";

import {
  ThemeContext,
  type ResolvedTheme,
  type ThemeMode,
} from "./theme-context";

const STORAGE_KEY = "travel-trip-theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    theme === "system" ? getSystemTheme() : theme,
  );

  useEffect(() => {
    const root = document.documentElement;
    const applied = theme === "system" ? getSystemTheme() : theme;
    root.classList.toggle("dark", applied === "dark");
    setResolvedTheme(applied);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const applied = getSystemTheme();
      document.documentElement.classList.toggle("dark", applied === "dark");
      setResolvedTheme(applied);
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    function handleSettingsSync(event: Event) {
      const detail = (event as CustomEvent<{ theme?: ThemeMode }>).detail;
      if (detail?.theme && isThemeMode(detail.theme)) {
        setThemeState(detail.theme);
      }
    }

    window.addEventListener(SETTINGS_SYNC_EVENT, handleSettingsSync);
    return () => window.removeEventListener(SETTINGS_SYNC_EVENT, handleSettingsSync);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    void saveSettingsPartial({ theme: next });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
