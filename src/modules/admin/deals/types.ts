/** Statut calculé par l'API : en cours, programmée, terminée (date passée ou quantité écoulée). */
export type DealStatus = "live" | "scheduled" | "ended";

/** Offre du jour (`/bo/deals/`). */
export interface AdminDeal {
  id: number;
  product: { id: number; slug: string; name: string; image: string };
  variantId: number | null;
  variantLabel: string;
  dealPrice: number;
  regularPrice: number;
  startsAt: string;
  endsAt: string;
  /** null = sans limite de quantité */
  quantity: number | null;
  sold: number;
  giftLabel: string;
  isActive: boolean;
  status: DealStatus;
}

export interface DealFormValues {
  productId: number | null;
  variantId: number | null;
  dealPrice: string;
  /** `yyyy-mm-ddThh:mm` (champ datetime-local) */
  startsAt: string;
  endsAt: string;
  /** vide = sans limite */
  quantity: string;
  giftLabel: string;
  isActive: boolean;
}
