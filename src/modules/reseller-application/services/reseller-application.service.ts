import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import type { ResellerApplicationInput, ResellerApplicationReceipt } from "../types";

/** Réponse de `POST /reseller-applications/` (après camelCase). */
interface ApplicationReceiptDto {
  id: number;
  status: string;
  createdAt: string;
}

/** Erreurs de champ API → champs du formulaire. */
export const APPLICATION_FIELDS: Record<string, keyof ResellerApplicationInput> = { phoneNumber: "phone", message: "motivation" };

export const resellerApplicationService = {
  async submit(input: ResellerApplicationInput): Promise<ResellerApplicationReceipt> {
    const dto = await api.post<ApplicationReceiptDto>(ENDPOINTS.resellerApplication.submit, {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim(),
      phoneNumber: input.phone.trim(),
      city: input.city.trim(),
      message: input.motivation.trim(),
    });
    return { reference: `#${dto.id}`, status: dto.status, submittedAt: dto.createdAt };
  },
};
