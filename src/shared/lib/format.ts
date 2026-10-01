const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

/** 1689 -> "$1,689.00" (format du design). */
export const formatPrice = (value: number | string | null | undefined): string =>
  usd.format(Number(value ?? 0));

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
