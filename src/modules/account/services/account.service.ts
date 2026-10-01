import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse } from "@/shared/lib/api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { EMPTY_ADDRESS, type Profile, type UpdateAddressesInput, type UpdatePersonalInput } from "../types";

/** Profil mock en mémoire (initialisé depuis l'utilisateur de session). */
let mockProfile: Profile | null = null;

function ensureMock(): Profile {
  const u = useAuthStore.getState().user;
  if (!mockProfile || mockProfile.userId !== u?.id) {
    mockProfile = {
      userId: u?.id ?? 0,
      firstName: u?.firstName ?? "",
      lastName: u?.lastName ?? "",
      email: u?.email ?? "",
      phoneNumber: u?.phoneNumber ?? null,
      avatar: u?.avatar ?? null,
      codeRevendeur: u?.codeRevendeur ?? null,
      invitedCount: u?.role === "revendeur" ? 14 : 0,
      invitedByCode: null,
      deliveryAddress: { line1: "Av. Kasa-Vubu 120", line2: "Gombe", country: "RD Congo" },
      billingAddress: { ...EMPTY_ADDRESS },
      sameAsDelivery: true,
    };
  }
  return mockProfile;
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
    if (env.USE_MOCKS) return mockResponse(() => ensureMock(), 300);
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
      return mockResponse({ ...p }, 600);
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
      return mockResponse({ ...p }, 500);
    }
    return api.put<Profile>(ENDPOINTS.profile.addresses, input);
  },
};
