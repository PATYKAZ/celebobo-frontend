"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** false au rendu serveur et à l'hydratation, true ensuite : pour l'état client seul (stores persistés, session). */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
