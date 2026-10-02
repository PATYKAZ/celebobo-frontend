"use client";

import { Notification, NotificationBing, Sms } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Switch } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useNotificationPreferences, usePushPermission, useSavePreferences } from "../hooks/usePreferences";
import { NOTIFICATION_EVENTS, type NotificationChannel, type NotificationEvent } from "../types";

const PUSH_COPY = {
  unsupported: { tone: "bg-chip text-ink-2", text: "Ce navigateur ne prend pas en charge les notifications push." },
  default: { tone: "bg-star/10 text-[#8a5a00]", text: "Les notifications push ne sont pas encore activées sur cet appareil." },
  granted: { tone: "bg-primary-50 text-primary-dark", text: "Notifications push activées sur cet appareil." },
  denied: { tone: "bg-danger-50 text-danger", text: "Les notifications sont bloquées : autorisez-les dans les réglages de votre navigateur." },
} as const;

function Content() {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const save = useSavePreferences();
  const push = usePushPermission();

  const toggle = (event: NotificationEvent, channel: NotificationChannel, value: boolean) => {
    if (!prefs) return;
    save.mutate({ ...prefs, [event]: { ...prefs[event], [channel]: value } }, { onSuccess: () => toast.success("Préférences enregistrées") });
  };

  return (
    <Reveal>
      <Block>
        <h1 className="text-h-page text-primary">Notifications & préférences</h1>
        <p className="mt-1 text-[14px] text-ink-2">Choisissez comment être prévenu de l&apos;avancement de vos commandes et de vos messages.</p>

        <div className={`mt-6 flex flex-wrap items-center gap-3 rounded-box p-4 text-[14px] ${PUSH_COPY[push.state].tone}`}>
          <NotificationBing size={22} variant="Bold" />
          <span className="min-w-0 flex-1">{PUSH_COPY[push.state].text}</span>
          {push.state === "default" && (
            <Button size="sm" onClick={() => push.enable()}>
              Activer les notifications
            </Button>
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-box border border-line-3">
          <div className="hidden grid-cols-[1fr_90px_90px] gap-4 border-b border-line-3 bg-page/50 px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-ink-3 sm:grid">
            <span>Événement</span>
            <span className="flex items-center justify-center gap-1"><Sms size={14} /> E-mail</span>
            <span className="flex items-center justify-center gap-1"><Notification size={14} /> Push</span>
          </div>
          {isLoading || !prefs
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="m-4 h-12 !rounded-box" />)
            : NOTIFICATION_EVENTS.map((e) => (
                <div key={e.key} className="grid items-center gap-3 border-b border-line-3 px-5 py-4 last:border-0 sm:grid-cols-[1fr_90px_90px] sm:gap-4">
                  <div>
                    <p className="text-[15px] font-bold">{e.label}</p>
                    <p className="text-[13px] text-ink-3">{e.description}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-center">
                    <span className="text-[12px] text-ink-3 sm:hidden">E-mail</span>
                    <Switch label={`${e.label} par e-mail`} checked={prefs[e.key].email} onChange={(v) => toggle(e.key, "email", v)} />
                  </div>
                  <div className="flex items-center justify-between sm:justify-center">
                    <span className="text-[12px] text-ink-3 sm:hidden">Push</span>
                    <Switch label={`${e.label} en push`} checked={prefs[e.key].push} onChange={(v) => toggle(e.key, "push", v)} />
                  </div>
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
