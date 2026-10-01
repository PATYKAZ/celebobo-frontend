import type { Paginated } from "./types";

/**
 * Utilitaires pour les services en mode MOCK (NEXT_PUBLIC_USE_MOCKS=true).
 * Les services appellent `mockResponse(...)` à la place de `api.*` : la signature
 * retournée est la même que celle de l'API réelle, donc brancher le backend = retirer la branche mock.
 */
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Simule la latence réseau et retourne une copie profonde (évite de muter les mocks). */
export async function mockResponse<T>(data: T | (() => T), delay = 350): Promise<T> {
  await wait(delay + Math.random() * 150);
  const value = typeof data === "function" ? (data as () => T)() : data;
  return structuredClone(value);
}

export function paginate<T>(items: T[], page = 1, pageSize = 12): Paginated<T> {
  const start = (page - 1) * pageSize;
  return {
    count: items.length,
    next: start + pageSize < items.length ? `?page=${page + 1}` : null,
    previous: page > 1 ? `?page=${page - 1}` : null,
    results: items.slice(start, start + pageSize),
  };
}

/** Génère un id incrémental pour les mocks en mémoire. */
let seq = 1000;
export const nextMockId = () => ++seq;
