/**
 * Numéros mobiles de RDC — même règle que l'API (`apps/accounts/domain/phone.py`) :
 * `+243` suivi des 9 chiffres du numéro national, qui commence par 8 ou 9.
 * Formats acceptés : `+243 81 234 5678`, `00243812345678`, `243812345678`, `0812345678`, `812345678`
 * (espaces, points, tirets et parenthèses ignorés).
 */
const SEPARATORS = /[\s.()-]/g;
const NATIONAL = /^[89]\d{8}$/;
const PREFIXES = ["+243", "00243", "243", "0"];

export const PHONE_PLACEHOLDER = "+243 81 234 5678";
export const PHONE_HINT = "Numéro mobile congolais : +243 81 234 5678 ou 0812345678.";
export const PHONE_INVALID = "Numéro invalide : saisissez un numéro mobile congolais, par exemple 0812345678 ou +243 81 234 5678.";
export const PHONE_REQUIRED = "Le numéro de téléphone est obligatoire.";

/** Forme E.164 (`+243…`) du numéro, ou `null` s'il ne s'agit pas d'un mobile congolais. */
export function normalizeDrcPhone(raw: string): string | null {
  const digits = raw.trim().replace(SEPARATORS, "");
  for (const prefix of PREFIXES) {
    if (digits.startsWith(prefix) && NATIONAL.test(digits.slice(prefix.length))) return `+243${digits.slice(prefix.length)}`;
  }
  return NATIONAL.test(digits) ? `+243${digits}` : null;
}

/** Message d'erreur du champ téléphone (`undefined` si valide). */
export function phoneError(raw: string, { required = true } = {}): string | undefined {
  if (!raw.trim()) return required ? PHONE_REQUIRED : undefined;
  return normalizeDrcPhone(raw) ? undefined : PHONE_INVALID;
}
