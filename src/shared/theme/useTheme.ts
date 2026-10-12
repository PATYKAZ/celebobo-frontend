"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { isThemeChoice, THEME_KEY, type ThemeChoice } from "./theme";

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const DARK_QUERY = "(prefers-color-scheme: dark)";

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return isThemeChoice(v) ? v : "light";
  } catch {
    return "light";
  }
}

const systemDark = () => typeof matchMedia !== "undefined" && matchMedia(DARK_QUERY).matches;

function apply(choice: ThemeChoice) {
  document.documentElement.classList.toggle("dark", choice === "dark" || (choice === "system" && systemDark()));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  // autre onglet, ou thème de l'appareil qui change en mode « Auto »
  const onStorage = (e: StorageEvent) => e.key === THEME_KEY && (apply(readChoice()), notify());
  const media = matchMedia(DARK_QUERY);
  const onMedia = () => readChoice() === "system" && (apply("system"), notify());
  window.addEventListener("storage", onStorage);
  media.addEventListener("change", onMedia);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
    media.removeEventListener("change", onMedia);
  };
}

/** Thème choisi, thème affiché (`resolved`) et changement ; côté serveur, clair (le script de <head> corrige avant l'affichage). */
export function useTheme() {
  const choice = useSyncExternalStore(subscribe, readChoice, () => "light" as ThemeChoice);
  const resolved = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.classList.contains("dark") ? "dark" : "light"),
    () => "light" as const,
  );
  const setTheme = useCallback((next: ThemeChoice) => {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // navigation privée : le choix vaut pour la page en cours
    }
    apply(next);
    notify();
  }, []);
  // couleur de la barre du navigateur mobile
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#0f1817" : "#226D68");
  }, [resolved]);
  return { theme: choice, resolved, setTheme };
}
