"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "@/modules/auth/types";
import { usersService } from "../services/users.service";
import type { UserFormValues, UserListParams } from "../types";

export function useUsers(params: UserListParams) {
  return useQuery({ queryKey: ["admin", "users", params], queryFn: () => usersService.list(params), placeholderData: keepPreviousData });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, role }: { id: number; role: UserRole }) => usersService.setRole(id, role), onSuccess: () => qc.invalidateQueries() });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, active }: { id: number; active: boolean }) => usersService.setActive(id, active), onSuccess: () => qc.invalidateQueries() });
}

export function useSaveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number | null; values: UserFormValues }) => (id == null ? usersService.create(values) : usersService.update(id, values)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useSendPasswordReset() {
  return useMutation({ mutationFn: (id: number) => usersService.sendPasswordReset(id) });
}

/** Présence des comptes affichés, rafraîchie toutes les 30 s. */
export function useOnline(ids: number[]) {
  return useQuery({ queryKey: ["admin", "presence", ids], queryFn: () => usersService.online(ids), enabled: ids.length > 0, refetchInterval: 30_000 });
}
