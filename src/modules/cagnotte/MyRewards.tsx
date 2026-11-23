"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ENDPOINTS } from "@/config/endpoints";
import { ROUTES } from "@/config/routes";
import { api } from "@/shared/lib/api";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { KIND_LABELS, type MyReward } from "./types";

function statusText(r: MyReward): string {
  const pending = new Date(r.availableAt) > new Date();
  if (r.status === "cancelled") return "Annulé (commande retournée)";
  if (r.status === "paid") return `Versé le ${formatDate(r.paidAt!)}`;
  if (r.status === "to_pay") return pending ? `Versé par Mobile Money après le ${formatDate(r.availableAt)}` : "À verser par Mobile Money";
  return pending ? `En attente jusqu'au ${formatDate(r.availableAt)}` : "Ajouté à vos points";
}

/** Mes avantages Cagnotte (page « Mes points ») : rien tant qu'il n'y en a pas. */
export function MyRewards() {
  const { data } = useQuery({ queryKey: ["cagnotte", "mine"], queryFn: () => api.get<MyReward[]>(ENDPOINTS.cagnotte.mine) });
  if (!data?.length) return null;
  return (
    <Block pad="none" className="overflow-hidden">
      <h2 className="px-4 pt-4 text-[15px] font-bold sm:px-6">Mes avantages Cagnotte</h2>
      <ul className="divide-y divide-line-3">
        {data.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px] sm:px-6">
            <span className="min-w-0">
              <b>{KIND_LABELS[r.kind]} · {r.campaignName}</b>
              <span className="block text-ink-3">
                <Link href={ROUTES.orderDetail(r.orderNumber)} className="text-primary hover:underline">Commande {r.orderNumber}</Link> · {statusText(r)}
              </span>
            </span>
            <b className={r.status === "cancelled" ? "text-ink-3 line-through" : "text-primary"}>
              {r.payout === "points" ? `${Number(r.kept).toLocaleString("fr-FR")} pts` : formatPrice(Number(r.kept))}
            </b>
          </li>
        ))}
      </ul>
    </Block>
  );
}
