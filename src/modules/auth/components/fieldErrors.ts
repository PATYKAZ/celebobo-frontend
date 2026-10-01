import { ApiError } from "@/shared/lib/api";

/** Premier message d'erreur d'un champ DRF (`{ field: ["msg"] }`). */
export function fieldError(error: unknown, ...keys: string[]): string | undefined {
  if (!(error instanceof ApiError)) return undefined;
  const fe = error.fieldErrors;
  for (const k of keys) {
    const v = fe[k];
    if (v) return Array.isArray(v) ? v[0] : v;
  }
  return undefined;
}

/** Message général (non lié à un champ). */
export function generalError(error: unknown): string | undefined {
  if (!error) return undefined;
  if (error instanceof ApiError) {
    const fe = error.fieldErrors;
    const v = fe.nonFieldErrors ?? fe.detail;
    if (v) return Array.isArray(v) ? v[0] : v;
    if (Object.keys(fe).length) return undefined; // déjà affiché sur les champs
    return error.message;
  }
  return error instanceof Error ? error.message : "Une erreur est survenue.";
}
