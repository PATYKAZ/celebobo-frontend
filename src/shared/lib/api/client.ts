import { env } from "@/config/env";
import { camelizeKeys, snakeizeKeys } from "./case";
import { ApiError } from "./errors";

type Query = Record<string, string | number | boolean | null | undefined | (string | number)[]>;

export interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  params?: Query;
  /** Désactive la conversion camelCase/snake_case du corps (rare). */
  raw?: boolean;
}

/** Hook global (ex: déconnexion automatique sur 401). Défini par le module `auth`. */
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

/** Jeton optionnel (si le backend passe en JWT). Sinon : session Django par cookie. */
let authToken: string | null = null;
export const setAuthToken = (token: string | null) => {
  authToken = token;
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

async function request<T>(method: string, path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
  const { params, raw, headers, ...init } = opts;
  const url = `${env.API_URL}${path}${buildQuery(params)}`;

  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const finalHeaders = new Headers(headers);
  finalHeaders.set("Accept", "application/json");
  if (body !== undefined && !isForm) finalHeaders.set("Content-Type", "application/json");
  if (authToken) finalHeaders.set("Authorization", `Bearer ${authToken}`);
  if (method !== "GET") {
    const csrf = getCookie(env.CSRF_COOKIE);
    if (csrf) finalHeaders.set("X-CSRFToken", csrf);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      credentials: "include",
      headers: finalHeaders,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(raw ? body : snakeizeKeys(body)),
      ...init,
    });
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur.");
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
  const parsed = raw ? data : camelizeKeys(data);

  if (!res.ok) {
    if (res.status === 401) onUnauthorized?.();
    const detail = (parsed as { detail?: string } | undefined)?.detail;
    throw new ApiError(res.status, detail ?? res.statusText ?? "Erreur API", parsed);
  }
  return parsed as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("POST", path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PUT", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PATCH", path, body, opts),
  delete: <T = void>(path: string, opts?: RequestOptions) => request<T>("DELETE", path, undefined, opts),
  /** URL absolue (téléchargements : export Excel / PDF). */
  url: (path: string, params?: Query) => `${env.API_URL}${path}${buildQuery(params)}`,
};
