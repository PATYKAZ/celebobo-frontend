import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import type { AuditListParams, AuditResponse } from "../types";
import { toAuditEntry, type ChangeDto, type ObjectTypeDto } from "./audit.mapper";

const { audit } = ENDPOINTS.admin;

export const auditService = {
  objectTypes(): Promise<ObjectTypeDto[]> {
    return api.get<ObjectTypeDto[]>(audit.objectTypes);
  },

  async list(params: AuditListParams = {}): Promise<AuditResponse> {
    const [types, page] = await Promise.all([
      auditService.objectTypes(),
      api.page<ChangeDto>(audit.list, {
        params: {
          search: params.search || undefined,
          objectType: params.entity && params.entity !== "all" ? params.entity : undefined,
          actorId: params.actorId && params.actorId !== "all" ? params.actorId : undefined,
          dateFrom: params.from,
          dateTo: params.to,
          page: params.page,
          pageSize: params.pageSize,
        },
      }),
    ]);
    const labels = new Map(types.map((t) => [t.key, t.label]));
    const results = page.results.map((dto) => toAuditEntry(dto, labels));
    const actors = [...new Map(results.filter((e) => e.actor.id).map((e) => [e.actor.id, e.actor])).values()];
    return { ...page, results, actors };
  },
};
