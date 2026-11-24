// montants en dollars écrits à la française, symbole après le nombre : 1689 → « 1 689,00 $ » (comme les messages du serveur)
const usd = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usdWhole = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

const cdf = new Intl.NumberFormat("fr-CD", { maximumFractionDigits: 0 });

/**
 * Seul point de formatage des prix. Sans devise : USD, ce qui est réellement payé et enregistré
 * (panier, commande, factures, back-office) — 1689 → "1 689,00 $".
 * En francs congolais (affichage seul) : montant × taux, arrondi sans décimales — 250 × 2850 → "712 500 FC".
 * En navigation, passer par `useFormatPrice()` (devise choisie par le visiteur et taux du jour).
 */
export const formatPrice = (value: number | string | null | undefined, display?: { currency: "USD" | "CDF"; rate: number }): string => {
  const amount = Number(value ?? 0);
  if (display?.currency === "CDF" && display.rate > 0) return `${cdf.format(Math.round(amount * display.rate))}\u00a0FC`;
  // espace insécable : le symbole ne passe jamais seul à la ligne
  return `${usd.format(amount)}\u00a0$`;
};

/** Montant rond sans décimales inutiles : 199 → « 199 $ », 19.5 → « 19,50 $ » (seuils, libellés courts). */
export const formatPriceShort = (value: number | string | null | undefined): string => {
  const amount = Number(value ?? 0);
  return Number.isInteger(amount) ? `${usdWhole.format(amount)}\u00a0$` : formatPrice(amount);
};

/** Grands montants des graphiques et indicateurs : 46 900 → « 46,9 k $ » ; en dessous de 1 000, le montant court. */
export const formatMoneyCompact = (value: number): string => (value >= 1000 ? `${compact.format(value)}\u00a0$` : formatPriceShort(value));

export const formatCompact = (value: number) => compact.format(value);

export const formatPercent = (value: number, digits = 0) => `${value.toFixed(digits)}%`;

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

export const formatDate = (iso: string | Date) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string | Date) => dateTimeFmt.format(new Date(iso));
export const formatTime = (iso: string | Date) => timeFmt.format(new Date(iso));

/** "il y a 3 min", "hier", ... */
export function formatRelative(iso: string | Date): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(iso);
}

export const pluralize = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
