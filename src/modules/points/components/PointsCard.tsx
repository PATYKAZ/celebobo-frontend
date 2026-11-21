"use client";

import Link from "next/link";
import { ArrowRight2, WalletMoney } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { formatDate } from "@/shared/lib/format";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useSiteSettings } from "@/modules/site";
import { usePointsBalance } from "../hooks/usePoints";
import { formatPoints } from "../types";

/** « Mes points : x points » (et ce qui attend la fin du délai de retour), lien vers la page « Mes points » ; seulement pour un client qui peut utiliser ses points (programme actif ou en cours de fermeture). */
export function PointsCard() {
  const { user } = useAuth();
  const { points } = useSiteSettings().programmes;
  const { data } = usePointsBalance(user?.role === "client");
  if (!data?.eligible) return null;
  return (
    <Link href={ROUTES.points} className="group flex items-center gap-3 rounded-box bg-primary-50 p-4 transition-colors hover:bg-primary-100 active:scale-[0.99]">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-white"><WalletMoney size={22} variant="Bold" /></span>
      <div className="min-w-0 flex-1 text-[13px] leading-[19px]">
        <p className="text-[15px] font-bold">Mes points : {formatPoints(data.available)}</p>
        {data.pending > 0 && <p className="text-ink-2">{formatPoints(data.pending)} en attente (après le délai de retour)</p>}
        {data.closesAt && <p className="text-warn">Utilisables jusqu’au {formatDate(data.closesAt)}</p>}
        {!data.closesAt && data.available === 0 && data.pending === 0 && <p className="text-ink-3">{points.percent.toLocaleString("fr-FR")} % de vos achats livrés en points de fidélité.</p>}
      </div>
      <ArrowRight2 size={14} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
