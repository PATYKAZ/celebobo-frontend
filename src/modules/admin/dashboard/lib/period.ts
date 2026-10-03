/** Périodes proposées partout (tableau de bord, revendeurs, performance). */
export type PeriodKey = "7d" | "30d" | "12m";

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "7d", label: "7 j" },
  { value: "30d", label: "30 j" },
  { value: "12m", label: "12 mois" },
];

export const PERIOD_TITLE: Record<PeriodKey, string> = { "7d": "7 derniers jours", "30d": "30 derniers jours", "12m": "12 derniers mois" };

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export const dayLabel = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const monthLabel = (d: Date) => MONTHS[d.getMonth()];
