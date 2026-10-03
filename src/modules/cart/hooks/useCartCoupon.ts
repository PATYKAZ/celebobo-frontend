"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService } from "../services/cart.service";
import type { Cart } from "../types";
import { cartKeys, currentCartOwner } from "./useCart";

/** Code promo du panier (validé par l'API : existence, minimum, usage unique, connexion requise…). */
export function useCartCoupon() {
  const qc = useQueryClient();
  const onSuccess = (cart: Cart) => qc.setQueryData(cartKeys.owner(currentCartOwner()), cart);
  const apply = useMutation({ mutationFn: (code: string) => cartService.applyCoupon(code.trim().toUpperCase()), onSuccess });
  const remove = useMutation({ mutationFn: () => cartService.removeCoupon(), onSuccess });
  return { apply, remove };
}
