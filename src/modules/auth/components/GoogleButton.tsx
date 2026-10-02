"use client";

import { env } from "@/config/env";
import { ENDPOINTS } from "@/config/endpoints";
import { toast } from "@/shared/ui/Toast";

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
    <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2 1.4-4.7 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

/**
 * « Continuer avec Google » + séparateur « ou ».
 * API : redirection vers l'URL allauth (`/accounts/google/login/`) du backend, avec `?next=` pour revenir sur la page voulue.
 * Mock : simple message d'information.
 */
export function GoogleButton({ next, label = "Continuer avec Google" }: { next?: string; label?: string }) {
  const onClick = () => {
    if (env.USE_MOCKS || !env.API_URL) {
      toast.info("Connexion Google", "Disponible une fois l'API connectée.");
      return;
    }
    const base = env.API_URL.replace(/\/api\/?$/, "");
    window.location.href = `${base}${ENDPOINTS.socialAuth.google}${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  };

  return (
    <div>
      <div className="my-4 flex items-center gap-3 sm:my-5 text-[12px] uppercase tracking-wider text-ink-3" role="separator">
        <span className="h-px flex-1 bg-line-3" /> ou <span className="h-px flex-1 bg-line-3" />
      </div>
      <button
        type="button"
        onClick={onClick}
        className="flex h-12 w-full items-center justify-center gap-3 sm:h-[45px] rounded-box border border-line bg-white text-[14px] font-semibold transition-all hover:border-ink-3 hover:bg-page/50 active:scale-[0.98]"
      >
        <GoogleLogo /> {label}
      </button>
    </div>
  );
}
