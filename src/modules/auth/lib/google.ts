import { env } from "@/config/env";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const STATE_KEY = "celebobo-google-oauth";

export const googleEnabled = () => !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CALLBACK_URL;

/** Redirige vers Google ; `state` (anti-CSRF) et la page de retour sont gardés le temps de l'aller-retour. */
export function startGoogleLogin(next: string) {
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, JSON.stringify({ state, next }));
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  window.location.assign(`${AUTHORIZE_URL}?${params}`);
}

/** Vérifie le `state` reçu (usage unique) et renvoie la page de retour, ou null si invalide. */
export function consumeGoogleState(state: string | null): string | null {
  const saved = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  if (!saved || !state) return null;
  try {
    const parsed = JSON.parse(saved) as { state: string; next: string };
    return parsed.state === state ? parsed.next : null;
  } catch {
    return null;
  }
}
