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
  /** Code d'invitation du revendeur (Profile.codeRevendeur). */
  codeRevendeur?: string | null;
}

export interface LoginInput {
  /** email ou nom d'utilisateur */
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

export const displayName = (u: Pick<User, "firstName" | "lastName" | "username">) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username;

export const isStaff = (u?: Pick<User, "role"> | null) =>
  !!u && (u.role === "admin" || u.role === "mukubwa" || u.role === "revendeur");
