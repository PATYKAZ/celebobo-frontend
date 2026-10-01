"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { accountService } from "../services/account.service";
import type { Profile, UpdateAddressesInput, UpdatePersonalInput } from "../types";

export const accountKeys = { profile: ["account", "profile"] as const };

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: [...accountKeys.profile, userId], queryFn: accountService.get, enabled: !!userId });
}

function useProfileMutation<T>(fn: (input: T) => Promise<Profile>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (p) => {
      qc.setQueryData([...accountKeys.profile, p.userId], p);
      useAuthStore.getState().patchUser({
        firstName: p.firstName,
        lastName: p.lastName,
        phoneNumber: p.phoneNumber,
        avatar: p.avatar,
      });
    },
  });
}

export const useUpdateProfile = () => useProfileMutation<UpdatePersonalInput>(accountService.updatePersonal);
export const useUpdateAddresses = () => useProfileMutation<UpdateAddressesInput>(accountService.updateAddresses);
