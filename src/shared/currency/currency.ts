/** Devise d'affichage (module neutre : serveur et client). Tous les prix restent enregistrés et payés en USD. */
export type DisplayCurrency = "USD" | "CDF";

/** Cookie lu par le serveur : les pages arrivent déjà dans la devise choisie (pas de clignotement). */
export const CURRENCY_COOKIE = "cb_currency";

export const parseCurrency = (value: string | undefined | null): DisplayCurrency => (value === "CDF" ? "CDF" : "USD");

export const CURRENCY_LABEL: Record<DisplayCurrency, string> = { USD: "$ USD", CDF: "FC" };
