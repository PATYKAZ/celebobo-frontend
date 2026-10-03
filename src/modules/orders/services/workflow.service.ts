import { ENDPOINTS } from "@/config/endpoints";
import { can } from "@/modules/auth/permissions";
import type { User } from "@/modules/auth/types";
import { api } from "@/shared/lib/api";
import { ORDER_FINAL, ORDER_FLOW, type Order, type OrderStatus } from "../types";
import { STATUS_TO_API, toOrder, type OrderDto } from "./orders.mapper";

type Actor = Pick<User, "id" | "role" | "firstName" | "lastName">;

export interface Transition {
  ok: boolean;
  reason?: string;
}

/**
 * Règles de transition affichées par l'UI. La fiche commande de l'API fournit `allowedTransitions`
 * (source de vérité) ; les règles locales ne servent que lorsque la commande vient d'une liste.
 *  - revendeur : faire avancer SES commandes assignées d'un cran (assignee → confirmee → payee → en_livraison → livree)
 *  - responsable/admin : toutes transitions vers l'avant, annulation, retour d'une commande livrée
 */
export function canTransition(actor: Actor | null | undefined, order: Order, to: OrderStatus): Transition {
  if (!actor) return { ok: false, reason: "Non connecté" };
  if (order.status === to) return { ok: false, reason: "Statut identique" };
  if (order.allowedTransitions) {
    return order.allowedTransitions.includes(to) ? { ok: true } : { ok: false, reason: ORDER_FINAL.includes(order.status) ? "Cette commande est clôturée." : "Transition non autorisée pour votre rôle." };
  }
  if (ORDER_FINAL.includes(order.status) && !(order.status === "livree" && to === "retournee")) return { ok: false, reason: "Cette commande est clôturée." };
  if (can(actor, "orders.status.any")) {
    if (to === "annulee") return { ok: true };
    if (to === "retournee") return order.status === "livree" ? { ok: true } : { ok: false, reason: "Seule une commande livrée peut être retournée." };
    return ORDER_FLOW.indexOf(to) > ORDER_FLOW.indexOf(order.status) ? { ok: true } : { ok: false, reason: "Retour en arrière impossible." };
  }
  if (can(actor, "orders.status.advance")) {
    if (order.assignedRevendeur?.id !== actor.id) return { ok: false, reason: "Cette commande ne vous est pas assignée." };
    const i = ORDER_FLOW.indexOf(order.status);
    return i >= 1 && ORDER_FLOW[i + 1] === to ? { ok: true } : { ok: false, reason: "Étape suivante uniquement." };
  }
  return { ok: false, reason: "Permission insuffisante." };
}

/** Transitions proposées à l'acteur pour cette commande (boutons d'action). */
export function availableTransitions(actor: Actor | null | undefined, order: Order): OrderStatus[] {
  const all: OrderStatus[] = [...ORDER_FLOW, "annulee", "retournee"];
  return all.filter((s) => canTransition(actor, order, s).ok && s !== "assignee"); // « assignee » se fait via assign()
}

export const orderWorkflow = {
  canTransition,
  availableTransitions,

  /** Change le statut (avance, annule, retour) depuis le back-office. */
  async setStatus(orderId: number, to: OrderStatus, opts: { note?: string } = {}): Promise<Order> {
    const body = { to: STATUS_TO_API[to], note: opts.note ?? "", reason: to === "annulee" || to === "retournee" ? (opts.note ?? "") : "" };
    return toOrder(await api.post<OrderDto>(ENDPOINTS.admin.orders.transition(orderId), body));
  },

  /** Assigne (ou réassigne) à un revendeur actif ; une commande en attente passe à « assignee ». */
  async assign(orderId: number, resellerId: number, opts: { note?: string } = {}): Promise<Order> {
    return toOrder(await api.post<OrderDto>(ENDPOINTS.admin.orders.assign(orderId), { resellerId, note: opts.note ?? "" }));
  },

  /** Le revendeur assigné rend la commande (elle repart en attente d'assignation). */
  async decline(orderId: number, reason: string): Promise<void> {
    await api.post(ENDPOINTS.admin.orders.decline(orderId), { reason });
  },
};
