import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import type { SavedAddress, SavedAddressInput } from "../types";
import { toAddressPayload, toSavedAddress, type AddressDto } from "./account.mapper";

const byDefault = (a: SavedAddress, b: SavedAddress) => +b.isDefault - +a.isDefault || a.id - b.id;

/** Carnet d'adresses : `/me/addresses/`. */
export const addressBookService = {
  async list(): Promise<SavedAddress[]> {
    return (await api.get<AddressDto[]>(ENDPOINTS.addressBook.list)).map(toSavedAddress).sort(byDefault);
  },

  /** Création (POST, `isDefault` accepté) ou modification (PATCH, puis `set-default` si demandé). */
  async save(input: SavedAddressInput, id?: number): Promise<SavedAddress> {
    if (!id) return toSavedAddress(await api.post<AddressDto>(ENDPOINTS.addressBook.list, { ...toAddressPayload(input), isDefault: !!input.isDefault }));
    const saved = toSavedAddress(await api.patch<AddressDto>(ENDPOINTS.addressBook.detail(id), toAddressPayload(input)));
    return input.isDefault && !saved.isDefault ? addressBookService.setDefault(id) : saved;
  },

  async remove(id: number): Promise<void> {
    await api.delete(ENDPOINTS.addressBook.detail(id));
  },

  async setDefault(id: number): Promise<SavedAddress> {
    return toSavedAddress(await api.post<AddressDto>(ENDPOINTS.addressBook.setDefault(id)));
  },
};
