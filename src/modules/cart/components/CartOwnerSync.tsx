"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/shared/ui/Toast";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { cartKeys } from "../hooks/useCart";
import { cartService } from "../services/cart.service";
import { cartCount, useCartStore } from "../store/cart.store";
import type { Cart } from "../types";

/** Jeton en cours de fusion (évite un double appel en mode strict). */
let merging: string | null = null;

/** À la connexion, fusionne le panier invité (`X-Cart-Token`) dans le panier du compte via l'API. À monter une fois (providers). */
export function CartOwnerSync() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const ready = useAuthStore((s) => s.ready);
  const token = useCartStore((s) => s.token);

  useEffect(() => {
    if (!ready || !userId || !token || merging === token) return;
    merging = token;
    const guest = cartCount(qc.getQueryData<Cart>(cartKeys.owner("guest"))?.items ?? []);
    const key = cartKeys.owner(`u:${userId}`);
    cartService
      .merge(token)
      .then(async (cart) => {
        await qc.cancelQueries({ queryKey: key });
        qc.setQueryData(key, cart);
        if (guest > 0) toast.success("Panier fusionné", `${guest} article${guest > 1 ? "s" : ""} de votre panier invité ont été ajoutés à votre compte.`);
      })
      .catch(() => undefined)
      .finally(() => {
        qc.removeQueries({ queryKey: cartKeys.owner("guest") });
        useCartStore.getState().setToken(null);
        merging = null;
      });
  }, [ready, userId, token, qc]);

  return null;
}
