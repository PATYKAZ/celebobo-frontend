import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse } from "@/shared/lib/api";
import { DB, userById } from "@/shared/mock-db";
import { invitedBy, resellerStats } from "@/shared/mock-db/selectors";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { EMPTY_ADDRESS, type Profile, type UpdateAddressesInput, type UpdatePersonalInput } from "../types";

/** Profil mock en mémoire (initialisé depuis l'utilisateur de session). */
let mockProfile: Profile | null = null;

function ensureMock(): Profile {
  const u = useAuthStore.getState().user;
  if (!mockProfile || mockProfile.userId !== u?.id) {
    const def = DB.addresses.find((a) => a.userId === u?.id && a.isDefault);
    mockProfile = {
      userId: u?.id ?? 0,
      firstName: u?.firstName ?? "",
      lastName: u?.lastName ?? "",
      email: u?.email ?? "",
      phoneNumber: u?.phoneNumber ?? null,
      avatar: u?.avatar ?? null,
      codeRevendeur: null,
      invitedCount: 0,
      invitedByCode: null,
      deliveryAddress: def ? { line1: def.line1, line2: def.quarter, country: def.country } : { ...EMPTY_ADDRESS },
      billingAddress: { ...EMPTY_ADDRESS },
      sameAsDelivery: true,
    };
  }
  return mockProfile;
}

/** Champs dérivés de la base de démo unique : jamais stockés dans le profil (cohérence avec l'admin). */
function withDerived(p: Profile): Profile {
  const db = userById(p.userId);
  const isReseller = db?.role === "revendeur";
  const inviter = db?.invitedBy ? userById(db.invitedBy) : undefined;
  return {
    ...p,
    codeRevendeur: isReseller ? (db?.codeRevendeur ?? null) : null,
    invitedCount: isReseller ? resellerStats(p.userId).invitedCount : invitedBy(p.userId).length,
    invitedByCode: inviter?.codeRevendeur ?? p.invitedByCode,
  };
}

const readFile = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Lecture du fichier impossible"));
    r.readAsDataURL(f);
  });

export const accountService = {
  get(): Promise<Profile> {
    if (env.USE_MOCKS) return mockResponse(() => withDerived(ensureMock()), 300);
    return api.get<Profile>(ENDPOINTS.profile.get);
  },

  async updatePersonal(input: UpdatePersonalInput): Promise<Profile> {
    if (env.USE_MOCKS) {
      if (input.revendeurCode && !/^\d{4}$/.test(input.revendeurCode)) {
        throw new ApiError(400, "Code invalide", { revendeurCode: ["Aucun revendeur trouvé avec le code que vous avez entré."] });
      }
      const p = ensureMock();
      if (input.avatar) p.avatar = await readFile(input.avatar);
      Object.assign(p, {
        firstName: input.firstName,
        lastName: input.lastName,
        phoneNumber: input.phoneNumber,
        invitedByCode: input.revendeurCode || p.invitedByCode,
      });
      return mockResponse(withDerived(p), 600);
    }
    const fd = new FormData();
    fd.append("first_name", input.firstName);
    fd.append("last_name", input.lastName);
    fd.append("phone_number", input.phoneNumber);
    if (input.revendeurCode) fd.append("revendeur_code", input.revendeurCode);
    if (input.avatar) fd.append("avatar", input.avatar);
    return api.patch<Profile>(ENDPOINTS.profile.update, fd);
  },

  async updateAddresses(input: UpdateAddressesInput): Promise<Profile> {
    if (env.USE_MOCKS) {
      const p = ensureMock();
      p.deliveryAddress = input.deliveryAddress;
      p.sameAsDelivery = input.sameAsDelivery;
      p.billingAddress = input.sameAsDelivery ? input.deliveryAddress : input.billingAddress;
      return mockResponse(withDerived(p), 500);
    }
    return api.put<Profile>(ENDPOINTS.profile.addresses, input);
  },
};
