"use client";

import { CloseCircle, TicketDiscount } from "iconsax-reactjs";
import { useState, type FormEvent } from "react";
import { getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { useCartCoupon } from "../hooks/useCartCoupon";
import type { CartQuote } from "../types";

/** Saisie / retrait du code promo du panier ; les refus de l'API (inconnu, déjà utilisé, minimum…) s'affichent sous le champ. */
export function CouponForm({ quote }: { quote: CartQuote | null }) {
  const { apply, remove } = useCartCoupon();
  const [code, setCode] = useState("");
  const applied = quote?.couponCode;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    apply.mutate(code, {
      onSuccess: (cart) => {
        setCode("");
        if (cart.quote.couponCode) toast.success("Code promo appliqué", cart.quote.couponCode);
      },
    });
  };

  if (applied) {
    return (
      <div className="rounded-box border border-dashed border-primary bg-primary-50 px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-[13px]">
          <TicketDiscount size={18} variant="Bold" className="shrink-0 text-primary" />
          <span className="min-w-0 flex-1">Code <strong>{applied}</strong> appliqué</span>
          <button type="button" onClick={() => remove.mutate()} disabled={remove.isPending} aria-label="Retirer le code promo" className="grid size-9 place-items-center rounded-full text-ink-3 transition-colors hover:text-danger">
            <CloseCircle size={18} />
          </button>
        </div>
        {quote?.couponError && <p role="alert" className="mt-1 text-[12px] leading-[17px] text-danger">{quote.couponError}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex items-start gap-2">
      <Input
        aria-label="Code promo"
        placeholder="Code promo"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          apply.reset();
        }}
        error={apply.error ? getErrorMessage(apply.error) : undefined}
        leftIcon={<TicketDiscount size={17} />}
        autoCapitalize="characters"
        autoCorrect="off"
        wrapperClassName="min-w-0 flex-1"
      />
      <Button type="submit" variant="dark" loading={apply.isPending} disabled={!code.trim()} upper={false} className="shrink-0 sm:h-[48px]">Appliquer</Button>
    </form>
  );
}
