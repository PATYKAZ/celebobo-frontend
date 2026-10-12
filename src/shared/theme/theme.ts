/** Thème choisi par le visiteur : clair, sombre ou celui de l'appareil. Gardé dans le navigateur (localStorage). */
export type ThemeChoice = "light" | "dark" | "system";

export const THEME_KEY = "theme";
export const THEME_CHOICES: ThemeChoice[] = ["light", "dark", "system"];

/**
 * Posé dans <head> : lit le choix et met la classe `dark` sur <html> avant le premier affichage (pas d'éclair blanc).
 * Par défaut, thème clair (le design de la boutique).
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export const isThemeChoice = (v: unknown): v is ThemeChoice => typeof v === "string" && (THEME_CHOICES as string[]).includes(v);
