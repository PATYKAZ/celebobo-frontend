/** Liste paginée côté front (forme stable, indépendante du backend). */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  page?: number;
  pageSize?: number;
  totalPages?: number;
  /** Méta supplémentaires renvoyées par certaines listes (compteurs par statut, totaux…). */
  meta?: Record<string, unknown>;
}

/** Enveloppe de pagination de l'API Celebobo (après camelCase). */
export interface PageEnvelope<T> {
  results: T[];
  next: string | null;
  previous: string | null;
  meta: { count: number; page: number; pageSize: number; totalPages: number } & Record<string, unknown>;
}

/** Paramètres de pagination communs. */
export interface PageParams {
  page?: number;
  pageSize?: number;
}

/** Erreurs de validation : { field: ["msg"], nonFieldErrors: ["msg"] } (après camelCase). */
export type FieldErrors = Record<string, string[] | string>;

/** Corps d'erreur « problem+json » de l'API (après camelCase). */
export interface Problem {
  type?: string;
  title?: string;
  status?: number;
  code?: string;
  detail?: string;
  errors?: FieldErrors;
  meta?: Record<string, unknown>;
  requestId?: string;
}
