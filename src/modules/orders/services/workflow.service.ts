import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { can } from "@/modules/auth/permissions";
import type { User } from "@/modules/auth/types";
import { api, ApiError, mockResponse } from "@/shared/lib/api";
import { channels, realtime, type UserEvent } from "@/shared/lib/realtime";
import { DB, fullName, userById } from "@/shared/mock-db";
import { actorName, getActor, logAudit } from "@/shared/mock-db/selectors";
import { ORDER_FINAL, ORDER_FLOW, ORDER_STATUS_LABEL, type Order, type OrderStatus } from "../types";

type Actor = Pick<User, "id" | "role" | "firstName" | "lastName">;

export interface Transition {
  ok: boolean;
  reason?: string;
}

/**
 * Règles de transition (UI + mock ; le backend reste l'autorité) :
 *  - client    : annuler SA commande tant qu'elle est « en attente »
 *  - revendeur : faire avancer SES commandes assignées d'un cran (assignee → confirmee → payee → en_livraison → livree)
 *  - responsable/admin : toutes transitions vers l'avant, annulation, retour d'une commande livrée
 */
export function canTransition(actor: Actor | null | undefined, order: Order, to: OrderStatus): Transition {
  if (!actor) return { ok: false, reason: "Non connecté" };
  if (ORDER_FINAL.includes(order.status) && !(order.status === "livree" && to === "retournee"))
    return { ok: false, reason: "Cette commande est clôturée." };
  if (order.status === to) return { ok: false, reason: "Statut identique" };

  if (actor.role === "client") {
    return order.user.id === actor.id && order.status === "attente" && to === "annulee"
      ? { ok: true }
      : { ok: false, reason: "Vous ne pouvez annuler qu'une commande en attente." };
  }
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

const find = (id: number) => {
  const o = DB.orders.find((x) => x.id === id);
  if (!o) throw new ApiError(404, "Commande introuvable");
  return o;
};

function pushEvent(o: Order, status: OrderStatus, note?: string | null) {
  const a = getActor();
  o.status = status;
  o.statusHistory.push({ status, at: new Date().toISOString(), by: { id: a.id, name: actorName(a), role: a.role }, note: note ?? null });
  const ev: UserEvent = { type: "order.status", orderId: o.id, status };
  realtime.emit(channels.user(o.user.id), ev);
  if (o.assignedRevendeur) realtime.emit(channels.user(o.assignedRevendeur.id), ev);
}

export const orderWorkflow = {
  canTransition,
  availableTransitions,

  /** Change le statut (avance, annule, retour). */
  async setStatus(orderId: number, to: OrderStatus, opts: { note?: string } = {}): Promise<Order> {
    if (env.USE_MOCKS) {
      const o = find(orderId);
      const t = canTransition(getActor(), o, to);
      if (!t.ok) throw new ApiError(403, t.reason ?? "Transition refusée");
      const from = o.status;
      if (to === "annulee") o.cancelReason = opts.note ?? null;
      pushEvent(o, to, opts.note);
      logAudit({ action: "Statut modifié", entity: "commande", entityId: o.id, summary: `Commande #${o.id} : ${ORDER_STATUS_LABEL[from]} → ${ORDER_STATUS_LABEL[to]}`, diff: [{ field: "status", from, to }] });
      return mockResponse(o, 350);
    }
    const path = to === "annulee" && getActorRole() === "client" ? ENDPOINTS.orderActions.cancel(orderId) : ENDPOINTS.admin.orderWorkflow.status(orderId);
    return api.post<Order>(path, { status: to, note: opts.note, reason: opts.note });
  },

  /** Assigne (ou réassigne) à un revendeur actif. L'ancien statut « attente » passe à « assignee ». */
  async assign(orderId: number, resellerId: number, opts: { note?: string } = {}): Promise<Order> {
    if (env.USE_MOCKS) {
      const a = getActor();
      if (!can(a, "orders.assign")) throw new ApiError(403, "Seul un responsable peut assigner une commande.");
      const o = find(orderId);
      const r = userById(resellerId);
      if (!r || r.role !== "revendeur") throw new ApiError(400, "Revendeur introuvable");
      if (!r.active) throw new ApiError(400, "Ce revendeur est désactivé.");
      const was = o.assignedRevendeur;
      o.assignedRevendeur = { id: r.id, name: fullName(r) };
      if (o.status === "attente") pushEvent(o, "assignee", opts.note ?? `Assignée à ${fullName(r)}`);
      else o.statusHistory.push({ status: o.status, at: new Date().toISOString(), by: { id: a.id, name: actorName(a), role: a.role }, note: `Réassignée à ${fullName(r)}${opts.note ? ` — ${opts.note}` : ""}` });
      realtime.emit<UserEvent>(channels.user(r.id), { type: "assignment", orderId: o.id });
      logAudit({ action: was ? "Commande réassignée" : "Commande assignée", entity: "commande", entityId: o.id, summary: `Commande #${o.id} ${was ? `: ${was.name} → ` : "assignée à "}${fullName(r)}` });
      return mockResponse(o, 400);
    }
    // Endpoint unique : le backend distingue assignation / réassignation selon l'état de la commande.
    return api.post<Order>(ENDPOINTS.admin.orders.assign(orderId), { revendeurId: resellerId, note: opts.note });
  },
};

function getActorRole() {
  return getActor().role;
}
