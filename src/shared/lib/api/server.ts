import "server-only";
import { siteUrl } from "@/config/site-url";
import { camelizeKeys } from "./case";

/**
 * Lectures publiques depuis le serveur Next (rendu serveur, métadonnées SEO).
 * `API_INTERNAL_URL` : URL de l'API joignable par le serveur (ex. http://api:8000/api/v1 en Docker,
 * http://localhost:8080/api/v1 en local). Absente ou API injoignable → `null` : la page se rend comme
 * avant, données chargées par le navigateur.
 */
const INTERNAL = (process.env.API_INTERNAL_URL ?? "").replace(/\/$/, "");
/** Secret partagé avec Django : exempte le serveur Next de la limite de débit anonyme (cf. docs/RENDERING.md). */
const SSR_TOKEN = process.env.SSR_SHARED_SECRET;
/** Délai maximal : une API lente ne doit pas bloquer le rendu, le navigateur prendra le relais. */
const TIMEOUT_MS = 4_000;

/**
 * Protocole du visiteur, transmis à Django comme le ferait nginx (`X-Forwarded-Proto`). Le serveur Next appelle
 * l'API en HTTP sur le réseau interne : sans cet en-tête, la production (SECURE_SSL_REDIRECT) répond par une
 * redirection vers https://api:8000, que le fetch ne peut pas suivre, et le rendu serveur échoue sans bruit.
 * Déduit de SITE_URL : https en production, http pour la pile locale.
 */
function forwardedProto(): "http" | "https" {
  try {
    return new URL(siteUrl()).protocol === "http:" ? "http" : "https";
  } catch {
    return "https";
  }
}

/** Une fois par processus : le rendu serveur retombe sur le navigateur, mais la cause doit apparaître dans les journaux. */
let redirectWarned = false;
function warnRedirect(status: number, location: string | null) {
  if (redirectWarned) return;
  redirectWarned = true;
  console.error(
    `[serverGet] L'API répond ${status} vers ${location ?? "?"} : rendu serveur désactivé. ` +
      "Vérifier API_INTERNAL_URL, SITE_URL et DJANGO_INTERNAL_HOSTS / SECURE_PROXY_SSL_HEADER côté Django.",
  );
}

export type ServerResult<T> = { ok: true; data: T } | { ok: false; status: number };

export async function serverGet<T>(path: string, opts: { revalidate?: number; tags?: string[] } = {}): Promise<ServerResult<T>> {
  if (!INTERNAL) return { ok: false, status: 0 };
  try {
    const res = await fetch(`${INTERNAL}${path}`, {
      headers: {
        Accept: "application/json",
        "X-Forwarded-Proto": forwardedProto(),
        ...(SSR_TOKEN ? { "X-SSR-Token": SSR_TOKEN } : {}),
      },
      // une redirection signale une mauvaise configuration : la suivre masquerait l'erreur (cf. forwardedProto)
      redirect: "manual",
      next: { revalidate: opts.revalidate ?? 60, tags: opts.tags },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status >= 300 && res.status < 400) warnRedirect(res.status, res.headers.get("location"));
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: camelizeKeys(await res.json()) as T };
  } catch {
    return { ok: false, status: 0 };
  }
}
