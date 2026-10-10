"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * Rend le focus à l'élément actif au moment de l'ouverture (bouton déclencheur).
 * Radix ne le fait que pour son propre `Trigger` ; nos couches sont contrôlées par `open`.
 * À passer en `onCloseAutoFocus` du contenu (Dialog, AlertDialog, Sheet, Drawer vaul).
 */
export function useReturnFocus(open: boolean) {
  const opener = useRef<HTMLElement | null>(null);

  // effet de mise en page : s'exécute avant l'autofocus de Radix (useEffect), le déclencheur a encore le focus
  useLayoutEffect(() => {
    if (open) opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, [open]);

  return useCallback((event: Event) => {
    const el = opener.current;
    opener.current = null;
    if (el?.isConnected && el !== document.body) {
      event.preventDefault();
      el.focus({ preventScroll: true });
    }
  }, []);
}
