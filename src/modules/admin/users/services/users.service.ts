import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import { ROLE_TO_API } from "@/modules/auth/services/auth.mapper";
import type { UserRole } from "@/modules/auth/types";
import type { UserListParams, UserRow, UsersResponse } from "../types";
import { toRoleCounts, toUserRow, type UserRowDto } from "./users.mapper";

const { users } = ENDPOINTS.admin;

export const usersService = {
  async list(params: UserListParams = {}): Promise<UsersResponse> {
    const page = await api.page<UserRowDto, UserRow>(
      users.list,
      {
        params: {
          search: params.search || undefined,
          role: params.role && params.role !== "all" ? ROLE_TO_API[params.role] : undefined,
          active: params.active && params.active !== "all" ? params.active === "actif" : undefined,
          page: params.page,
          pageSize: params.pageSize,
        },
      },
      toUserRow,
    );
    return { ...page, counts: toRoleCounts(page.meta?.counts as Record<string, number> | undefined) };
  },

  async setRole(id: number, role: UserRole): Promise<UserRow> {
    await api.post(users.role(id), { role: ROLE_TO_API[role] });
    return toUserRow(await api.get<UserRowDto>(users.detail(id)));
  },

  async setActive(id: number, active: boolean): Promise<UserRow> {
    return toUserRow(await api.post<UserRowDto>(active ? users.activate(id) : users.deactivate(id)));
  },
};
