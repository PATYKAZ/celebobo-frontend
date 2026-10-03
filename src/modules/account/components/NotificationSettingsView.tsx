"use client";

import { Devices, Monitor, Mobile, Notification, NotificationBing, Sms, Trash } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { getErrorMessage } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useNotificationPreferences, usePushDevices, usePushPermission, useRemoveDevice, useSavePreferences } from "../hooks/usePreferences";
import { NOTIFICATION_EVENTS, type NotificationChannel, type NotificationEvent } from "../types";

/** Ligne à interrupteur : toute la ligne est cliquable (≥ 48px de haut). */
function ToggleRow({ label, checked, onChange, children }: { label: string; checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-md text-left active:bg-chip sm:min-h-0 sm:w-auto sm:justify-center sm:active:bg-transparent">
      <span className="text-[13px] font-medium text-ink-2 sm:hidden">{children}</span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors sm:h-6 sm:w-11 ${checked ? "bg-primary" : "bg-line"}`}>
        <span className={`absolute top-0.5 size-6 rounded-full bg-white transition-all sm:size-5 ${checked ? "left-[22px] sm:left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

const PUSH_COPY = {
  unsupported: { tone: "bg-chip text-ink-2", text: "Ce navigateur ne prend pas en charge les notifications push." },
  default: { tone: "bg-star/10 text-[#8a5a00]", text: "Les notifications push ne sont pas encore activées sur cet appareil." },
  granted: { tone: "bg-primary-50 text-primary-dark", text: "Notifications push activées sur cet appareil." },
  unsubscribed: { tone: "bg-star/10 text-[#8a5a00]", text: "Notifications autorisées, mais cet appareil n'est pas encore enregistré." },
  denied: { tone: "bg-danger-50 text-danger", text: "Les notifications sont bloquées : autorisez-les dans les réglages de votre navigateur." },
} as const;

/** Nom lisible d'un appareil à partir de son user-agent. */
function deviceName(ua: string) {
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Navigateur";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return { label: os ? `${browser} · ${os}` : browser, mobile: /Android|iPhone|iPad|Mobile/.test(ua) };
}

function DevicesList({ current }: { current: number | null }) {
  const { data: devices, isLoading } = usePushDevices();
  const remove = useRemoveDevice();
  if (isLoading) return <Skeleton className="mt-4 h-16 !rounded-box sm:mt-6" />;
  if (!devices?.length) return null;
  return (
    <div className="mt-4 rounded-box border border-line-3 sm:mt-6">
      <p className="flex items-center gap-2 border-b border-line-3 bg-page/50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-ink-3 sm:px-5"><Devices size={14} /> Appareils abonnés aux notifications push</p>
      <ul className="divide-y divide-line-3">
        {devices.map((d) => {
          const { label, mobile } = deviceName(d.userAgent);
          const Icon = mobile ? Mobile : Monitor;
          return (
            <li key={d.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-chip"><Icon size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[14px] font-bold">
                  {label}
                  {d.id === current && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-white">Cet appareil</span>}
                </p>
                <p className="text-[12px] text-ink-3">Ajouté le {formatDate(d.createdAt)}{d.lastUsedAt && ` · dernier envoi le ${formatDate(d.lastUsedAt)}`}</p>
              </div>
              <Button size="xs" variant="ghost" upper={false} className="text-danger hover:!bg-danger-100" leftIcon={<Trash size={13} />} loading={remove.isPending && remove.variables === d.id} onClick={() => remove.mutate(d.id, { onSuccess: () => toast.success("Appareil retiré"), onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)) })}>
                Retirer
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Content() {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const save = useSavePreferences();
  const push = usePushPermission();
  const pushCopy = PUSH_COPY[push.state === "granted" && !push.currentDevice ? "unsubscribed" : push.state];
  const enablePush = () => push.enable.mutate(undefined, { onSuccess: (s) => s === "granted" && toast.success("Notifications push activées"), onError: (e) => toast.error("Activation impossible", getErrorMessage(e)) });

  const toggle = (event: NotificationEvent, channel: NotificationChannel, value: boolean) => {
    if (!prefs) return;
    save.mutate({ ...prefs, [event]: { ...prefs[event], [channel]: value } }, { onSuccess: () => toast.success("Préférences enregistrées"), onError: (e) => toast.error("Enregistrement impossible", getErrorMessage(e)) });
  };

  return (
    <Reveal>
      <Block pad="none" className="p-4 sm:p-[30px]">
        <h1 className="text-[22px] leading-[28px] text-primary sm:text-h-page">Notifications & préférences</h1>
        <p className="mt-1 text-[13px] leading-[19px] text-ink-2 sm:text-[14px]">Choisissez comment être prévenu de l&apos;avancement de vos commandes et de vos messages.</p>

        <div className={`mt-4 flex flex-wrap items-center gap-3 rounded-box p-3.5 text-[13px] leading-[19px] sm:mt-6 sm:p-4 sm:text-[14px] ${pushCopy.tone}`}>
          <NotificationBing size={22} variant="Bold" />
          <span className="min-w-0 flex-1">{pushCopy.text}</span>
          {(push.state === "default" || (push.state === "granted" && !push.currentDevice)) && (
            <Button size="sm" loading={push.enable.isPending} onClick={enablePush} className="max-sm:w-full">
              Activer les notifications
            </Button>
          )}
        </div>
        <DevicesList current={push.currentDevice} />

        <div className="mt-4 overflow-hidden rounded-box border border-line-3 sm:mt-6">
          <div className="hidden grid-cols-[1fr_90px_90px] gap-4 border-b border-line-3 bg-page/50 px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-ink-3 sm:grid">
            <span>Événement</span>
            <span className="flex items-center justify-center gap-1"><Sms size={14} /> E-mail</span>
            <span className="flex items-center justify-center gap-1"><Notification size={14} /> Push</span>
          </div>
          {isLoading || !prefs
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="m-4 h-12 !rounded-box" />)
            : NOTIFICATION_EVENTS.map((e) => (
                <div key={e.key} className="grid items-center gap-1 border-b border-line-3 px-4 py-3.5 last:border-0 sm:grid-cols-[1fr_90px_90px] sm:gap-4 sm:px-5 sm:py-4">
                  <div className="pb-1 sm:pb-0">
                    <p className="text-[15px] font-bold">{e.label}</p>
                    <p className="text-[13px] leading-[18px] text-ink-3">{e.description}</p>
                  </div>
                  <ToggleRow label={`${e.label} par e-mail`} checked={prefs[e.key].email} onChange={(v) => toggle(e.key, "email", v)}>
                    <Sms size={15} className="mr-1.5 inline" /> Par e-mail
                  </ToggleRow>
                  <ToggleRow label={`${e.label} en push`} checked={prefs[e.key].push} onChange={(v) => toggle(e.key, "push", v)}>
                    <Notification size={15} className="mr-1.5 inline" /> Notification push
                  </ToggleRow>
                </div>
              ))}
        </div>
      </Block>
    </Reveal>
  );
}

export function NotificationSettingsView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Mon compte", href: ROUTES.profile }, { label: "Notifications" }]} />
      <AuthGuard>
        <Content />
      </AuthGuard>
    </>
  );
}
