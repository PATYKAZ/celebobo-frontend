"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { dataExportService } from "../services/data-export.service";
import type { DataExportStatus } from "../types";

const dataExportKey = (uid?: number) => ["account", "data-export", uid] as const;

const inProgress = (status?: DataExportStatus) => status?.job?.status === "pending" || status?.job?.status === "running";

/** Statut du dernier export ; interrogé toutes les 3 s tant que le fichier est en préparation. */
export function useDataExport() {
  const uid = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: dataExportKey(uid),
    queryFn: dataExportService.status,
    enabled: !!uid,
    refetchInterval: (query) => (inProgress(query.state.data) ? 3000 : false),
  });
}

export function useRequestDataExport() {
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: dataExportService.request,
    onSettled: () => qc.invalidateQueries({ queryKey: dataExportKey(uid) }),
  });
}
