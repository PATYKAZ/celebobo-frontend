import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse, paginate } from "@/shared/lib/api";
import { DB, fullName, resellers, userById, type DbUser } from "@/shared/mock-db";
import { logAudit, nextId, resellerStats, topReseller } from "@/shared/mock-db/selectors";
import { MOCK_RESELLERS_LITE } from "@/modules/orders/mocks/orders";
import { periodOf } from "../../dashboard/lib/stats";
import type { CreateResellerInput, InvitedClient, Reseller, ResellerListParams, ResellersResponse } from "../types";

type PeriodKey = NonNullable<ResellerListParams["period"]>;

/** Maintient la liste « assignables » (modules orders / messagerie) alignée sur les revendeurs actifs. */
function syncAssignable() {
  MOCK_RESELLERS_LITE.splice(0, MOCK_RESELLERS_LITE.length, ...resellers().filter((u) => u.active).map((u) => ({ id: u.id, name: fullName(u) })));
}

function toReseller(u: DbUser, periodKey: PeriodKey = "30d"): Reseller {
  const st = resellerStats(u.id, periodOf(periodKey));
  const invited: InvitedClient[] = st.invited.map((c) => ({
    id: c.id,
    name: fullName(c),
    email: c.email,
    joinedAt: c.joinedAt,
    ordersCount: DB.orders.filter((o) => o.user.id === c.id).length,
  }));
  return {
    id: u.id,
    name: fullName(u),
    email: u.email,
    phone: u.phoneNumber,
    avatar: u.avatar,
    codeRevendeur: u.codeRevendeur ?? "—",
    invitedCount: st.invitedCount,
    salesTotal: Math.round(st.salesRevenue),
    salesCount: st.salesCount,
    ordersAssigned: st.ordersAssigned,
    ordersOpen: st.ordersOpen,
    conversionRate: st.conversionRate,
    joinedAt: u.joinedAt,
    status: u.active ? "actif" : "inactif",
    availability: u.availability ?? "offline",
    commissionRate: u.commissionRate ?? 0.07,
    invited,
  };
}

const uniqueCode = () => {
  const used = new Set(DB.users.map((u) => u.codeRevendeur).filter(Boolean));
  for (let i = 0; i < 1000; i++) {
    const c = String(1000 + Math.floor(Math.random() * 9000));
    if (!used.has(c)) return c;
  }
  return String(Date.now()).slice(-4);
};

export const resellersService = {
  list(params: ResellerListParams = {}): Promise<ResellersResponse> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        const key = params.period ?? "30d";
        const all = resellers().map((u) => toReseller(u, key));
        let list = all;
        if (params.status && params.status !== "all") list = list.filter((r) => r.status === params.status);
        if (params.search) {
          const q = params.search.toLowerCase();
          list = list.filter((r) => `${r.name} ${r.email} ${r.codeRevendeur}`.toLowerCase().includes(q));
        }
        switch (params.ordering ?? "-sales") {
          case "-invited": list = [...list].sort((a, b) => b.invitedCount - a.invitedCount); break;
          case "-sales": list = [...list].sort((a, b) => b.salesTotal - a.salesTotal || a.id - b.id); break;
          case "name": list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
          case "joined": list = [...list].sort((a, b) => +new Date(a.joinedAt) - +new Date(b.joinedAt)); break;
          default: list = [...list].sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt));
        }
        const top = topReseller(periodOf(key));
        return {
          ...paginate(list, params.page ?? 1, params.pageSize ?? 8),
          periodLabel: periodOf(key).label,
          stats: {
            total: all.length,
            active: all.filter((r) => r.status === "actif").length,
            invited: all.reduce((s, r) => s + r.invitedCount, 0),
            topId: top?.id ?? null,
            topName: top?.name ?? null,
            topSales: Math.round(top?.revenue ?? 0),
          },
        };
      }, 350);
    }
    return api.get<ResellersResponse>(ENDPOINTS.admin.resellers.list, { params: params as never });
  },

  detail(id: number, period: PeriodKey = "30d"): Promise<Reseller> {
    if (env.USE_MOCKS) {
      const u = userById(id);
      if (!u || u.role !== "revendeur") return Promise.reject(new ApiError(404, "Revendeur introuvable"));
      return mockResponse(() => toReseller(u, period), 150);
    }
    return api.get<Reseller>(ENDPOINTS.admin.resellersAdmin.detail(id));
  },

  async create(input: CreateResellerInput): Promise<Reseller> {
    if (env.USE_MOCKS) {
      if (DB.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
        throw new ApiError(400, "E-mail déjà utilisé", { email: ["Cette adresse e-mail existe déjà."] });
      }
      const id = nextId("user");
      const u: DbUser = {
        id,
        username: input.email.split("@")[0],
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: "revendeur",
        avatar: null,
        phoneNumber: input.phone ?? null,
        joinedAt: new Date().toISOString(),
        active: true,
        invitedBy: null,
        codeRevendeur: uniqueCode(),
        availability: "offline",
        commissionRate: input.commissionRate ?? 0.07,
      };
      DB.users.push(u);
      syncAssignable();
      logAudit({ action: "Revendeur créé", entity: "revendeur", entityId: id, summary: `Nouveau revendeur : ${fullName(u)} (code ${u.codeRevendeur})` });
      return mockResponse(toReseller(u), 500);
    }
    return api.post<Reseller>(ENDPOINTS.admin.resellersAdmin.create, input);
  },

  async setActive(id: number, active: boolean): Promise<Reseller> {
    if (env.USE_MOCKS) {
      const u = userById(id);
      if (!u) throw new ApiError(404, "Revendeur introuvable");
      u.active = active;
      if (!active) u.availability = "offline";
      syncAssignable();
      logAudit({
        action: active ? "Revendeur activé" : "Revendeur désactivé",
        entity: "revendeur",
        entityId: id,
        summary: `Compte revendeur #${id} (${fullName(u)}) ${active ? "activé" : "désactivé"}`,
      });
      return mockResponse(toReseller(u), 350);
    }
    return api.post<Reseller>(ENDPOINTS.admin.resellersAdmin.setActive(id), { active });
  },

  async updateRate(id: number, rate: number): Promise<Reseller> {
    if (env.USE_MOCKS) {
      const u = userById(id);
      if (!u) throw new ApiError(404, "Revendeur introuvable");
      if (rate < 0 || rate > 0.5) throw new ApiError(400, "Taux invalide", { commissionRate: ["Entre 0 et 50 %."] });
      const from = u.commissionRate ?? 0.07;
      u.commissionRate = rate;
      logAudit({
        action: "Taux de commission modifié",
        entity: "revendeur",
        entityId: id,
        summary: `${fullName(u)} : taux de commission`,
        diff: [{ field: "commissionRate", from: `${(from * 100).toFixed(1)} %`, to: `${(rate * 100).toFixed(1)} %` }],
      });
      return mockResponse(toReseller(u), 300);
    }
    return api.patch<Reseller>(ENDPOINTS.admin.resellersAdmin.detail(id), { commissionRate: rate });
  },
};
