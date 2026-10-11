"use client";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useState } from "react";
import { useHydrated } from "./useHydrated";

/**
 * Donnée de requête partagée, sûre pour l'hydratation. Une requête lancée par un composant déjà hydraté
 * (en-tête, pied de page) peut répondre avant qu'une autre section ne s'hydrate : celle-ci rendrait alors
 * autre chose que le HTML du serveur (erreur d'hydratation). La donnée n'est donc montrée avant
 * l'hydratation que si elle était déjà là au premier rendu — c'est-à-dire fournie par le serveur.
 */
export function useHydrationSafe<T>(key: QueryKey, data: T | undefined): T | undefined {
  const qc = useQueryClient();
  const [fromServer] = useState(() => qc.getQueryData(key) !== undefined);
  const hydrated = useHydrated();
  return hydrated || fromServer ? data : undefined;
}
