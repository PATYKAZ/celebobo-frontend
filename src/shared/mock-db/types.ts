import type { UserRole } from "@/modules/auth/types";
import type { PaymentMethod } from "@/modules/orders/types";

export type Availability = "online" | "away" | "offline";

/** Utilisateur de la base de démo (clients, revendeurs, responsable, admin). */
export interface DbUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar: string | null;
  phoneNumber: string | null;
  joinedAt: string;
  /** Compte actif (un revendeur désactivé ne peut plus recevoir de commandes) */
  active: boolean;
  /** id du revendeur qui a invité cet utilisateur (Profile.invited_by) — jamais lui-même */
  invitedBy: number | null;
  /** Revendeurs : code d'invitation à 4 chiffres (Profile.code_revendeur) */
  codeRevendeur?: string;
  availability?: Availability;
  /** Revendeurs : taux de commission (0.07 = 7 %) */
  commissionRate?: number;
}

export type SaleStatus = "valide" | "remboursée" | "retournée";

/** shop.models.Vente enrichie (v2) : une ligne = un produit × quantité. */
export interface DbSale {
  id: number;
  productId: number;
  /** VENDEUR (v1 : Vente.utilisateur = revendeur/mukubwa qui a enregistré la vente) */
  sellerId: number;
  /** Acheteur (compte client) si connu */
  buyerId: number | null;
  /** Texte libre « vendu à » */
  soldTo: string | null;
  quantity: number;
  /** price_final unitaire */
  unitPrice: number;
  method: PaymentMethod;
  /** date_achat */
  soldAt: string;
  /** date_enregistrement */
  recordedAt: string;
  orderId: number | null;
  status: SaleStatus;
  refund?: { amount: number; reason: string; at: string; by: number } | null;
}

export interface DbCommissionPayment {
  id: number;
  resellerId: number;
  amount: number;
  paidAt: string;
  note: string | null;
  paidBy: number;
}

export interface DbAuditEntry {
  id: number;
  at: string;
  actor: { id: number; name: string; role: UserRole };
  action: string;
  entity: "produit" | "vente" | "commande" | "catégorie" | "utilisateur" | "revendeur" | "commission" | "stock";
  entityId: number | string | null;
  summary: string;
  /** Avant / après (ex: modification de prix) */
  diff?: { field: string; from: string | number | null; to: string | number | null }[];
}

export interface DbStockMovement {
  id: number;
  productId: number;
  at: string;
  /** + entrée / − sortie */
  delta: number;
  reason: "inventaire" | "réapprovisionnement" | "vente" | "retour" | "correction" | "perte";
  by: { id: number; name: string };
  note?: string | null;
  balanceAfter: number;
}

export interface DbAddress {
  id: number;
  userId: number;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  quarter: string;
  city: string;
  country: string;
  isDefault: boolean;
}
