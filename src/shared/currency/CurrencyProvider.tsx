"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { formatPrice } from "@/shared/lib/format";
import { useSiteSettings } from "@/modules/site/hooks/useSiteSettings";
import { CURRENCY_COOKIE, parseCurrency, type DisplayCurrency } from "./currency";

interface CurrencyContextValue {
  currency: DisplayCurrency;
  /** Taux du jour (1 $ = rate FC), réglé dans le back-office. */
  rate: number;
  setCurrency: (currency: DisplayCurrency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({ currency: "USD", rate: 0, setCurrency: () => {} });

/**
 * Le choix du visiteur vit dans un cookie lu par le navigateur, pas par le serveur : les pages boutique restent
 * statiques (mises en cache, régénérées en arrière-plan). Le HTML arrive en USD ; à l'hydratation, React relit le
 * cookie (useSyncExternalStore : instantané serveur USD, instantané client = cookie) et passe en FC si besoin.
 */
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const readCookie = (): DisplayCurrency =>
  parseCurrency(document.cookie.split("; ").find((c) => c.startsWith(`${CURRENCY_COOKIE}=`))?.slice(CURRENCY_COOKIE.length + 1));
const serverSnapshot = (): DisplayCurrency => "USD";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency = useSyncExternalStore(subscribe, readCookie, serverSnapshot);
  const { usdToCdf } = useSiteSettings();
  const setCurrency = useCallback((next: DisplayCurrency) => {
    document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    listeners.forEach((listener) => listener());
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
