import { ApiError } from "@/shared/lib/api";

/** yyyy-mm-dd (date locale du jour). */
export const todayStr = () => {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${`${d.getDate()}`.padStart(2, "0")}`;
};

export const toDateInput = (iso: string) => iso.slice(0, 10);

/** Première erreur DRF par champ : { quantity: "Stock insuffisant" } */
export function fieldErrorsOf(e: unknown): Record<string, string> {
  if (!(e instanceof ApiError)) return {};
  return Object.fromEntries(Object.entries(e.fieldErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]));
}
