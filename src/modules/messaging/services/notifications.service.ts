import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { orderWorkflow } from "@/modules/orders/services/workflow.service";
import { api, ApiError, mockResponse, type Paginated } from "@/shared/lib/api";
import { addParticipant, assignDiscussionTo, declineAssignment, listNotifications, notificationById, patchNotification, resellerOptions } from "../mocks/store";
import type { Availability, Notification } from "../types";

export interface ResellerOption {
  id: number;
  name: string;
  availability?: Availability;
  /** Code d'invitation à 4 chiffres */
  code?: string;
  /** Commandes ouvertes (charge) */
  openOrders?: number;
}

export const notificationsService = {
  /** Notifications de l'utilisateur courant (revendeur : les siennes ; responsable/admin : boîte commune). */
  async list(): Promise<Notification[]> {
    if (env.USE_MOCKS) return mockResponse(() => listNotifications(), 150);
    const r = await api.get<Paginated<Notification> | Notification[]>(ENDPOINTS.notifications.list);
    return Array.isArray(r) ? r : r.results;
  },

  async markRead(id: number): Promise<void> {
    if (env.USE_MOCKS) return mockResponse(() => void patchNotification(id, { isRead: true }), 80);
    await api.post(ENDPOINTS.notifications.markRead(id));
  },

  /** Revendeurs actifs assignables (tous, avec présence et charge). */
  async resellers(): Promise<ResellerOption[]> {
    if (env.USE_MOCKS) return mockResponse(() => resellerOptions(), 120);
    const r = await api.get<Paginated<ResellerOption> | ResellerOption[]>(ENDPOINTS.admin.resellers.list, { params: { active: true, pageSize: 100 } });
    return Array.isArray(r) ? r : r.results;
  },

  /** Assigne la commande liée à la notification (workflow commun : droits, historique, audit, temps réel). */
  async assign(id: number, input: { revendeurId: number }): Promise<void> {
    if (env.USE_MOCKS) {
      const n = notificationById(id);
      if (!n) throw new ApiError(404, "Notification introuvable");
      await orderWorkflow.assign(n.conversationId, input.revendeurId);
      return;
    }
    await api.post(ENDPOINTS.notifications.assign(id), input);
  },

  /** Assigne une discussion (hors commande). */
  async assignDiscussion(id: number, input: { revendeurId: number }): Promise<void> {
    if (env.USE_MOCKS) {
      const n = notificationById(id);
      if (!n) throw new ApiError(404, "Notification introuvable");
      return mockResponse(() => assignDiscussionTo(n.conversationId, input.revendeurId), 350);
    }
    await api.post(ENDPOINTS.notifications.assignDiscussion(id), input);
  },

  async mukubwaReply(id: number, input: { message: string }): Promise<void> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        const n = patchNotification(id, { isRead: true });
        if (n) addParticipant(n.conversationId, 3);
      }, 200);
    }
    await api.post(ENDPOINTS.notifications.mukubwaReply(id), input);
  },

  /** Le revendeur accepte ou décline la commande assignée. */
  async revendeurReply(id: number, input: { accept: boolean; message?: string }): Promise<void> {
    if (env.USE_MOCKS) return mockResponse(() => (input.accept ? void patchNotification(id, { isRead: true }) : declineAssignment(id, input.message)), 250);
    await api.post(ENDPOINTS.notifications.revendeurReply(id), input);
  },
};
