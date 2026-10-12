"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { NAVIGATION_START } from "@/shared/hooks/useAppRouter";

/** Délai avant affichage : une navigation instantanée (page préchargée) ne fait pas clignoter la barre. */
const SHOW_DELAY = 120;
/** Garde-fou : une navigation abandonnée ne laisse pas la barre affichée. */
const MAX_DURATION = 15_000;

const locationKey = () => window.location.pathname + window.location.search;

/** Lien interne qui va déclencher une navigation dans l'application (pas un nouvel onglet, un fichier, l'API). */
function isNavigatingLink(e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = (e.target as Element | null)?.closest?.("a[href]");
  if (!(a instanceof HTMLAnchorElement) || a.target === "_blank" || a.hasAttribute("download")) return false;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return false;
  return url.pathname + url.search !== locationKey();
}

/**
 * Barre de progression en haut de l'écran dès le clic (lien interne, ou `push` de useAppRouter), jusqu'à
 * l'arrivée de la nouvelle URL. Complète `loading.tsx` : en développement ou pour une page non préchargée,
 * le squelette n'arrive qu'avec la réponse du serveur ; la barre, elle, répond immédiatement.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const qs = useSearchParams().toString();
  const current = pathname + (qs ? `?${qs}` : "");
  // URL de départ de la navigation en cours ; la barre disparaît d'elle-même quand l'URL change
  const [from, setFrom] = useState<string | null>(null);
  // nouvelle URL affichée : navigation terminée (ajustement pendant le rendu, sans effet)
  const [shown, setShown] = useState(current);
  if (shown !== current) {
    setShown(current);
    setFrom(null);
  }

  useEffect(() => {
    let show: number | undefined;
    let stop: number | undefined;
    const start = () => {
      const origin = locationKey();
      window.clearTimeout(show);
      window.clearTimeout(stop);
      // n'affiche la barre que si la navigation n'est pas déjà terminée
      show = window.setTimeout(() => locationKey() === origin && setFrom(origin), SHOW_DELAY);
      stop = window.setTimeout(() => setFrom(null), MAX_DURATION);
    };
    const onClick = (e: MouseEvent) => {
      if (isNavigatingLink(e)) start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener(NAVIGATION_START, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(NAVIGATION_START, start);
      window.clearTimeout(show);
      window.clearTimeout(stop);
    };
  }, []);

  if (from === null || from !== current) return null;
  return (
    <div role="progressbar" aria-label="Chargement de la page" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div className="h-full origin-left animate-nav-progress bg-primary shadow-[0_0_8px_var(--color-primary)] motion-reduce:w-1/2 motion-reduce:animate-none" />
    </div>
  );
}
