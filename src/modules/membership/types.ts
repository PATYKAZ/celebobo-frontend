/** Celebobo Plus : abonnement qui offre la livraison sans minimum dans les zones membres. */
export type MembershipStatus = "none" | "trial" | "active" | "expired";
export type MembershipPlan = "trial" | "monthly" | "yearly";
export type PaidPlan = "monthly" | "yearly";
export type MembershipRequestStatus = "pending" | "confirmed" | "rejected" | "cancelled";

/** Demande d'abonnement payant : en attente jusqu'à ce que l'équipe confirme le paiement. */
export interface MembershipRequest {
  id: number;
  plan: PaidPlan;
  /** prix du jour de la demande (USD) */
  price: number;
  /** orange_money, airtel_money, mpesa, cash */
  paymentMethod: string;
  status: MembershipRequestStatus;
  /** motif d'un refus */
  note: string;
  createdAt: string;
  handledAt: string | null;
}

export interface MyMembership {
  status: MembershipStatus;
  plan: MembershipPlan | null;
  endsAt: string | null;
  trialAvailable: boolean;
  pendingRequest: MembershipRequest | null;
}

export const PLAN_LABEL: Record<MembershipPlan, string> = { trial: "Essai gratuit", monthly: "Mensuel", yearly: "Annuel" };

export const REQUEST_STATUS_LABEL: Record<MembershipRequestStatus, string> = {
  pending: "En attente de confirmation",
  confirmed: "Confirmée",
  rejected: "Refusée",
  cancelled: "Annulée",
};

/** Moyens de paiement acceptés pour l'abonnement (côté API). */
export const MEMBERSHIP_PAYMENT_METHODS = ["orange_money", "airtel_money", "mpesa", "cash"] as const;

/** Raisons de refus de l'essai (`trial_unavailable`, meta.reason). */
export type TrialRefusal = "email_unverified" | "phone_missing" | "trial_used" | "already_member" | "phone_used";
