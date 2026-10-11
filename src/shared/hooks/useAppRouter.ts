"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

/** Événement écouté par NavigationProgress : une navigation vient de commencer. */
export const NAVIGATION_START = "celebobo:navigation-start";

export const signalNavigationStart = () => window.dispatchEvent(new Event(NAVIGATION_START));

/**
 * `useRouter` de Next dont `push` signale le début de navigation (barre de progression immédiate).
 * À utiliser pour toute navigation programmatique (ligne de tableau, après un enregistrement…).
 */
export function useAppRouter() {
  const router = useRouter();
  return useMemo(
    () => ({
      ...router,
      push: (...args: Parameters<typeof router.push>) => {
        signalNavigationStart();
        router.push(...args);
      },
    }),
    [router],
  );
}
