import type { UserRole } from "@/modules/auth/types";
import type { Paginated } from "@/shared/lib/api";

/** Type d'élément suivi (`catalog.product`, `orders.order`…), libellés fournis par l'API. */
export type AuditEntity = string;

export interface AuditEntry {
  id: number;
  at: string;
  actor: { id: number; name: string; role?: UserRole };
  /** Libellé de l'action (Création, Modification…) */
  action: string;
  entity: AuditEntity;
  entityLabel: string;
  entityId: number | string | null;
  summary: string;
  /** Avant / après (ex: modification de prix) */
  diff?: { field: string; from: string | number | null; to: string | number | null }[];
}

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
  /** auteurs présents sur la page (pour le filtre) */
  actors: { id: number; name: string; role?: UserRole }[];
}
