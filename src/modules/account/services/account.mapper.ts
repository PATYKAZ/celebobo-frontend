import type { ProfileDto } from "@/modules/auth/services/auth.mapper";
import { ADDRESS_LABELS, EMPTY_ADDRESS, type AddressLabel, type Profile, type PushDevice, type SavedAddress, type SavedAddressInput } from "../types";

export function toProfile(dto: ProfileDto): Profile {
  return {
    userId: dto.id,
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    phoneNumber: dto.phoneNumber,
    avatar: dto.avatar || null,
    emailVerified: dto.emailVerified,
    dateJoined: dto.dateJoined,
    codeRevendeur: dto.reseller?.referralCode ?? null,
    invitedCount: dto.reseller?.invitedCount ?? 0,
    invitedByCode: dto.invitedByCode,
    deliveryAddress: { ...EMPTY_ADDRESS },
  };
}

/** `GET /me/addresses/` (après camelCase). */
export interface AddressDto {
  id: number;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  quarter: string;
  city: string;
  country: string;
  isDefault: boolean;
}

const LABEL_TO_API: Record<AddressLabel, string> = { Domicile: "home", Bureau: "office", Famille: "family", Autre: "other" };
const LABEL_FROM_API: Record<string, AddressLabel> = { home: "Domicile", office: "Bureau", family: "Famille", other: "Autre" };

export const toSavedAddress = (dto: AddressDto): SavedAddress => ({ ...dto, label: LABEL_FROM_API[dto.label] ?? "Autre" });

/** Corps de `POST/PATCH /me/addresses/` (libellé français → code API). */
export function toAddressPayload({ isDefault: _d, ...input }: SavedAddressInput) {
  const label = (ADDRESS_LABELS as readonly string[]).includes(input.label) ? LABEL_TO_API[input.label as AddressLabel] : "other";
  return { ...input, label };
}

/** `GET /me/devices/` (après camelCase). */
export type DeviceDto = PushDevice;

export const toDevice = (dto: DeviceDto): PushDevice => dto;
