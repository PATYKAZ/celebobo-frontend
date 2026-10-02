import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse } from "@/shared/lib/api";
import { DB, type DbAddress } from "@/shared/mock-db";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import type { SavedAddress, SavedAddressInput } from "../types";

const uid = () => useAuthStore.getState().user?.id ?? 0;
const toSaved = ({ userId: _u, ...a }: DbAddress): SavedAddress => a;
const mine = () => DB.addresses.filter((a) => a.userId === uid());

/** Carnet d'adresses : base de démo (`DB.addresses`) en mock, `ENDPOINTS.addressBook` en API. */
export const addressBookService = {
  list(): Promise<SavedAddress[]> {
    if (env.USE_MOCKS) return mockResponse(() => mine().map(toSaved).sort((a, b) => +b.isDefault - +a.isDefault || a.id - b.id), 250);
    return api.get<SavedAddress[]>(ENDPOINTS.addressBook.list);
  },

  async save(input: SavedAddressInput, id?: number): Promise<SavedAddress> {
    if (env.USE_MOCKS) {
      const errors: Record<string, string[]> = {};
      if (!input.line1.trim()) errors.line1 = ["L'adresse est requise."];
      if (!input.quarter.trim()) errors.quarter = ["Le quartier / la commune est requis."];
      if (!/^[+\d][\d\s().-]{7,}$/.test(input.phone.trim())) errors.phone = ["Numéro de téléphone invalide."];
      if (Object.keys(errors).length) throw new ApiError(400, "Adresse invalide", errors);

      const list = mine();
      let entry = id ? list.find((a) => a.id === id) : undefined;
      if (id && !entry) throw new ApiError(404, "Adresse introuvable");
      const makeDefault = input.isDefault || list.length === 0;
      if (makeDefault) list.forEach((a) => (a.isDefault = false));
      if (entry) Object.assign(entry, input, { isDefault: makeDefault || entry.isDefault });
      else DB.addresses.push((entry = { ...input, id: DB.seq.address++, userId: uid(), isDefault: makeDefault }));
      return mockResponse(toSaved(entry), 350);
    }
    return id ? api.put<SavedAddress>(ENDPOINTS.addressBook.detail(id), input) : api.post<SavedAddress>(ENDPOINTS.addressBook.list, input);
  },

  async remove(id: number): Promise<void> {
    if (env.USE_MOCKS) {
      const i = DB.addresses.findIndex((a) => a.id === id && a.userId === uid());
      if (i < 0) throw new ApiError(404, "Adresse introuvable");
      const [removed] = DB.addresses.splice(i, 1);
      // si on supprime la par défaut, la première restante le devient
      if (removed.isDefault) {
        const next = mine()[0];
        if (next) next.isDefault = true;
      }
      return mockResponse(undefined, 250);
    }
    await api.delete(ENDPOINTS.addressBook.detail(id));
  },

  setDefault(id: number): Promise<SavedAddress> {
    return addressBookService.save({ ...(mine().find((a) => a.id === id) as SavedAddressInput), isDefault: true }, id);
  },
};
