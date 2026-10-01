import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, mockResponse, type Paginated } from "@/shared/lib/api";
import { MOCK_RESELLER_OPTIONS, assignOrderToReseller, listNotifications, patchNotification } from "../mocks/store";
import type { Notification } from "../types";

export interface ResellerOption {
  id: number;
  name: string;
}

export const notificationsService = {
  async list(): Promise<Notification[]> {
    if (env.USE_MOCKS) return mockResponse(() => listNotifications(), 300);
    const r = await api.get<Paginated<Notification> | Notification[]>(ENDPOINTS.notifications.list);
    return Array.isArray(r) ? r : r.results;
  },

  async markRead(id: number): Promise<void> {
    if (env.USE_MOCKS) return mockResponse(() => void patchNotification(id, { isRead: true }), 150);
    await api.post(ENDPOINTS.notifications.markRead(id));
  },

  /** Revendeurs assignables (mukubwa). */
  async resellers(): Promise<ResellerOption[]> {
    if (env.USE_MOCKS) return mockResponse(() => MOCK_RESELLER_OPTIONS.map((r) => ({ ...r })), 200);
    const r = await api.get<Paginated<ResellerOption> | ResellerOption[]>(ENDPOINTS.admin.resellers.list);
    return Array.isArray(r) ? r : r.results;
  },

  /** Assigne la commande liée à la notification à un revendeur. */
  async assign(id: number, input: { revendeurId: number }): Promise<void> {
    if (env.USE_MOCKS) return mockResponse(() => assignOrderToReseller(id, input.revendeurId), 500);
    await api.post(ENDPOINTS.notifications.assign(id), input);
  },

  /** Assigne une discussion (hors commande). */
  async assignDiscussion(id: number, input: { revendeurId: number }): Promise<void> {
    if (env.USE_MOCKS) return mockResponse(() => assignOrderToReseller(id, input.revendeurId), 500);
    await api.post(ENDPOINTS.notifications.assignDiscussion(id), input);
  },

  async mukubwaReply(id: number, input: { message: string }): Promise<void> {
    if (env.USE_MOCKS) return mockResponse(() => void patchNotification(id, { isRead: true }), 300);
    await api.post(ENDPOINTS.notifications.mukubwaReply(id), input);
  },

  /** Le revendeur accepte ou décline la commande assignée. */
  async revendeurReply(id: number, input: { accept: boolean; message?: string }): Promise<void> {
    if (env.USE_MOCKS) return mockResponse(() => void patchNotification(id, { isRead: true }), 400);
    await api.post(ENDPOINTS.notifications.revendeurReply(id), input);
  },
};
