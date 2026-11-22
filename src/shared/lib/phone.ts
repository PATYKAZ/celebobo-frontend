/**
 * Numéros mobiles de RDC — même règle que l'API (`apps/accounts/domain/phone.py`) :
 * `+243` suivi des 9 chiffres du numéro national, qui commence par 8 ou 9.
 * Formats acceptés : `+243 81 234 5678`, `00243812345678`, `243812345678`, `0812345678`, `812345678`
 * (espaces, points, tirets et parenthèses ignorés), y compris avec le `0` gardé après l'indicatif
 * (`+243 0812345678`, `+243 (0)81 234 5678`). Chiffres ASCII uniquement.
 */
const SEPARATORS = /[\s.()-]/g;
const NATIONAL = /^[89][0-9]{8}$/;
const COUNTRY_PREFIXES = ["+243", "00243", "243"];

export const PHONE_PLACEHOLDER = "+243 81 234 5678";
export const PHONE_HINT = "Numéro mobile congolais : +243 81 234 5678 ou 0812345678.";
export const PHONE_INVALID = "Numéro invalide : saisissez un numéro mobile congolais, par exemple 0812345678 ou +243 81 234 5678.";
export const PHONE_REQUIRED = "Le numéro de téléphone est obligatoire.";

/** Forme E.164 (`+243…`) du numéro, ou `null` s'il ne s'agit pas d'un mobile congolais. */
export function normalizeDrcPhone(raw: string): string | null {
  let digits = raw.trim().replace(SEPARATORS, "");
  const prefix = COUNTRY_PREFIXES.find((p) => digits.startsWith(p));
  if (prefix) digits = digits.slice(prefix.length);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return NATIONAL.test(digits) ? `+243${digits}` : null;
}

/** Message d'erreur du champ téléphone (`undefined` si valide). */
export function phoneError(raw: string, { required = true } = {}): string | undefined {
  if (!raw.trim()) return required ? PHONE_REQUIRED : undefined;
  return normalizeDrcPhone(raw) ? undefined : PHONE_INVALID;
}
