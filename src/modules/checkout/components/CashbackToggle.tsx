"use client";

import { WalletMoney } from "@/shared/ui/icons";
import { useFormatPrice } from "@/shared/currency/CurrencyProvider";
import { cn } from "@/shared/lib/cn";

/** « Utiliser ma cagnotte » : proposé quand le devis renvoie une cagnotte utilisable ; le montant appliqué vient de l'API. */
export function CashbackToggle({ available, checked, onChange }: { available: number; checked: boolean; onChange: (v: boolean) => void }) {
  const formatPrice = useFormatPrice();
  return (
    <label className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-box border-2 px-4 py-3 transition-colors", checked ? "border-primary bg-primary-50" : "border-line-3 hover:border-primary/40")}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 shrink-0 accent-[var(--color-primary)]" />
      <WalletMoney size={22} variant="Bold" className="shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 text-[14px] leading-[19px]">
        <span className="block font-semibold">Utiliser ma cagnotte ({formatPrice(available)})</span>
        <span className="block text-[12px] text-ink-3">Déduite du total de cette commande.</span>
      </span>
    </label>
  );
}
