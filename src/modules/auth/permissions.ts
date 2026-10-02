import type { User, UserRole } from "./types";

/**
 * Matrice de permissions — SOURCE DE VÉRITÉ côté UI (le backend reste l'autorité : 403).
 *
 * v1 : `admin_required` laissait entrer revendeur + mukubwa avec des données filtrées
 *      (revendeur = ses commandes / ses ventes ; mukubwa = tout).
 * v2 : 3 niveaux distincts —
 *   revendeur : son espace (ses commandes, ses ventes, ses commissions, ses invités, ses discussions)
 *   mukubwa   : gère tout le catalogue + toutes les commandes/ventes, assigne, voit l'analytique
 *   admin     : + utilisateurs & rôles, paiement des commissions, suppressions, journal d'audit
 */
export type Permission =
  | "backoffice.access"
  | "dashboard.own"
  | "dashboard.all"
  | "orders.view.own"
  | "orders.view.all"
  | "orders.assign"
  | "orders.status.advance" // faire avancer SES commandes assignées
  | "orders.status.any"
  | "orders.cancel"
  | "sales.view.own"
  | "sales.view.all"
  | "sales.create"
  | "sales.convert"
  | "sales.edit.own"
  | "sales.edit.all"
  | "sales.refund"
  | "sales.delete"
  | "sales.export"
  | "products.view"
  | "products.manage"
  | "products.delete"
  | "products.import"
  | "stock.adjust"
  | "categories.manage"
  | "resellers.view"
  | "resellers.manage"
  | "commissions.view.own"
  | "commissions.view.all"
  | "commissions.pay"
  | "users.manage"
  | "analytics.view"
  | "analytics.resellers"
  | "audit.view"
  | "inbox.view.own"
  | "inbox.view.all"
  | "price.adjust"; // proposer un prix final dans la discussion

const RESELLER: Permission[] = [
  "backoffice.access",
  "dashboard.own",
  "orders.view.own",
  "orders.status.advance",
  "sales.view.own",
  "sales.create",
  "sales.convert",
  "sales.edit.own",
  "products.view",
  "commissions.view.own",
  "inbox.view.own",
  "price.adjust",
];

const MANAGER: Permission[] = [
  ...RESELLER,
  "dashboard.all",
  "orders.view.all",
  "orders.assign",
  "orders.status.any",
  "orders.cancel",
  "sales.view.all",
  "sales.edit.all",
  "sales.refund",
  "sales.export",
  "products.manage",
  "products.import",
  "stock.adjust",
  "categories.manage",
  "resellers.view",
  "resellers.manage",
  "commissions.view.all",
  "analytics.view",
  "analytics.resellers",
  "inbox.view.all",
];

const ADMIN: Permission[] = [...MANAGER, "sales.delete", "products.delete", "commissions.pay", "users.manage", "audit.view"];

export const PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  client: new Set<Permission>(),
  revendeur: new Set(RESELLER),
  mukubwa: new Set(MANAGER),
  admin: new Set(ADMIN),
};

export function can(user: Pick<User, "role"> | null | undefined, permission: Permission): boolean {
  return !!user && PERMISSIONS[user.role].has(permission);
}

export const canAny = (user: Pick<User, "role"> | null | undefined, ...ps: Permission[]) => ps.some((p) => can(user, p));

export const ROLE_LABEL: Record<UserRole, string> = {
  client: "Client",
  revendeur: "Revendeur",
  mukubwa: "Responsable",
  admin: "Administrateur",
};

/** Rôles « équipe » (accès back-office). */
export const STAFF_ROLES: UserRole[] = ["revendeur", "mukubwa", "admin"];
