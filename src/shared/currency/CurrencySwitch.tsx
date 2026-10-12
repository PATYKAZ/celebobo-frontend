"use client";

import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { useCurrency } from "./CurrencyProvider";
import { CURRENCY_LABEL, type DisplayCurrency } from "./currency";

const OPTIONS: { value: DisplayCurrency; label: string }[] = [
  { value: "USD", label: CURRENCY_LABEL.USD },
  { value: "CDF", label: CURRENCY_LABEL.CDF },
];

/** Choix de la devise d'affichage des prix (USD ou francs congolais) ; les paiements restent en USD. */
export function CurrencySwitch({ size = "sm", fullWidth, className }: { size?: "sm" | "md"; fullWidth?: boolean; className?: string }) {
  const { currency, setCurrency } = useCurrency();
  return <SegmentedControl aria-label="Devise d'affichage des prix" size={size} fullWidth={fullWidth} className={className} value={currency} onChange={setCurrency} options={OPTIONS} />;
}
