/** Réponse paginée standard DRF (PageNumberPagination). */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Paramètres de pagination communs. */
export interface PageParams {
  page?: number;
  pageSize?: number;
}

/** Erreurs de validation DRF : { field: ["msg"], nonFieldErrors: ["msg"] } (après camelCase). */
export type FieldErrors = Record<string, string[] | string>;
