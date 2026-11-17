import type { User, UserRole } from "./types";

/**
 * Permissions de l'équipe : codes envoyés par l'API dans `GET /me/` (`permissions`).
 *
 * L'API est la seule source : elle dérive la liste du rôle (revendeur ⊂ responsable ⊂ admin) et
 * refuse elle-même toute action non permise (403). L'UI ne fait que masquer ce que la liste
 * n'autorise pas ; il n'y a plus de matrice rôle → permissions côté interface.
 * Seuls les codes que l'interface consulte sont listés ici.
 */
export type Permission =
  | "dashboard.view" // espace équipe (revendeur et plus)
  | "analytics.view" // tableau de bord global et analytique (responsable et plus)
  | "orders.view.assigned"
  | "orders.view.all"
  | "orders.assign"
  | "orders.status.advance" // faire avancer SES commandes assignées
  | "orders.status.any" // tout statut, y compris l'annulation
  | "sales.view.own"
  | "sales.view.all"
  | "sales.create"
  | "sales.convert"
  | "sales.edit.own"
  | "sales.edit.all"
  | "sales.refund"
  | "sales.delete"
  | "exports.sales"
  | "products.view"
  | "products.manage"
  | "imports.products"
  | "stock.adjust"
  | "categories.manage"
  | "resellers.view"
  | "resellers.manage"
  | "commissions.view.own"
  | "commissions.view.all"
  | "commissions.pay"
  | "users.manage"
  | "audit.view"
  | "conversations.moderate" // boîte de discussions de l'équipe
  | "conversations.assign" // toutes les discussions, assignation du support
  | "price.adjust" // proposer un prix final dans la discussion
  | "shipping.manage"
  | "content.manage"
  | "settings.manage"
  | "membership.manage"
  | "loyalty.manage";

type WithPermissions = Pick<User, "permissions"> | null | undefined;

export function can(user: WithPermissions, permission: Permission): boolean {
  return !!user?.permissions?.includes(permission);
}

export const canAny = (user: WithPermissions, ...ps: Permission[]) => ps.some((p) => can(user, p));

export const ROLE_LABEL: Record<UserRole, string> = {
  client: "Client",
  revendeur: "Revendeur",
  mukubwa: "Responsable",
  admin: "Administrateur",
};

/** Rôles « équipe » (accès back-office). */
export const STAFF_ROLES: UserRole[] = ["revendeur", "mukubwa", "admin"];
