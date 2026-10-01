import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, mockResponse, paginate } from "@/shared/lib/api";
import { MOCK_RESELLERS } from "../mocks/resellers";
import type { ResellerListParams, ResellersResponse } from "../types";

export const resellersService = {
  list(params: ResellerListParams = {}): Promise<ResellersResponse> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        let list = [...MOCK_RESELLERS];
        if (params.search) {
          const q = params.search.toLowerCase();
          list = list.filter((r) => `${r.name} ${r.email} ${r.codeRevendeur}`.toLowerCase().includes(q));
        }
        switch (params.ordering) {
          case "-invited": list.sort((a, b) => b.invitedCount - a.invitedCount); break;
          case "-sales": list.sort((a, b) => b.salesTotal - a.salesTotal); break;
          case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
          case "joined": list.sort((a, b) => +new Date(a.joinedAt) - +new Date(b.joinedAt)); break;
          default: list.sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt));
        }
        const top = [...MOCK_RESELLERS].sort((a, b) => b.salesTotal - a.salesTotal)[0];
        return {
          ...paginate(list, params.page ?? 1, params.pageSize ?? 8),
          stats: { total: MOCK_RESELLERS.length, invited: MOCK_RESELLERS.reduce((s, r) => s + r.invitedCount, 0), topName: top?.name ?? null, topSales: top?.salesTotal ?? 0 },
        };
      }, 400);
    }
    return api.get<ResellersResponse>(ENDPOINTS.admin.resellers.list, { params: params as never });
  },
};
