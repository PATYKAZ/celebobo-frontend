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
  | "orders.refund" // enregistrer le remboursement d'une commande payée puis annulée
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
  | "products.origin"
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
  | "shipping.quote" // proposer les frais de livraison d'une commande en zone sur devis
  | "shipping.manage"
  | "content.manage"
  | "settings.manage"
  | "loyalty.manage"
  | "coupons.manage" // codes promo : création, conditions, activation
  | "claims.submit.own" // réclamer sur ses commandes livrées (politique de garantie)
  | "claims.manage" // traiter les réclamations : réponse, réception, diagnostic, solution
  | "store_credit.view.own" // son avoir (solde, expiration, mouvements)
  | "cash.view.own" // l'argent encaissé à reverser (revendeur)
  | "cash.manage" // enregistrer les reversements des revendeurs
  | "standing.view.own" // son niveau et ses sanctions, s'expliquer sous 48 h (revendeur)
  | "standing.manage" // revoir les niveaux, ouvrir et décider les sanctions
  | "cagnotte.view.own" // ses avantages Cagnotte (client)
  | "cagnotte.pay" // verser les cashbacks Cagnotte par Mobile Money
  | "cagnotte.manage" // créer les opérations Cagnotte (admin)
  | "contact.inbox" // messages du formulaire de contact
  | "newsletter.view" // abonnés à la newsletter, export
  | "reviews.moderate" // publier ou masquer les avis clients
  | "reseller_applications.review"; // candidatures « Devenir revendeur »

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
