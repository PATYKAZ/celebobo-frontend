/** Réclamations (politique de garantie et de retour). */

export type ClaimKind = "defect" | "change_of_mind" | "counterfeit";
export type ClaimStatus = "submitted" | "answered" | "received" | "repairing" | "closed";
export type ClaimOutcome = "repair" | "exchange" | "refund" | "store_credit" | "not_covered";
export type ReturnMethod = "shop" | "reseller";

export const KIND_LABEL: Record<ClaimKind, string> = {
  defect: "Produit défectueux ou non conforme",
  change_of_mind: "Le produit ne me convient pas",
  counterfeit: "Produit contrefait",
};

export const KIND_HINT: Record<ClaimKind, string> = {
  defect: "Pendant les 7 jours d'essai ou le mois de garantie CeLE BoBO : réparation, échange ou remboursement.",
  change_of_mind: "Pendant les 7 jours d'essai, produit comme neuf : échange contre un autre produit ou avoir valable 6 mois. Les frais de retour sont à votre charge.",
  counterfeit: "Dans les 12 mois suivant l'achat : remboursement intégral, livraison comprise.",
};

export const STATUS_LABEL: Record<ClaimStatus, string> = {
  submitted: "Envoyée",
  answered: "Retour du produit",
  received: "Produit reçu",
  repairing: "En réparation",
  closed: "Terminée",
};

export const OUTCOME_LABEL: Record<ClaimOutcome, string> = {
  repair: "Réparation",
  exchange: "Échange",
  refund: "Remboursement",
  store_credit: "Avoir de 6 mois",
  not_covered: "Non couvert : produit rendu",
};

export const METHOD_LABEL: Record<ReturnMethod, string> = {
  shop: "Dépôt à la boutique, avenue Mwanga n° 21, Bukavu",
  reseller: "Reprise par le revendeur",
};

/** Ce qu'un article d'une commande peut encore réclamer, et jusqu'à quand. */
export interface ClaimableLine {
  orderId: number;
  itemId: number;
  name: string;
  serials: string[];
  kinds: ClaimKind[];
  trialUntil: string | null;
  warrantyUntil: string | null;
  authenticityUntil: string;
  openClaimId: number | null;
}

export interface Claim {
  id: number;
  number: string;
  orderId: number;
  orderNumber: string;
  itemId: number;
  productName: string;
  serial: string;
  clientId: number;
  clientName: string;
  kind: ClaimKind;
  kindLabel: string;
  protection: "trial" | "warranty" | "authenticity";
  description: string;
  photos: string[];
  status: ClaimStatus;
  createdAt: string;
  answerDue: string;
  returnMethod: ReturnMethod | null;
  answerNote: string;
  answeredAt: string | null;
  receivedAt: string | null;
  sealed: boolean | null;
  diagnosisDue: string | null;
  covered: boolean | null;
  outcome: ClaimOutcome | null;
  diagnosisNote: string;
  diagnosedAt: string | null;
  outcomeDue: string | null;
  newSerial: string;
  quote: string | null;
  exchangeWarrantyUntil: string | null;
  repairedAt: string | null;
  closedAt: string | null;
  overdue: boolean;
}

export interface NewClaim {
  orderId: number;
  itemId: number;
  kind: ClaimKind;
  description: string;
  serial: string;
  photos: string[];
}

export interface Diagnosis {
  covered: boolean;
  outcome: ClaimOutcome;
  note: string;
  newSerial: string;
  quote: string | null;
}

/** Solutions possibles selon le type et le diagnostic (mêmes règles que l'API). */
export function outcomesFor(kind: ClaimKind, covered: boolean): ClaimOutcome[] {
  if (!covered) return ["not_covered"];
  if (kind === "change_of_mind") return ["exchange", "store_credit"];
  if (kind === "counterfeit") return ["refund"];
  return ["repair", "exchange", "refund"];
}
