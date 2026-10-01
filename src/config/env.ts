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
} as const;
