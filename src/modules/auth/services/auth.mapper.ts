import type { ResellerAvailability, User, UserRole } from "../types";

/** Profil renvoyé par `GET /me/` (après camelCase). */
export interface ProfileDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  avatar: string;
  role: "client" | "reseller" | "manager" | "admin";
  emailVerified: boolean;
  dateJoined: string;
  invitedByCode: string | null;
  permissions: string[];
  reseller: { referralCode: string | null; availability: ResellerAvailability; commissionRate: string; invitedCount: number } | null;
}

export const ROLE_FROM_API: Record<ProfileDto["role"], UserRole> = {
  client: "client",
  reseller: "revendeur",
  manager: "mukubwa",
  admin: "admin",
};

export const ROLE_TO_API: Record<UserRole, ProfileDto["role"]> = {
  client: "client",
  revendeur: "reseller",
  mukubwa: "manager",
  admin: "admin",
};

export function toUser(dto: ProfileDto): User {
  return {
    id: dto.id,
    username: dto.email.split("@")[0],
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    role: ROLE_FROM_API[dto.role],
    avatar: dto.avatar || null,
    phoneNumber: dto.phoneNumber,
    codeRevendeur: dto.reseller?.referralCode ?? null,
    emailVerified: dto.emailVerified,
    permissions: dto.permissions,
    availability: dto.reseller?.availability,
  };
}
