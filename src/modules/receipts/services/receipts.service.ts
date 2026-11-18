import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import { money } from "@/modules/products/services/products.mapper";

interface VerificationDto {
  valid: boolean;
  orderNumber: string | null;
  deliveredAt: string | null;
  total: string | null;
}

/** Résultat de la vérification d'un reçu de livraison signé. */
export interface ReceiptVerification {
  valid: boolean;
  orderNumber: string | null;
  deliveredAt: string | null;
  total: number | null;
}

export const receiptsService = {
  /** Public : le reçu a-t-il bien été émis par Celebobo, et son contenu est-il intact ? */
  async verify(number: string, signature: string): Promise<ReceiptVerification> {
    const dto = await api.post<VerificationDto>(ENDPOINTS.receipts.verify, {
      number: number.trim().toUpperCase(),
      signature: signature.replace(/\s/g, "").toLowerCase(),
    });
    return { valid: dto.valid, orderNumber: dto.orderNumber, deliveredAt: dto.deliveredAt, total: dto.total == null ? null : money(dto.total) };
  },
};
