"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { auditService } from "../services/audit.service";
import type { AuditListParams } from "../types";

export function useAuditLog(params: AuditListParams) {
  return useQuery({ queryKey: ["admin", "audit", params], queryFn: () => auditService.list(params), placeholderData: keepPreviousData });
}
