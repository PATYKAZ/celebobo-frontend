"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/config/routes";
import { setUnauthorizedHandler } from "@/shared/lib/api";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import type { LoginInput, RegisterInput, ResetPasswordInput, UserRole } from "../types";

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

/** À monter une seule fois (providers) : synchronise la session (cookies JWT) et gère les 401. */
export function useSessionSync() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    setUnauthorizedHandler(() => useAuthStore.getState().setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const me = await authService.me();
      setUser(me);
      return me;
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
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

export function useGoogleLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => authService.loginWithGoogle(code),
    onSuccess: (user) => {
      setUser(user);
      qc.invalidateQueries();
    },
  });
}

export function useRegister() {
  return useMutation({ mutationFn: (input: RegisterInput) => authService.register(input) });
}

export function useResendVerification() {
  return useMutation({ mutationFn: (email: string) => authService.resendVerification(email) });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: (key: string) => authService.verifyEmail(key) });
}

export function useResetPassword() {
  return useMutation({ mutationFn: (input: ResetPasswordInput) => authService.resetPassword(input) });
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
