"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/config/env";
import { ROUTES } from "@/config/routes";
import { setUnauthorizedHandler } from "@/shared/lib/api";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import type { LoginInput, RegisterInput, UserRole } from "../types";

/** État d'authentification + helpers de rôle. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  return {
    user,
    ready,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isManager: user?.role === "mukubwa" || user?.role === "admin",
    isReseller: user?.role === "revendeur",
    isStaff: !!user && user.role !== "client",
    hasRole: (...roles: UserRole[]) => !!user && roles.includes(user.role),
  };
}

/** À monter une seule fois (providers) : synchronise la session Django et gère les 401. */
export function useSessionSync() {
  const setUser = useAuthStore((s) => s.setUser);
  const setReady = useAuthStore((s) => s.setReady);

  useEffect(() => {
    setUnauthorizedHandler(() => useAuthStore.getState().setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const me = await authService.me();
      if (!env.USE_MOCKS) setUser(me);
      return me;
    },
    enabled: !env.USE_MOCKS,
    staleTime: 5 * 60_000,
    retry: false,
  });

  useEffect(() => {
    if (env.USE_MOCKS) setReady(true);
  }, [setReady]);
}

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: (user) => {
      setUser(user);
      qc.invalidateQueries();
    },
  });
}

export function useRegister() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
    onSuccess: (user) => setUser(user),
  });
}

export function useLogout() {
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      setUser(null);
      qc.clear();
      router.push(ROUTES.home);
    },
  });
}
