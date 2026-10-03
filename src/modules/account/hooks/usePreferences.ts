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
    onSuccess: (saved) => qc.setQueryData(key, saved),
  });
}

const devicesKey = (uid?: number) => ["account", "devices", uid] as const;

export function usePushDevices() {
  const uid = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: devicesKey(uid), queryFn: preferencesService.devices, enabled: !!uid });
}

export function useRemoveDevice() {
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id) ?? 0;
  return useMutation({ mutationFn: (id: number) => preferencesService.removeDevice(id, uid), onSuccess: () => qc.invalidateQueries({ queryKey: devicesKey(uid) }) });
}

/** Permission du navigateur + appareil courant (mémorisé localement et encore présent côté API). */
export function usePushPermission() {
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id) ?? 0;
  const { data: devices } = usePushDevices();
  const [state, setState] = useState<PushState>("default");
  const [stored, setCurrentDevice] = useState<number | null>(null);
  useEffect(() => {
    setState(preferencesService.pushState());
    setCurrentDevice(preferencesService.currentDevice(uid));
  }, [uid]);
  const currentDevice = stored && devices?.some((d) => d.id === stored) ? stored : null;
  const enable = useMutation({
    mutationFn: () => preferencesService.enablePush(uid),
    onSuccess: (s) => {
      setState(s);
      setCurrentDevice(preferencesService.currentDevice(uid));
      qc.invalidateQueries({ queryKey: devicesKey(uid) });
    },
  });
  return { state, currentDevice, enable };
}
