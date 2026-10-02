"use client";

import { useEffect } from "react";
import { toast } from "@/shared/ui/Toast";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useCartStore, type CartOwner } from "../store/cart.store";

/** Lie le panier à l'utilisateur connecté et fusionne le panier anonyme à la connexion. À monter une fois (providers). */
export function CartOwnerSync() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const ready = useAuthStore((s) => s.ready);

  useEffect(() => {
    if (!ready) return;
    const owner: CartOwner = userId ? `u:${userId}` : "guest";
    const merged = useCartStore.getState().switchOwner(owner);
    if (merged > 0) toast.success("Panier fusionné", `${merged} article${merged > 1 ? "s" : ""} de votre panier invité ont été ajoutés à votre compte.`);
  }, [userId, ready]);

  return null;
}
