import type { FieldErrors, Problem } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  private get problem(): Problem | undefined {
    return this.data && typeof this.data === "object" && !Array.isArray(this.data) ? (this.data as Problem) : undefined;
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

  /** Code métier stable de l'API (`insufficient_stock`, `validation_failed`…). */
  get code(): string | undefined {
    return this.problem?.code;
  }

  /** Erreurs par champ (400 de validation). */
  get fieldErrors(): FieldErrors {
    return this.problem?.errors ?? {};
  }
}

/** Message lisible pour l'utilisateur à partir de n'importe quelle erreur. */
export function getErrorMessage(error: unknown, fallback = "Une erreur est survenue. Réessayez."): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return "Impossible de joindre le serveur.";
    const first = Object.values(error.fieldErrors)[0];
    if (first) return Array.isArray(first) ? first[0] : first;
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}
