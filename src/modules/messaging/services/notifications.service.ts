import { ENDPOINTS } from "@/config/endpoints";
import { api, type Paginated } from "@/shared/lib/api";
import type { Availability, Notification, UnreadCounts } from "../types";
import { toNotification, type NotificationDto } from "./messaging.mapper";

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
  /** Notifications de l'utilisateur courant (les plus récentes d'abord) ; `meta.unread` = total non lues. */
  list(params: { page?: number; pageSize?: number; unread?: boolean } = {}): Promise<Paginated<Notification>> {
    return api.page<NotificationDto, Notification>(ENDPOINTS.notifications.list, { params }, toNotification);
  },

  counts(): Promise<UnreadCounts> {
    return api.get<UnreadCounts>(ENDPOINTS.notifications.unreadCounts);
  },

  async markRead(id: number): Promise<void> {
    await api.post(ENDPOINTS.notifications.markRead(id));
  },

  async markAllRead(): Promise<number> {
    return (await api.post<{ updated: number }>(ENDPOINTS.notifications.readAll)).updated;
  },

  /** Revendeurs assignables (présence + charge). */
  resellers(): Promise<ResellerOption[]> {
    return api.get<ResellerOption[]>(ENDPOINTS.notifications.assignableResellers);
  },

  /** Responsable : assigner la commande d'une notification « Nouvelle commande ». */
  async assignOrder(orderId: number, resellerId: number): Promise<void> {
    await api.post(ENDPOINTS.notifications.assignOrder(orderId), { resellerId });
  },

  /** Revendeur : décliner une commande assignée (retour au responsable). */
  async declineOrder(orderId: number, reason?: string): Promise<void> {
    await api.post(ENDPOINTS.notifications.declineOrder(orderId), { reason: reason ?? "" });
  },
};
