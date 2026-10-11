import clsx, { type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Jetons maison (globals.css) déclarés à tailwind-merge : sans cela, `text-body` serait pris
 * pour une couleur et supprimé par `text-ink`, et `rounded-box` / `pb-tabbar` ne seraient pas fusionnés.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["section", "tab", "link", "name", "price", "body", "body-lg", "small", "tiny", "h-hero", "h-page"],
      radius: ["box", "pill"],
      spacing: ["tabbar", "safe-b", "safe-t"],
    },
  },
});

/** Concatène des classes conditionnelles ; en cas de conflit Tailwind, la dernière l'emporte. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
