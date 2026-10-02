"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { preferencesService, type PushState } from "../services/preferences.service";
import type { NotificationPreferences } from "../types";

export function useNotificationPreferences() {
  const uid = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: ["account", "notif-prefs", uid], queryFn: preferencesService.get, enabled: !!uid });
}

/** Sauvegarde optimiste : l'UI bascule immédiatement, annulation si le serveur refuse. */
export function useSavePreferences() {
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id);
  const key = ["account", "notif-prefs", uid];
  return useMutation({
    mutationFn: preferencesService.save,
    onMutate: async (next: NotificationPreferences) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<NotificationPreferences>(key);
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
  });
}

export function usePushPermission() {
  const [state, setState] = useState<PushState>("default");
  useEffect(() => setState(preferencesService.pushState()), []);
  const enable = async () => setState(await preferencesService.enablePush());
  return { state, enable };
}
