/**
 * Consentements de la politique de confidentialité (§3, §5 et §8) :
 *  - terms          : conditions générales de vente et traitement des données (obligatoire)
 *  - hosting_abroad : hébergement des données hors de RDC (obligatoire, art. 202)
 *  - marketing      : offres commerciales par SMS, WhatsApp ou e-mail (facultatif, jamais précoché)
 */
export type ConsentKind = "terms" | "hosting_abroad" | "marketing";
export type ConsentSource = "signup" | "checkout" | "account" | "google";

export const REQUIRED_CONSENTS: ConsentKind[] = ["terms", "hosting_abroad"];

/** État d'un consentement (`GET /me/consents/`). */
export interface ConsentStatus {
  kind: ConsentKind;
  label: string;
  required: boolean;
  given: boolean;
  /** Version de la politique acceptée en dernier (si le consentement est donné). */
  version: string | null;
  acceptedAt: string | null;
  source: ConsentSource | null;
  currentVersion: string;
  /** Donné sur une version précédente de la politique : à accepter de nouveau. */
  outdated: boolean;
}

export interface ConsentRecord {
  kind: ConsentKind;
  version: string;
  source: ConsentSource;
  acceptedAt: string;
  withdrawnAt: string | null;
}

export interface ConsentOverview {
  consents: ConsentStatus[];
  /** Consentements obligatoires manquants : le compte est bloqué tant qu'il en reste. */
  missing: ConsentKind[];
  history: ConsentRecord[];
}

export const CONSENT_SOURCE_LABELS: Record<ConsentSource, string> = {
  signup: "à l'inscription",
  checkout: "lors d'une commande",
  account: "depuis votre compte",
  google: "après l'inscription avec Google",
};
