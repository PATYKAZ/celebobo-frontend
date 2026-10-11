"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { formatPrice } from "@/shared/lib/format";
import { useSiteSettings } from "@/modules/site/hooks/useSiteSettings";
import { CURRENCY_COOKIE, type DisplayCurrency } from "./currency";

interface CurrencyContextValue {
  currency: DisplayCurrency;
  /** Taux du jour (1 $ = rate FC), réglé dans le back-office. */
  rate: number;
  setCurrency: (currency: DisplayCurrency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({ currency: "USD", rate: 0, setCurrency: () => {} });

/** Devise d'affichage choisie par le visiteur ; `initial` vient du cookie lu par le serveur (layout boutique). */
export function CurrencyProvider({ initial, children }: { initial: DisplayCurrency; children: ReactNode }) {
  const [currency, setState] = useState(initial);
  const { usdToCdf } = useSiteSettings();
  // état client immédiat ; le cookie sert aux prochains rendus serveur (aucun prix n'est rendu par un composant serveur)
  const setCurrency = useCallback((next: DisplayCurrency) => {
    setState(next);
    document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, []);

  const value = useMemo(() => ({ currency, rate: usdToCdf, setCurrency }), [currency, usdToCdf, setCurrency]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);

/**
 * Formateur de prix pour la navigation (fiches, listes, recherche) : devise choisie par le visiteur.
 * Panier, commande et back-office restent en USD : y utiliser `formatPrice` directement.
 */
export function useFormatPrice() {
  const { currency, rate } = useCurrency();
  return useCallback((value: number | string | null | undefined) => formatPrice(value, { currency, rate }), [currency, rate]);
}
