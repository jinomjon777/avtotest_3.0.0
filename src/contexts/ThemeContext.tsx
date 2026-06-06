import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ThemeColors {
  bg: string; surface: string; card: string; cardHover: string;
  border: string; borderHover: string;
  accent: string; accentB: string; accentC: string; gold: string;
  textPrimary: string; textSecondary: string; textHint: string;
}

export const DARK: ThemeColors = {
  bg: "#0A0B14", surface: "#111220", card: "#16172a", cardHover: "#1c1d35",
  border: "rgba(255,255,255,0.07)", borderHover: "rgba(124,111,255,0.35)",
  accent: "#7C6FFF", accentB: "#00C9C4", accentC: "#FF5F6D", gold: "#F5A623",
  textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.55)", textHint: "rgba(255,255,255,0.30)",
};

export const LIGHT: ThemeColors = {
  bg: "#F0F2FA", surface: "#E8EBF5", card: "#FFFFFF", cardHover: "#F0F2FF",
  border: "rgba(0,0,0,0.09)", borderHover: "rgba(108,95,245,0.4)",
  accent: "#6C5FF5", accentB: "#009E9A", accentC: "#D94F5E", gold: "#C47F0A",
  textPrimary: "#0D0E1A", textSecondary: "rgba(13,14,26,0.58)", textHint: "rgba(13,14,26,0.36)",
};

interface ThemeCtx {
  isDark: boolean;
  toggleTheme: () => void;
  CS: ThemeColors;
}

const ThemeContext = createContext<ThemeCtx>({ isDark: true, toggleTheme: () => {}, CS: DARK });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
    } catch {}
    return true;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
      html.classList.remove("light");
    } else {
      html.classList.remove("dark");
      html.classList.add("light");
    }
    try { localStorage.setItem("theme", isDark ? "dark" : "light"); } catch {}
  }, [isDark]);

  const toggleTheme = () => setIsDark(d => !d);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, CS: isDark ? DARK : LIGHT }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
