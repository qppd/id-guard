"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type ThemeMode = "dark" | "light" | "system";
export type AccentColor = "blue" | "green" | "purple" | "orange" | "teal" | "pink";
export type CardStyle = "solid" | "glass";
export type BorderStyle = "full" | "subtle" | "none";
export type LockView = "grid" | "list";
export type CardDensity = "default" | "compact";

export interface ThemeSettings {
  theme: ThemeMode;
  accent: AccentColor;
  cardStyle: CardStyle;
  borderStyle: BorderStyle;
  lockView: LockView;
  cardDensity: CardDensity;
  showSummary: boolean;
  refreshInterval: number;
  enable3D: boolean;
  enableAnimations: boolean;
}

const STORAGE_KEY = "ttlock-settings";

const defaultSettings: ThemeSettings = {
  theme: "light",
  accent: "blue",      /* Deep Navy via globals.css */
  cardStyle: "solid",
  borderStyle: "full",
  lockView: "grid",
  cardDensity: "default",
  showSummary: true,
  refreshInterval: 60,
  enable3D: true,
  enableAnimations: true,
};

interface ThemeContextValue {
  settings: ThemeSettings;
  updateSetting: <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => void;
  resetSettings: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(settings: ThemeSettings) {
  const root = document.documentElement;

  // --- Theme mode: manage BOTH dark and light classes ---
  root.classList.remove("dark", "light");

  if (settings.theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(prefersDark ? "dark" : "light");
  } else {
    root.classList.add(settings.theme); // "dark" or "light"
  }

  // --- Data attributes ---
  root.setAttribute("data-accent", settings.accent);
  root.setAttribute("data-card-style", settings.cardStyle);
  root.setAttribute("data-border-style", settings.borderStyle);
  root.setAttribute("data-card-density", settings.cardDensity);
}

function loadSettings(): ThemeSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {}
  return defaultSettings;
}

function saveSettings(settings: ThemeSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    applyTheme(loaded);
    setMounted(true);
  }, []);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme(settings);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      applyTheme(next);
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    applyTheme(defaultSettings);
    saveSettings(defaultSettings);
  }, []);

  return (
    <ThemeContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
