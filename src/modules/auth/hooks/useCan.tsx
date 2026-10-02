"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { toast } from "@/shared/ui/Toast";
import { can, type Permission } from "../permissions";
import { useAuthStore } from "../store/auth.store";

/** `const canAssign = useCan("orders.assign")` */
export function useCan(permission: Permission): boolean {
  const user = useAuthStore((s) => s.user);
  return can(user, permission);
}

/** Masque son contenu si l'utilisateur n'a pas la permission : `<Can permission="orders.assign">…</Can>` */
export function Can({ permission, children, fallback = null }: { permission: Permission; children: ReactNode; fallback?: ReactNode }) {
  return useCan(permission) ? <>{children}</> : <>{fallback}</>;
}

/** Garde de page back-office : redirige vers le tableau de bord avec un message si la permission manque. */
export function PermissionGuard({ permission, children }: { permission: Permission; children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const allowed = can(user, permission);

  useEffect(() => {
    if (ready && user && !allowed) {
      toast.error("Accès refusé", "Votre rôle ne permet pas d'ouvrir cette page.");
      router.replace(ROUTES.admin.root);
    }
  }, [ready, user, allowed, router]);

  return allowed ? <>{children}</> : null;
}
