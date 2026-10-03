import { money } from "@/modules/products/services/products.mapper";
import type { ResellerAvailability } from "@/modules/auth/types";
import type { InvitedClient, Reseller } from "../types";

/** Revendeur du back-office (après camelCase) ; `performance` = cumul depuis l'inscription. */
export interface ResellerDto {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  avatar: string;
  referralCode: string | null;
  commissionRate: string;
  availability: ResellerAvailability;
  isActive: boolean;
  dateJoined: string;
  invitedCount: number;
  performance: { salesCount: number; revenue: string; commissionEarned: string; commissionDue: string };
}

export interface InviteeDto {
  id: number;
  name: string;
  email: string;
  joinedAt: string;
  ordersCount: number;
  ordersTotal: string;
}

/** Ventes d'un vendeur sur une période (`/bo/analytics/sellers/`). */
export interface SellerSalesDto {
  sellerId: number;
  revenue: string;
  salesCount: number;
}

export const toInvitedClient = (dto: InviteeDto): InvitedClient => ({ id: dto.id, name: dto.name, email: dto.email, joinedAt: dto.joinedAt, ordersCount: dto.ordersCount });

export function toReseller(dto: ResellerDto, period?: SellerSalesDto | null, extra: Partial<Reseller> = {}): Reseller {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phoneNumber,
    avatar: dto.avatar || null,
    codeRevendeur: dto.referralCode ?? "—",
    invitedCount: dto.invitedCount,
    salesTotal: period ? money(period.revenue) : 0,
    salesCount: period?.salesCount ?? 0,
    ordersAssigned: 0,
    ordersOpen: 0,
    conversionRate: 0,
    joinedAt: dto.dateJoined,
    status: dto.isActive ? "actif" : "inactif",
    availability: dto.availability,
    commissionRate: Number(dto.commissionRate),
    invited: [],
    ...extra,
  };
}
