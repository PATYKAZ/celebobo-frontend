import type { UserRole } from "@/modules/auth/types";
import type { Paginated } from "@/shared/lib/api";
import type { DbAuditEntry } from "@/shared/mock-db/types";

export type AuditEntity = DbAuditEntry["entity"];
export type AuditEntry = DbAuditEntry;

export const AUDIT_ENTITIES: { value: AuditEntity; label: string }[] = [
  { value: "produit", label: "Produits" },
  { value: "vente", label: "Ventes" },
  { value: "commande", label: "Commandes" },
  { value: "catégorie", label: "Catégories" },
  { value: "utilisateur", label: "Utilisateurs" },
  { value: "revendeur", label: "Revendeurs" },
  { value: "commission", label: "Commissions" },
  { value: "stock", label: "Stock" },
];

export interface AuditListParams {
  search?: string;
  entity?: AuditEntity | "all";
  /** id de l'auteur */
  actorId?: number | "all";
  /** ISO date (yyyy-mm-dd) */
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditResponse extends Paginated<AuditEntry> {
  /** auteurs ayant des entrées (pour le filtre) */
  actors: { id: number; name: string; role: UserRole }[];
}
