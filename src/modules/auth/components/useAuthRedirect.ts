"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { ROUTES } from "@/config/routes";
import { useAuth } from "../hooks/useAuth";

/** `next` n'est accepté que s'il s'agit d'un chemin interne (anti open-redirect). */
const safe = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : null);

/** Redirection post-auth + redirection immédiate si déjà connecté. */
export function useAuthRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const { isAuthenticated, ready } = useAuth();
  const next = safe(params.get("next")) ?? ROUTES.home;

  const redirect = useCallback(() => router.replace(next), [router, next]);

  useEffect(() => {
    if (ready && isAuthenticated) router.replace(next);
  }, [ready, isAuthenticated, router, next]);

  return { next, redirect, searchSuffix: params.get("next") ? `?next=${encodeURIComponent(next)}` : "" };
}
