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
  /** Permissions accordées par l'API (informatives : l'UI s'appuie sur `permissions.ts`). */
  permissions?: string[];
  availability?: ResellerAvailability;
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

export const isStaff = (u?: Pick<User, "role"> | null) =>
  !!u && (u.role === "admin" || u.role === "mukubwa" || u.role === "revendeur");
