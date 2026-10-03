/**
 * Variables d'environnement typées. Un seul endroit pour les lire.
 * Mode MOCK : actif si NEXT_PUBLIC_USE_MOCKS=true OU si aucune API_URL n'est définie.
 */
const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const forceMocks = process.env.NEXT_PUBLIC_USE_MOCKS;

export const env = {
  API_URL: apiUrl,
  USE_MOCKS: forceMocks ? forceMocks === "true" : apiUrl === "",
  CSRF_COOKIE: process.env.NEXT_PUBLIC_CSRF_COOKIE ?? "csrftoken",
  MEDIA_HOST: process.env.NEXT_PUBLIC_MEDIA_HOST ?? "",
  /** WebSocket du backend (ws(s)://hôte/ws/). Les rewrites Next ne relaient pas les WebSockets. */
  WS_URL: process.env.NEXT_PUBLIC_WS_URL ?? "",
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
  /** Doit être identique à GOOGLE_OAUTH_CALLBACK_URL côté backend et déclarée dans la console Google. */
  GOOGLE_CALLBACK_URL: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CALLBACK_URL ?? "",
} as const;
