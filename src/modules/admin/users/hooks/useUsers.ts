"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "@/modules/auth/types";
import { usersService } from "../services/users.service";
import type { UserListParams } from "../types";

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
