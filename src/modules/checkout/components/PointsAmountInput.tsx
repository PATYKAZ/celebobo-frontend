"use client";

import { WalletMoney } from "@/shared/ui/icons";
import { formatPoints } from "@/modules/points/types";
import { formatPrice } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Form";

/** Saisie libre (« 12,5 » ou « 12.5 ») → nombre de points, 0 si vide ou invalide. */
export const parsePoints = (value: string) => {
  const n = Number(value.replace(",", ".").trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n * 100) / 100 : 0;
};

interface Props {
  /** points utilisables sur cette commande (solde plafonné au prix des produits, renvoyé par le devis) */
  available: number;
  /** saisie du client */
  value: string;
  onChange: (value: string) => void;
  /** « avoir » (dollars, livraison comprise) plutôt que points de fidélité */
  credit?: boolean;
}

/**
 * « Utiliser mes points » : le client choisit combien de points il utilise (0 → `available`, 1 point = 1 $).
 * Le devis est recalculé après la saisie ; le montant appliqué vient de l'API.
 */
export function PointsAmountInput({ available, value, onChange, credit = false }: Props) {
  const amount = (n: number) => (credit ? formatPrice(n) : formatPoints(n));
  const wanted = parsePoints(value);
  const over = wanted > available;
  const active = wanted > 0;
  // à la sortie du champ : saisie ramenée entre 0 et le maximum, au centime
  const normalise = () => onChange(wanted === 0 ? "" : String(Math.min(wanted, available)));

  return (
    <div className={cn("rounded-box border-2 px-4 py-3 transition-colors", active ? "border-primary bg-primary-50" : "border-line-3")}>
      <p className="flex items-start gap-3 text-[14px] leading-[19px]">
        <WalletMoney size={22} variant="Bold" className="shrink-0 text-primary" aria-hidden />
        <span className="min-w-0">
          <span className="block font-semibold">{credit ? "Utiliser mon avoir" : "Utiliser mes points de fidélité"}</span>
          <span className="block text-[12px] text-ink-3">Jusqu’à {amount(available)} sur cette commande · {credit ? "livraison comprise" : "1 point = 1 $"}</span>
        </span>
      </p>
      <div className="mt-3 flex items-start gap-2">
        <Input
          aria-label={credit ? "Montant d'avoir à utiliser" : "Nombre de points à utiliser"}
          type="number"
          inputMode="decimal"
          min="0"
          max={available}
          step="0.01"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={normalise}
          error={over ? `Maximum ${amount(available)} sur cette commande.` : undefined}
          wrapperClassName="min-w-0 flex-1"
        />
        <Button type="button" variant="dark" upper={false} className="shrink-0 sm:h-[48px]" disabled={wanted === available} onClick={() => onChange(String(available))}>
          Tout utiliser
        </Button>
      </div>
      {active && (
        <button type="button" onClick={() => onChange("")} className="mt-1 flex min-h-9 items-center text-[13px] font-semibold text-primary hover:underline">
          {credit ? "Ne pas utiliser d'avoir" : "Ne pas utiliser de points"}
        </button>
      )}
    </div>
  );
}
