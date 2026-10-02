import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { can } from "@/modules/auth/permissions";
import type { UserRole } from "@/modules/auth/types";
import { api, ApiError, mockResponse, paginate } from "@/shared/lib/api";
import { DB, fullName, userById, type DbUser } from "@/shared/mock-db";
import { MOCK_RESELLERS_LITE } from "@/modules/orders/mocks/orders";
import { getActor, logAudit } from "@/shared/mock-db/selectors";
import { ROLE_LABEL } from "@/modules/auth/permissions";
import type { UserListParams, UserRow, UsersResponse } from "../types";

const toRow = (u: DbUser): UserRow => {
  const inv = u.invitedBy != null ? userById(u.invitedBy) : undefined;
  return {
    id: u.id,
    name: fullName(u),
    email: u.email,
    phone: u.phoneNumber,
    avatar: u.avatar,
    role: u.role,
    active: u.active,
    joinedAt: u.joinedAt,
    invitedBy: inv ? { id: inv.id, name: fullName(inv) } : null,
    codeRevendeur: u.codeRevendeur ?? null,
  };
};

function syncAssignable() {
  MOCK_RESELLERS_LITE.splice(0, MOCK_RESELLERS_LITE.length, ...DB.users.filter((u) => u.role === "revendeur" && u.active).map((u) => ({ id: u.id, name: fullName(u) })));
}

function guard() {
  const a = getActor();
  if (!can(a, "users.manage")) throw new ApiError(403, "Réservé aux administrateurs.");
  return a;
}

const uniqueCode = () => {
  const used = new Set(DB.users.map((u) => u.codeRevendeur).filter(Boolean));
  for (let i = 0; i < 1000; i++) {
    const c = String(1000 + Math.floor(Math.random() * 9000));
    if (!used.has(c)) return c;
  }
  return String(Date.now()).slice(-4);
};

export const usersService = {
  list(params: UserListParams = {}): Promise<UsersResponse> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        guard();
        let list = DB.users.map(toRow);
        const q = params.search?.toLowerCase();
        const counts = { all: DB.users.length, client: 0, revendeur: 0, mukubwa: 0, admin: 0 } as Record<UserRole | "all", number>;
        for (const u of DB.users) counts[u.role] += 1;
        if (q) list = list.filter((u) => `${u.name} ${u.email} ${u.codeRevendeur ?? ""} ${u.phone ?? ""}`.toLowerCase().includes(q));
        if (params.role && params.role !== "all") list = list.filter((u) => u.role === params.role);
        if (params.active && params.active !== "all") list = list.filter((u) => u.active === (params.active === "actif"));
        list.sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt));
        return { ...paginate(list, params.page ?? 1, params.pageSize ?? 10), counts };
      }, 350);
    }
    return api.get<UsersResponse>(ENDPOINTS.admin.users.list, { params: params as never });
  },

  async setRole(id: number, role: UserRole): Promise<UserRow> {
    if (env.USE_MOCKS) {
      const actor = guard();
      if (actor.id === id) throw new ApiError(400, "Vous ne pouvez pas modifier votre propre rôle.");
      const u = userById(id);
      if (!u) throw new ApiError(404, "Utilisateur introuvable");
      const from = u.role;
      u.role = role;
      if (role === "revendeur") {
        u.codeRevendeur ??= uniqueCode();
        u.availability ??= "offline";
        u.commissionRate ??= 0.07;
      }
      syncAssignable();
      logAudit({
        action: "Rôle modifié",
        entity: "utilisateur",
        entityId: id,
        summary: `${fullName(u)} : ${ROLE_LABEL[from]} → ${ROLE_LABEL[role]}`,
        diff: [{ field: "role", from, to: role }],
      });
      return mockResponse(toRow(u), 400);
    }
    return api.post<UserRow>(ENDPOINTS.admin.users.setRole(id), { role });
  },

  async setActive(id: number, active: boolean): Promise<UserRow> {
    if (env.USE_MOCKS) {
      const actor = guard();
      if (actor.id === id) throw new ApiError(400, "Vous ne pouvez pas désactiver votre propre compte.");
      const u = userById(id);
      if (!u) throw new ApiError(404, "Utilisateur introuvable");
      u.active = active;
      if (!active && u.availability) u.availability = "offline";
      syncAssignable();
      logAudit({ action: active ? "Compte activé" : "Compte désactivé", entity: "utilisateur", entityId: id, summary: `Compte de ${fullName(u)} ${active ? "activé" : "désactivé"}`, diff: [{ field: "active", from: String(!active), to: String(active) }] });
      return mockResponse(toRow(u), 300);
    }
    return api.patch<UserRow>(ENDPOINTS.admin.users.detail(id), { active });
  },
};
