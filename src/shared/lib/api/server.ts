import "server-only";
import { camelizeKeys } from "./case";

/**
 * Lectures publiques depuis le serveur Next (rendu serveur, métadonnées SEO).
 * `API_INTERNAL_URL` : URL de l'API joignable par le serveur (ex. http://api:8000/api/v1 en Docker,
 * http://localhost:8080/api/v1 en local). Absente ou API injoignable → `null` : la page se rend comme
 * avant, données chargées par le navigateur.
 */
const INTERNAL = (process.env.API_INTERNAL_URL ?? "").replace(/\/$/, "");
/** Secret partagé avec Django : exempte le serveur Next de la limite de débit anonyme (cf. docs/BACKEND_CHANGES.md P0-1). */
const SSR_TOKEN = process.env.SSR_SHARED_SECRET;
/** Délai maximal : une API lente ne doit pas bloquer le rendu, le navigateur prendra le relais. */
const TIMEOUT_MS = 4_000;

export type ServerResult<T> = { ok: true; data: T } | { ok: false; status: number };

export async function serverGet<T>(path: string, opts: { revalidate?: number; tags?: string[] } = {}): Promise<ServerResult<T>> {
  if (!INTERNAL) return { ok: false, status: 0 };
  try {
    const res = await fetch(`${INTERNAL}${path}`, {
      headers: { Accept: "application/json", ...(SSR_TOKEN ? { "X-SSR-Token": SSR_TOKEN } : {}) },
      next: { revalidate: opts.revalidate ?? 60, tags: opts.tags },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: camelizeKeys(await res.json()) as T };
  } catch {
    return { ok: false, status: 0 };
  }
}
