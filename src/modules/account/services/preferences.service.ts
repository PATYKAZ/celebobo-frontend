import { ENDPOINTS } from "@/config/endpoints";
import { api, ApiError } from "@/shared/lib/api";
import type { NotificationPreferences, PushDevice } from "../types";
import { toDevice, type DeviceDto } from "./account.mapper";

export type PushState = "unsupported" | "default" | "granted" | "denied";

const SW_PATH = "/sw.js";
const deviceKey = (uid: number) => `celebobo-push-device-${uid}`;

/**
 * La clé VAPID arrive en base64 DER (SubjectPublicKeyInfo, `MFkw…`) alors que `PushManager.subscribe`
 * attend le point P-256 brut non compressé (65 octets) : ce sont les 65 derniers octets du DER.
 */
export function vapidKeyBytes(publicKey: string): Uint8Array<ArrayBuffer> {
  const b64 = publicKey.trim().replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
  return bytes.length > 65 ? bytes.slice(bytes.length - 65) : bytes;
}

const toBase64Url = (buf: ArrayBuffer | null) =>
  buf ? btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : "";

function storedDevice(uid: number): number | null {
  try {
    return Number(localStorage.getItem(deviceKey(uid))) || null;
  } catch {
    return null;
  }
}

function storeDevice(uid: number, id: number | null) {
  try {
    if (id) localStorage.setItem(deviceKey(uid), String(id));
    else localStorage.removeItem(deviceKey(uid));
  } catch {
    /* stockage indisponible */
  }
}

export const preferencesService = {
  get(): Promise<NotificationPreferences> {
    return api.get<NotificationPreferences>(ENDPOINTS.notificationPreferences.get);
  },

  save(prefs: NotificationPreferences): Promise<NotificationPreferences> {
    return api.patch<NotificationPreferences>(ENDPOINTS.notificationPreferences.get, prefs);
  },

  async devices(): Promise<PushDevice[]> {
    return (await api.get<DeviceDto[]>(ENDPOINTS.profile.devices)).map(toDevice);
  },

  async removeDevice(id: number, uid: number): Promise<void> {
    await api.delete(ENDPOINTS.profile.device(id));
    if (storedDevice(uid) === id) {
      storeDevice(uid, null);
      const reg = await navigator.serviceWorker?.getRegistration(SW_PATH);
      await (await reg?.pushManager.getSubscription())?.unsubscribe();
    }
  },

  /** Identifiant de l'appareil courant (mémorisé à l'abonnement : l'API ne renvoie pas l'endpoint). */
  currentDevice: storedDevice,

  pushState(): PushState {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
    return Notification.permission as PushState;
  },

  /** Autorisation du navigateur → Service Worker → abonnement Web Push → `POST /me/devices/`. */
  async enablePush(uid: number): Promise<PushState> {
    if (this.pushState() === "unsupported") return "unsupported";
    const result = (await Notification.requestPermission()) as PushState;
    if (result !== "granted") return result;

    const { publicKey, enabled } = await api.get<{ publicKey: string; enabled: boolean }>(ENDPOINTS.profile.pushPublicKey);
    if (!enabled || !publicKey) throw new ApiError(503, "Les notifications push ne sont pas disponibles pour le moment.");
    const reg = await navigator.serviceWorker.register(SW_PATH);
    await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKeyBytes(publicKey) }));
    const device = await api.post<DeviceDto>(ENDPOINTS.profile.devices, {
      endpoint: sub.endpoint,
      keys: { p256dh: toBase64Url(sub.getKey("p256dh")), auth: toBase64Url(sub.getKey("auth")) },
      userAgent: navigator.userAgent.slice(0, 255),
    });
    storeDevice(uid, device.id);
    return result;
  },
};
