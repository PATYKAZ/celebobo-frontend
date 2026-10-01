"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { Spinner } from "@/shared/ui/Spinner";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types";

interface Props {
  children: ReactNode;
  /** Rôles autorisés ; vide = tout utilisateur connecté. */
  roles?: UserRole[];
  fallback?: ReactNode;
}

/**
 * Protège une page (client). La sécurité réelle reste côté API (401/403) ;
 * ce garde ne fait que rediriger proprement l'UI.
 */
export function AuthGuard({ children, roles, fallback }: Props) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = !!user && (!roles?.length || roles.includes(user.role));

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace(ROUTES.login(pathname));
    else if (!allowed) router.replace(ROUTES.home);
  }, [ready, user, allowed, router, pathname]);

  if (!ready || !allowed) {
    return (
      fallback ?? (
        <div className="grid min-h-[320px] place-items-center">
          <Spinner size={28} />
        </div>
      )
    );
  }
  return <>{children}</>;
}
