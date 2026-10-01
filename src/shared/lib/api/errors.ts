import type { FieldErrors } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }

  /** Erreurs par champ (400 DRF). */
  get fieldErrors(): FieldErrors {
    if (this.data && typeof this.data === "object" && !Array.isArray(this.data)) {
      return this.data as FieldErrors;
    }
    return {};
  }
}

/** Message lisible pour l'utilisateur à partir de n'importe quelle erreur. */
export function getErrorMessage(error: unknown, fallback = "Une erreur est survenue. Réessayez."): string {
  if (error instanceof ApiError) {
    const d = error.data as { detail?: string; message?: string; error?: string } | undefined;
    if (d?.detail) return d.detail;
    if (d?.message) return d.message;
    if (d?.error) return d.error;
    if (error.status === 0) return "Impossible de joindre le serveur.";
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}
