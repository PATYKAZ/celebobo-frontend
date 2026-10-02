import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { can } from "@/modules/auth/permissions";
import { api, ApiError, mockResponse, paginate } from "@/shared/lib/api";
import { DB } from "@/shared/mock-db";
import { getActor } from "@/shared/mock-db/selectors";
import type { AuditListParams, AuditResponse } from "../types";

export const auditService = {
  list(params: AuditListParams = {}): Promise<AuditResponse> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        if (!can(getActor(), "audit.view")) throw new ApiError(403, "Réservé aux administrateurs.");
        let list = [...DB.auditLog];
        const actors = [...new Map(list.map((e) => [e.actor.id, e.actor])).values()];
        if (params.entity && params.entity !== "all") list = list.filter((e) => e.entity === params.entity);
        if (params.actorId && params.actorId !== "all") list = list.filter((e) => e.actor.id === params.actorId);
        if (params.from) list = list.filter((e) => +new Date(e.at) >= +new Date(`${params.from}T00:00:00`));
        if (params.to) list = list.filter((e) => +new Date(e.at) <= +new Date(`${params.to}T23:59:59`));
        if (params.search) {
          const q = params.search.toLowerCase();
          list = list.filter((e) => `${e.action} ${e.summary} ${e.actor.name} ${e.entityId ?? ""}`.toLowerCase().includes(q));
        }
        list.sort((a, b) => +new Date(b.at) - +new Date(a.at));
        return { ...paginate(list, params.page ?? 1, params.pageSize ?? 12), actors };
      }, 300);
    }
    return api.get<AuditResponse>(ENDPOINTS.admin.audit.list, { params: params as never });
  },
};
