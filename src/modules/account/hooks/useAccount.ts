"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/config/routes";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { accountService } from "../services/account.service";
import type { ChangePasswordInput, Profile, UpdatePersonalInput } from "../types";

export const accountKeys = { profile: ["account", "profile"] as const };

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: [...accountKeys.profile, userId], queryFn: accountService.get, enabled: !!userId });
}

/** Met à jour le cache du profil et l'utilisateur de session (en-tête, menus) puis resynchronise `/me/`. */
function useProfileMutation<T>(fn: (input: T) => Promise<Profile>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (p) => {
      qc.setQueryData([...accountKeys.profile, p.userId], p);
      useAuthStore.getState().patchUser({ firstName: p.firstName, lastName: p.lastName, phoneNumber: p.phoneNumber, avatar: p.avatar });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export const useUpdateProfile = () => useProfileMutation<UpdatePersonalInput>(accountService.updatePersonal);

export function useChangePassword() {
  return useMutation({ mutationFn: (input: ChangePasswordInput) => accountService.changePassword(input) });
}

/** Suppression du compte : la session est fermée côté API, on vide l'état local et on revient à l'accueil. */
export function useDeleteAccount() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: accountService.remove,
    onSuccess: () => {
      useAuthStore.getState().setUser(null);
      qc.clear();
      router.replace(ROUTES.home);
    },
  });
}
