"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { addressBookService } from "../services/address-book.service";
import type { SavedAddressInput } from "../types";

export const addressKeys = { all: (uid?: number) => ["account", "addresses", uid] as const };

export function useAddresses() {
  const uid = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: addressKeys.all(uid), queryFn: addressBookService.list, enabled: !!uid });
}

export function useSaveAddress() {
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ input, id }: { input: SavedAddressInput; id?: number }) => addressBookService.save(input, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all(uid) }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id);
  return useMutation({ mutationFn: (id: number) => addressBookService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all(uid) }) });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id);
  return useMutation({ mutationFn: (id: number) => addressBookService.setDefault(id), onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all(uid) }) });
}
