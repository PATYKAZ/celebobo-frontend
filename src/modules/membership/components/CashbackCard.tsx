"use client";

import { WalletMoney } from "@/shared/ui/icons";
import { useFormatPrice } from "@/shared/currency/CurrencyProvider";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useSiteSettings } from "@/modules/site";
import { useCashbackBalance } from "../hooks/useCashback";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** « Cagnotte : x $ » (et ce qui attend la fin du délai de retour), seulement pour un client qui y a droit. */
export function CashbackCard() {
  const { user } = useAuth();
  const { cashback } = useSiteSettings().programmes;
  const { data } = useCashbackBalance(user?.role === "client" && cashback.enabled);
  const formatPrice = useFormatPrice();
  if (!data?.eligible) return null;
  return (
    <div className="flex items-center gap-3 rounded-box bg-primary-50 p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-white"><WalletMoney size={22} variant="Bold" /></span>
      <div className="min-w-0 text-[13px] leading-[19px]">
        <p className="text-[15px] font-bold">Cagnotte : {formatPrice(data.available)}</p>
        {data.pending > 0 && <p className="text-ink-2">{formatPrice(data.pending)} en attente (après le délai de retour)</p>}
        {data.available > 0 && data.nextExpiry && <p className="text-ink-3">Utilisable au paiement jusqu’au {dateFmt.format(new Date(data.nextExpiry))}</p>}
        {data.available === 0 && data.pending === 0 && <p className="text-ink-3">{cashback.percent} % de vos achats livrés y sont crédités.</p>}
      </div>
    </div>
  );
}
