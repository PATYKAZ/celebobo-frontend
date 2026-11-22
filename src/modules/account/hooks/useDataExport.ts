"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { dataExportService } from "../services/data-export.service";
import type { DataExportStatus } from "../types";

const dataExportKey = (uid?: number) => ["account", "data-export", uid] as const;

const MINUTE = 60_000;
/** Au-delà, le serveur considère l'export comme perdu (échec) : on arrête d'interroger. */
const GIVE_UP_AFTER = 31 * MINUTE;

/**
 * Délai avant la prochaine interrogation tant que le fichier est en préparation, de plus en plus long
 * avec l'âge de la demande : 3 s la première minute, 10 s jusqu'à 5 min, puis 30 s ; plus rien après 31 min.
 */
function pollDelay(status?: DataExportStatus): number | false {
  const job = status?.job;
  if (job?.status !== "pending" && job?.status !== "running") return false;
  const age = Date.now() - new Date(job.createdAt).getTime();
  if (age < MINUTE) return 3000;
  if (age < 5 * MINUTE) return 10_000;
  return age < GIVE_UP_AFTER ? 30_000 : false;
}

/** Statut du dernier export ; interrogé tant que le fichier est en préparation (voir `pollDelay`). */
export function useDataExport() {
  const uid = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: dataExportKey(uid),
    queryFn: dataExportService.status,
    enabled: !!uid,
    refetchInterval: (query) => pollDelay(query.state.data),
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
