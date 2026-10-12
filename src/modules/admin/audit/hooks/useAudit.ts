"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditService } from "../services/audit.service";
import type { AuditListParams } from "../types";

const objectTypesQuery = { queryKey: ["admin", "audit", "object-types"], queryFn: auditService.objectTypes, staleTime: Infinity } as const;

export function useAuditLog(params: AuditListParams) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["admin", "audit", params],
    // libellés des types partagés avec le filtre : une seule requête par session
    queryFn: () => auditService.list(params, () => qc.ensureQueryData(objectTypesQuery)),
    placeholderData: keepPreviousData,
  });
}

/** Types d'éléments suivis (filtre). */
export function useAuditObjectTypes() {
  return useQuery(objectTypesQuery);
}
