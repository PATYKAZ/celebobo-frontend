import { DB, resellers, fullName } from "@/shared/mock-db";

/**
 * Commandes de démonstration — vue sur la base unique `shared/mock-db`.
 * Tableau MUTABLE partagé par l'espace client, le back-office et la messagerie.
 */
export const MOCK_ORDERS = DB.orders;

/** Revendeurs actifs assignables (les 23 de la base, hors comptes désactivés). */
export const MOCK_RESELLERS_LITE = resellers()
  .filter((u) => u.active)
  .map((u) => ({ id: u.id, name: fullName(u) }));
