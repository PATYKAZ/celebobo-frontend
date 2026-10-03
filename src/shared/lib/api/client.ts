import { env } from "@/config/env";
import { camelizeKeys, snakeizeKeys } from "./case";
import { ApiError } from "./errors";
import type { PageEnvelope, Paginated, Problem } from "./types";

type Query = Record<string, string | number | boolean | null | undefined | (string | number)[]>;

export interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  params?: Query;
  /** Désactive la conversion camelCase/snake_case du corps (rare). */
  raw?: boolean;
}

const CSRF_PATH = "/auth/csrf/";
const REFRESH_PATH = "/auth/token/refresh/";
/** Requêtes pour lesquelles un 401 ne déclenche pas de rafraîchissement du jeton. */
const NO_REFRESH = ["/auth/login/", "/auth/register/", REFRESH_PATH, "/auth/social/google/"];
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Hook global (ex: déconnexion automatique sur 401). Défini par le module `auth`. */
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

function buildQuery(params?: Query): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(snakeizeKeys<Query>(params))) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) value.forEach((v) => sp.append(key, String(v)));
    else sp.append(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[$()*+./?[\\\]^{|}-]/g, "\\$&")}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Le cookie CSRF est posé par `GET /auth/csrf/` : on l'obtient une fois avant la première écriture. */
let csrfReady: Promise<void> | null = null;
function ensureCsrf(): Promise<void> {
  if (getCookie(env.CSRF_COOKIE)) return Promise.resolve();
  csrfReady ??= fetch(`${env.API_URL}${CSRF_PATH}`, { credentials: "include" })
    .then(() => undefined)
    .finally(() => {
      csrfReady = null;
    });
  return csrfReady;
}

/** Un seul rafraîchissement à la fois : les requêtes en 401 simultanées attendent le même. */
let refreshing: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
  refreshing ??= ensureCsrf()
    .then(() =>
      fetch(`${env.API_URL}${REFRESH_PATH}`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json", "X-CSRFToken": getCookie(env.CSRF_COOKIE) ?? "" },
      }),
    )
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function send(method: string, path: string, body: unknown, opts: RequestOptions): Promise<Response> {
  const { params, raw, headers, ...init } = opts;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const finalHeaders = new Headers(headers);
  finalHeaders.set("Accept", "application/json");
  if (body !== undefined && !isForm) finalHeaders.set("Content-Type", "application/json");
  if (!SAFE_METHODS.has(method)) {
    await ensureCsrf();
    const csrf = getCookie(env.CSRF_COOKIE);
    if (csrf) finalHeaders.set("X-CSRFToken", csrf);
  }
  try {
    return await fetch(`${env.API_URL}${path}${buildQuery(params)}`, {
      method,
      credentials: "include",
      headers: finalHeaders,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(raw ? body : snakeizeKeys(body)),
      ...init,
    });
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur.");
  }
}

async function request<T>(method: string, path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
  let res = await send(method, path, body, opts);
  if (res.status === 401 && !NO_REFRESH.includes(path) && (await refreshSession())) {
    res = await send(method, path, body, opts);
  }

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  const parsed = opts.raw ? data : camelizeKeys(data);

  if (!res.ok) {
    if (res.status === 401 && !NO_REFRESH.includes(path)) onUnauthorized?.();
    const detail = (parsed as Problem | undefined)?.detail;
    throw new ApiError(res.status, detail ?? res.statusText ?? "Erreur API", parsed);
  }
  return parsed as T;
}

/** En-tête exigé par les écritures idempotentes de l'API (commande, ventes, paiements) : une clé par action. */
export const idempotent = (key: string = crypto.randomUUID()): RequestOptions => ({ headers: { "Idempotency-Key": key } });

/** Convertit l'enveloppe `{ results, next, previous, meta }` de l'API en `Paginated`. */
export function toPaginated<T, R = T>(envelope: PageEnvelope<T>, map?: (item: T) => R): Paginated<R> {
  const { count, page, pageSize, totalPages, ...meta } = envelope.meta;
  return {
    count,
    next: envelope.next,
    previous: envelope.previous,
    results: map ? envelope.results.map(map) : (envelope.results as unknown as R[]),
    page,
    pageSize,
    totalPages,
    meta,
  };
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("POST", path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PUT", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PATCH", path, body, opts),
  delete: <T = void>(path: string, opts?: RequestOptions) => request<T>("DELETE", path, undefined, opts),
  /** Liste paginée : GET + conversion de l'enveloppe (et de chaque élément si `map`). */
  page: async <T, R = T>(path: string, opts?: RequestOptions, map?: (item: T) => R) =>
    toPaginated(await request<PageEnvelope<T>>("GET", path, undefined, opts), map),
  /** URL absolue (téléchargements : factures, exports). */
  url: (path: string, params?: Query) => `${env.API_URL}${path}${buildQuery(params)}`,
};
