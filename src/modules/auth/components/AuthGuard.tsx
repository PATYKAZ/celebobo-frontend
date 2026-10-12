"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { useHydrated } from "@/shared/hooks/useHydrated";
import { ContentPageSkeleton } from "@/shared/ui/PageSkeletons";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types";

interface Props {
  children: ReactNode;
  /** Rôles autorisés ; vide = tout utilisateur connecté. */
  roles?: UserRole[];
  /** Affiché pendant le contrôle de session : squelette de la page protégée. */
  fallback?: ReactNode;
}

/**
 * Protège une page (client). La sécurité réelle reste côté API (401/403) ;
 * ce garde ne fait que rediriger proprement l'UI.
 */
export function AuthGuard({ children, roles, fallback }: Props) {
  const { user, ready } = useAuth();
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = !!user && (!roles?.length || roles.includes(user.role));

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace(ROUTES.login(pathname));
    else if (!allowed) router.replace(ROUTES.home);
  }, [ready, user, allowed, router, pathname]);

  if (!hydrated || !ready || !allowed) {
    // squelette de la page plutôt qu'un spinner : la mise en page est déjà en place pendant le contrôle
    return fallback ?? <ContentPageSkeleton breadcrumb={false} />;
  }
  return <>{children}</>;
}
