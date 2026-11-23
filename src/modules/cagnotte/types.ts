import type { CampaignKind } from "@/modules/cart/types";

export type { CampaignKind };
export type Payout = "points" | "mobile_money";
export type RewardStatus = "credited" | "to_pay" | "paid" | "cancelled";

/** Opération Cagnotte (programme de fidélité) : en plus des points, une seule à la fois. */
export interface Campaign {
  id: number;
  name: string;
  /** conditions telles qu'annoncées sur le site */
  description: string;
  kind: CampaignKind;
  kindLabel: string;
  percent: string;
  startsAt: string;
  endsAt: string;
  minPurchase: string | null;
  cap: string | null;
  /** cashback seulement */
  payout: Payout | null;
  /** points Cagnotte valables ce nombre de jours (pas pour une remise) */
  pointsValidDays: number | null;
  categories: { id: number; name: string }[];
  products: { id: number; name: string }[];
  state: "upcoming" | "running" | "ended";
  createdAt: string;
}

/** Avantage Cagnotte d'une commande livrée (cashback ou points majorés). */
export interface Reward {
  id: number;
  campaignId: number;
  campaignName: string;
  kind: CampaignKind;
  payout: Payout;
  orderId: number;
  orderNumber: string;
  clientId: number;
  clientName: string;
  phone: string;
  amount: string;
  /** après les retours */
  kept: string;
  /** cashback déjà versé puis commande retournée : à déduire du remboursement */
  owedBack: string;
  status: RewardStatus;
  availableAt: string;
  paidAt: string | null;
  reference: string;
}

export type MyReward = Pick<Reward, "id" | "campaignName" | "kind" | "payout" | "orderNumber" | "amount" | "kept" | "status" | "availableAt" | "paidAt">;

export const KIND_LABELS: Record<CampaignKind, string> = {
  discount: "Remise immédiate",
  cashback: "Cashback",
  boosted_points: "Points majorés",
};

const pct = (value: string) => `${Number(value).toLocaleString("fr-FR")} %`;

/** « 10 % de remise immédiate », « 3 % de cashback (M-Pesa, Airtel Money) », « +3 % de points ». */
export function campaignHeadline(c: Pick<Campaign, "kind" | "percent" | "payout">): string {
  if (c.kind === "discount") return `${pct(c.percent)} de remise immédiate`;
  if (c.kind === "boosted_points") return `+${pct(c.percent)} de points Cagnotte`;
  return `${pct(c.percent)} de cashback ${c.payout === "mobile_money" ? "par Mobile Money" : "en points"}`;
}

/** Les conditions, une par ligne (produits, minimum, plafond, validité). */
export function campaignConditions(c: Campaign): string[] {
  const scope = [...c.categories.map((x) => x.name), ...c.products.map((x) => x.name)];
  const lines = [scope.length ? `Produits concernés : ${scope.join(", ")}` : "Sur tous les produits"];
  if (c.minPurchase) lines.push(`À partir de ${Number(c.minPurchase).toLocaleString("fr-FR")} $ d'achat sur ces produits`);
  if (c.cap) lines.push(`Jusqu'à ${Number(c.cap).toLocaleString("fr-FR")} $ par commande`);
  if (c.kind !== "discount") lines.push("Versé après la livraison et le délai d'essai, annulé ou réduit en cas de retour");
  if (c.pointsValidDays && (c.kind === "boosted_points" || c.payout === "points")) lines.push(`Points Cagnotte valables ${c.pointsValidDays} jours`);
  lines.push("En plus de vos points de fidélité (1 %), jamais à la place");
  return lines;
}
