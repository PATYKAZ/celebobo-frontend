import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, mockResponse } from "@/shared/lib/api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { DEFAULT_PREFERENCES, type NotificationPreferences } from "../types";

const key = () => `celebobo-notif-prefs-${useAuthStore.getState().user?.id ?? "guest"}`;

export type PushState = "unsupported" | "default" | "granted" | "denied";

export const preferencesService = {
  async get(): Promise<NotificationPreferences> {
    if (env.USE_MOCKS) {
      let stored: NotificationPreferences | null = null;
      try {
        const raw = localStorage.getItem(key());
        stored = raw ? (JSON.parse(raw) as NotificationPreferences) : null;
      } catch {
        /* stockage indisponible */
      }
      return mockResponse(stored ?? DEFAULT_PREFERENCES, 200);
    }
    return api.get<NotificationPreferences>(ENDPOINTS.notificationPreferences.get);
  },

  async save(prefs: NotificationPreferences): Promise<NotificationPreferences> {
    if (env.USE_MOCKS) {
      try {
        localStorage.setItem(key(), JSON.stringify(prefs));
      } catch {
        /* stockage indisponible */
      }
      return mockResponse(prefs, 250);
    }
    return api.put<NotificationPreferences>(ENDPOINTS.notificationPreferences.get, prefs);
  },

  pushState(): PushState {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission as PushState;
  },

  /**
   * Demande l'autorisation du navigateur puis enregistre l'abonnement côté serveur.
   * TODO(api): enregistrer un Service Worker (`/sw.js`) et envoyer la `PushSubscription` (endpoint + clés) à
   * ENDPOINTS.notificationPreferences.pushSubscribe. Ici seul le statut de permission est transmis.
   */
  async enablePush(): Promise<PushState> {
    if (this.pushState() === "unsupported") return "unsupported";
    const result = (await Notification.requestPermission()) as PushState;
    if (result === "granted" && !env.USE_MOCKS) await api.post(ENDPOINTS.notificationPreferences.pushSubscribe, { permission: result });
    return result;
  },
};
