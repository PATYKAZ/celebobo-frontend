"use client";

import { motion } from "motion/react";
import { Money, Mobile, TickCircle } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { PAYMENT_METHODS, type PaymentMethod } from "@/modules/orders/types";

const BRAND: Record<PaymentMethod, { chip: string; hint: string; icon: "mobile" | "cash" }> = {
  OrangeMoney: { chip: "bg-[#FF7900] text-white", hint: "Paiement mobile après confirmation du revendeur", icon: "mobile" },
  AirtelMoney: { chip: "bg-[#E40000] text-white", hint: "Paiement mobile après confirmation du revendeur", icon: "mobile" },
  "M-Pesa": { chip: "bg-[#2AAE4A] text-white", hint: "Paiement mobile après confirmation du revendeur", icon: "mobile" },
  Cash: { chip: "bg-ink-dark text-white", hint: "Vous payez à la réception de la commande", icon: "cash" },
};

interface Props {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
}

export function PaymentMethodCards({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Mode de paiement" className="grid gap-3 sm:grid-cols-2">
      {PAYMENT_METHODS.map((m) => {
        const selected = m.value === value;
        const b = BRAND[m.value];
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(m.value)}
            className={cn("relative flex items-center gap-3 rounded-box border-2 p-4 text-left transition-all duration-300", selected ? "border-primary bg-primary-50" : "border-line-3 bg-white hover:border-primary/50")}
          >
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", b.chip)}>
              {b.icon === "mobile" ? <Mobile size={20} variant="Bold" /> : <Money size={20} variant="Bold" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold leading-[20px]">{m.label}</span>
              <span className="block text-[12px] leading-[17px] text-ink-3">{b.hint}</span>
            </span>
            {selected && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} className="absolute right-3 top-3 text-primary">
                <TickCircle size={20} variant="Bold" />
              </motion.span>
            )}
          </button>
        );
      })}
    </div>
  );
}
