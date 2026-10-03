import { ROLE_FROM_API, type ProfileDto } from "@/modules/auth/services/auth.mapper";
import type { UserRole } from "@/modules/auth/types";
import type { UserRow } from "../types";

/** Ligne utilisateur du back-office (après camelCase). */
export interface UserRowDto {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  avatar: string;
  role: ProfileDto["role"];
  referralCode: string | null;
  invitedBy: { id: number; name: string; referralCode: string | null } | null;
  isActive: boolean;
  emailVerified: boolean;
  dateJoined: string;
  lastLogin: string | null;
}

export const toUserRow = (dto: UserRowDto): UserRow => ({
  id: dto.id,
  name: dto.name,
  email: dto.email,
  phone: dto.phoneNumber,
  avatar: dto.avatar || null,
  role: ROLE_FROM_API[dto.role],
  active: dto.isActive,
  joinedAt: dto.dateJoined,
  invitedBy: dto.invitedBy ? { id: dto.invitedBy.id, name: dto.invitedBy.name } : null,
  codeRevendeur: dto.referralCode,
});

/** Compteurs par rôle de l'API (`client`, `reseller`…) → rôles du front + total. */
export function toRoleCounts(raw: Record<string, number> = {}): Record<UserRole | "all", number> {
  const counts = { all: 0, client: 0, revendeur: 0, mukubwa: 0, admin: 0 };
  for (const [role, n] of Object.entries(raw)) {
    const front = ROLE_FROM_API[role as ProfileDto["role"]];
    if (front) counts[front] += n;
    counts.all += n;
  }
  return counts;
}
