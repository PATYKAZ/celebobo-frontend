/** Mouvements du compte de points (EntryKind de l'API). */
export type PointsMovementKind = "earn" | "spend" | "refund" | "reversal" | "expiry" | "referral" | "referral_reversal";

export interface PointsMovement {
  kind: PointsMovementKind;
  /** signé : positif = crédit, négatif = débit (1 point = 1 $) */
  amount: number;
  at: string;
  /** null sur les points de parrainage : le numéro de commande de l'invité n'est jamais donné au revendeur (politique de confidentialité, §4) */
  orderNumber: string | null;
  /** points gagnés (ou de parrainage) encore en attente de la fin du délai de retour */
  pending: boolean;
}

/** Solde de points du client ; `eligible` : le client peut utiliser ses points maintenant (programme actif, ou en cours de fermeture). */
export interface PointsBalance {
  eligible: boolean;
  available: number;
  pending: number;
  /** tout le solde expire à cette date sans nouvel achat */
  nextExpiry: string | null;
  /** programme désactivé par l'admin : plus aucun gain, points utilisables jusqu'à cette date (null : programme actif) */
  closesAt: string | null;
  /** factures encaissées : commandes livrées et leur montant total */
  ordersCount: number;
  ordersTotal: number;
  history: PointsMovement[];
}

export const POINTS_MOVEMENT_LABELS: Record<PointsMovementKind, string> = {
  earn: "Points gagnés",
  spend: "Points utilisés",
  refund: "Points restitués",
  reversal: "Points retirés (retour)",
  expiry: "Points expirés",
  referral: "Points de parrainage",
  referral_reversal: "Parrainage retiré (retour)",
};

/** Points de parrainage (et leur retrait) : liés à la commande d'un invité, sans son numéro. */
export const isReferral = (kind: PointsMovementKind) => kind === "referral" || kind === "referral_reversal";

export const pointsMovementLabel = (kind: string) => POINTS_MOVEMENT_LABELS[kind as PointsMovementKind] ?? "Mouvement de points";

const pointsFmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** « 0 point », « 1,5 point », « 12,25 points » (1 point = 1 $). */
export const formatPoints = (value: number) => `${pointsFmt.format(value)} point${Math.abs(value) >= 2 ? "s" : ""}`;

/** « 1,5 point de fidélité gagné », « 12 points de fidélité gagnés » (accord du participe : singulier sous 2). */
export const formatPointsEarned = (value: number) => `${formatPoints(value)} de fidélité gagné${Math.abs(value) >= 2 ? "s" : ""}`;

/** Quand les points gagnés deviennent utilisables : « 7 jours après la livraison », ou « dès la livraison » sans délai de retour. */
export const pointsReleaseDelay = (returnDays: number) =>
  returnDays > 0 ? `${returnDays} jour${returnDays > 1 ? "s" : ""} après la livraison` : "dès la livraison";

/** Les clients gagnent des points sur leurs achats, les revendeurs des points de parrainage. */
export const holdsPoints = (role: string | undefined) => role === "client" || role === "revendeur";
