import type { UserRole } from "@/modules/auth/types";
import type { Paginated } from "@/shared/lib/api";

export interface UserRow {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  active: boolean;
  joinedAt: string;
  /** Revendeur qui l'a invité (null = inscription directe) */
  invitedBy: { id: number; name: string } | null;
  codeRevendeur: string | null;
}

/** Création (invitation par e-mail) ou modification d'un compte depuis le back-office. */
export interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface UserListParams {
  search?: string;
  role?: UserRole | "all";
  active?: "all" | "actif" | "inactif";
  page?: number;
  pageSize?: number;
}

export interface UsersResponse extends Paginated<UserRow> {
  /** nombre d'utilisateurs par rôle (indépendant des filtres) */
  counts: Record<UserRole | "all", number>;
}

export const ROLES: UserRole[] = ["client", "revendeur", "mukubwa", "admin"];

export const ROLE_DESCRIPTION: Record<UserRole, string> = {
  client: "Achète sur la boutique, suit ses commandes.",
  revendeur: "Traite ses commandes assignées, enregistre ses ventes, perçoit des commissions.",
  mukubwa: "Responsable : catalogue, toutes les commandes, assignations, analytique.",
  admin: "Accès complet : utilisateurs, paiements de commissions, suppressions, audit.",
};
