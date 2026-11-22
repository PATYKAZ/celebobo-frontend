import type { ConsentKind } from "@/modules/consents/types";

/**
 * Rôles métier (groupes Django) :
 *  - client    : acheteur
 *  - revendeur : revendeur (traite les commandes assignées, a un code d'invitation)
 *  - mukubwa   : responsable (reçoit les nouvelles commandes, assigne aux revendeurs)
 *  - admin     : superuser (back-office /admin)
 */
export type UserRole = "client" | "revendeur" | "mukubwa" | "admin";

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar: string | null;
  phoneNumber: string | null;
  /** Code d'invitation du revendeur (4 chiffres). */
  codeRevendeur?: string | null;
  emailVerified?: boolean;
  /** Permissions accordées par l'API : seule source des droits affichés (`can()` dans `permissions.ts`). */
  permissions?: string[];
  availability?: ResellerAvailability;
  /** Consentements obligatoires à donner avant d'utiliser le compte (étape de complétion). */
  missingConsents?: ConsentKind[];
}

export type ResellerAvailability = "online" | "away" | "offline";

export interface LoginInput {
  /** adresse e-mail */
  login: string;
  password: string;
  remember?: boolean;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  passwordConfirm: string;
  /** Code du revendeur invitant (optionnel) */
  codeRevendeur?: string;
  /** Cases distinctes : CGV et données (obligatoire), hébergement hors RDC (obligatoire), offres (facultatif). */
  acceptTerms: boolean;
  acceptHostingAbroad: boolean;
  acceptMarketing: boolean;
}

/** Résultat d'inscription : l'API exige la vérification de l'e-mail avant la première connexion. */
export interface RegisterResult {
  email: string;
  verificationRequired: boolean;
}

export interface ResetPasswordInput {
  uid: string;
  token: string;
  password: string;
  passwordConfirm: string;
}

export const displayName = (u: Pick<User, "firstName" | "lastName" | "username">) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username;

/** Le compte doit passer par l'étape de complétion avant d'être utilisé. */
export const needsCompletion = (u?: Pick<User, "missingConsents"> | null) => !!u?.missingConsents?.length;

export const isStaff = (u?: Pick<User, "role"> | null) =>
  !!u && (u.role === "admin" || u.role === "mukubwa" || u.role === "revendeur");
