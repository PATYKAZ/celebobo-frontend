"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { needsCompletion } from "@/modules/auth/types";

/**
 * Pages accessibles tant que le compte n'est pas complété : l'étape elle-même, les politiques (pour lire ce
 * qu'on accepte), « Mes données » (le droit d'accès n'attend pas : on peut emporter ses données avant de
 * fermer son compte) et les pages de session. L'API refuse le reste (`account_incomplete`).
 */
const OPEN_PATHS = [
  ROUTES.completeAccount(),
  "/pages/",
  ROUTES.myData,
  ROUTES.login(),
  ROUTES.register,
  ROUTES.googleCallback,
  "/verifier-email",
  ROUTES.resetPassword,
  ROUTES.newsletterUnsubscribe,
];

const isOpen = (pathname: string) => OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`));

/** À monter une fois (providers) : renvoie vers l'étape de complétion un compte à qui il manque des consentements. */
export function AccountCompletionGate() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const blocked = ready && needsCompletion(user) && !isOpen(pathname);

  useEffect(() => {
    if (blocked) router.replace(ROUTES.completeAccount(pathname));
  }, [blocked, router, pathname]);

  return null;
}
