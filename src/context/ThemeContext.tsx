import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "../services";
import { safeStorage } from "../utils/storage";

export type ThemeMode = "dark" | "light" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  effectiveTheme: "dark" | "light";
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = safeStorage.getItem("revivepay_theme") as ThemeMode;
    if (saved && ["dark", "light", "system"].includes(saved)) {
      return saved;
    }
    return "dark"; // Default dark fintech palette
  });

  const [effectiveTheme, setEffectiveTheme] = useState<"dark" | "light">("dark");

  // Calculate effective theme based on preference and OS
  useEffect(() => {
    const resolveTheme = () => {
      if (theme === "system") {
        const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        return isDark ? "dark" : "light";
      }
      return theme;
    };

    const resolved = resolveTheme();
    setEffectiveTheme(resolved);

    // Update DOM attributes
    const root = document.documentElement;
    root.setAttribute("data-theme", resolved);
    if (resolved === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  // Listen to OS color scheme changes if system preference active
  useEffect(() => {
    if (theme !== "system" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? "dark" : "light";
      setEffectiveTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
      if (resolved === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    safeStorage.setItem("revivepay_theme", newTheme);

    // Sync to backend profile if user token exists
    const token = safeStorage.getItem("auth_token");
    if (token) {
      apiClient.patch("/auth/theme", { theme: newTheme }).catch(() => {
        // ignore offline sync
      });
    }
  };

  const toggleTheme = () => {
    const next = effectiveTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
