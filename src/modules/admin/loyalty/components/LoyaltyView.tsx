"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Input, Switch } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { useSiteSettings, type Programmes } from "@/modules/site";
import { pointsReleaseDelay } from "@/modules/points/types";
import { SettingsSection } from "../../settings/components/SettingsForm";
import { PageHeader } from "../../ui/PageHeader";
import { toLoyaltyForm, useLoyaltySettings, useSaveLoyalty, type LoyaltyFormValues } from "../loyalty";

type Errors = Partial<Record<keyof LoyaltyFormValues, string>>;

const num = (s: string) => Number(s.replace(",", "."));
const intIn = (s: string, min: number, max: number) => s.trim() !== "" && Number.isInteger(Number(s)) && Number(s) >= min && Number(s) <= max;

/** Mêmes bornes que l'API (LoyaltySettingsInput). */
function validate(v: LoyaltyFormValues): Errors {
  const e: Errors = {};
  const p = num(v.pointsPercent);
  if (!(p >= 0.01 && p <= 50)) e.pointsPercent = "Entre 0,01 et 50 %.";
  if (!intIn(v.pointsValidityMonths, 1, 60)) e.pointsValidityMonths = "Entre 1 et 60 mois.";
  const r = num(v.referralPercent);
  if (!(r >= 0.01 && r <= 10)) e.referralPercent = "Entre 0,01 et 10 %.";
  if (!intIn(v.referralMonths, 1, 60)) e.referralMonths = "Entre 1 et 60 mois.";
  for (const k of ["appStoreUrl", "playStoreUrl"] as const) if (v[k].trim() && !/^https?:\/\/\S+$/.test(v[k].trim())) e[k] = "Lien complet attendu (https://…).";
  return e;
}

/** Interrupteur d'un programme, avec ce que la boutique affiche. */
function ProgrammeSwitch({ label, on, onChange, children }: { label: string; on: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-box border border-line px-4 py-3 active:bg-chip">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-ink-3">{children}</span>
      </span>
      <Switch label={label} checked={on} onChange={onChange} />
    </label>
  );
}

function Form({ initial }: { initial: Programmes }) {
  const [v, setV] = useState<LoyaltyFormValues>(() => toLoyaltyForm(initial));
  const [errors, setErrors] = useState<Errors>({});
  const save = useSaveLoyalty();
  // délai de retour des réglages boutique : les points gagnés restent en attente jusque-là
  const { returnDays } = useSiteSettings();
  const set = <K extends keyof LoyaltyFormValues>(k: K, value: LoyaltyFormValues[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const field = (k: keyof LoyaltyFormValues) => ({ value: v[k] as string, onChange: (e: { target: { value: string } }) => set(k, e.target.value), error: errors[k] });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(v);
    setErrors(found);
    if (Object.keys(found).length) return toast.error("Vérifiez les champs signalés");
    save.mutate(v, {
      onSuccess: (data) => {
        setV(toLoyaltyForm(data));
        toast.success("Programmes enregistrés", "L'accueil les affiche dans la minute.");
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 400) {
          const next: Errors = {};
          for (const [k, msg] of Object.entries(err.fieldErrors)) next[k as keyof Errors] = Array.isArray(msg) ? String(msg[0]) : String(msg);
          setErrors(next);
        }
        toast.error("Enregistrement impossible", getErrorMessage(err));
      },
    });
  };

  const apps = [v.appStoreUrl.trim() && "App Store", v.playStoreUrl.trim() && "Google Play"].filter(Boolean);

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 sm:gap-4">
      <SettingsSection title="Points de fidélité" hint={`Chaque client gagne un pourcentage de ce qu'il paie pour les produits (hors livraison), 1 point = 1 $. Les points restent en attente jusqu'à la fin du délai de retour (${pointsReleaseDelay(returnDays)}), puis le client en utilise autant qu'il veut. Jamais versés en espèces.`}>
        <ProgrammeSwitch label="Points de fidélité actifs" on={v.pointsEnabled} onChange={(x) => set("pointsEnabled", x)}>
          {v.pointsEnabled ? `L'accueil affiche « ${v.pointsPercent || "…"} % de vos achats en points de fidélité ».` : "Désactivé : aucun point gagné ni bloc points sur l'accueil."}
        </ProgrammeSwitch>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Points gagnés (%)" type="number" inputMode="decimal" min="0.01" max="50" step="0.01" hint="De ce que le client paie pour les produits, après coupons, offres et points utilisés." {...field("pointsPercent")} />
          <Input label="Validité (mois sans achat)" type="number" inputMode="numeric" min="1" max="60" hint="Tout le solde reste valable tant que le client achète au moins une fois dans ce délai." {...field("pointsValidityMonths")} />
          <Input label="Points de parrainage (%)" type="number" inputMode="decimal" min="0.01" max="10" step="0.01" hint="Pour le revendeur qui a invité le client, sur ses factures payées sans points ni coupon (hors livraison)." {...field("referralPercent")} />
          <Input label="Durée du parrainage (mois)" type="number" inputMode="numeric" min="1" max="60" hint="Le client reste rattaché à son revendeur pendant ce délai après l'inscription avec son code." {...field("referralMonths")} />
        </div>
      </SettingsSection>

      <SettingsSection title="Application mobile" hint={apps.length ? `L'accueil affiche le bloc « Téléchargez notre app » avec ${apps.join(" et ")}.` : "Sans lien, le bloc « Téléchargez notre app » n'apparaît pas."}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Lien App Store" type="url" placeholder="https://apps.apple.com/…" {...field("appStoreUrl")} />
          <Input label="Lien Google Play" type="url" placeholder="https://play.google.com/store/apps/…" {...field("playStoreUrl")} />
        </div>
      </SettingsSection>

      <div className="sticky bottom-[calc(var(--tabbar-h)+8px)] z-10 lg:bottom-4">
        <Block pad="none" className="flex items-center justify-between gap-3 px-4 py-3 shadow-lg sm:px-8">
          <p className="text-sm text-ink-2 max-sm:hidden">Chaque programme n’apparaît en boutique qu’une fois activé.</p>
          <Button type="submit" loading={save.isPending} upper={false} className="max-sm:w-full">Enregistrer</Button>
        </Block>
      </div>
    </form>
  );
}

function Content() {
  const { data, isLoading, isError, error, refetch } = useLoyaltySettings();
  return (
    <>
      <PageHeader title="Programmes de fidélité" description="Points de fidélité et application : chaque règle se règle ici, chaque programme reste invisible tant qu'il n'est pas activé." />
      {isLoading ? (
        <div role="status" aria-busy="true" className="grid gap-3">
          <span className="sr-only">Chargement des programmes…</span>
          {[0, 1].map((i) => <Skeleton key={i} className="h-[220px] rounded-box!" />)}
        </div>
      ) : isError || !data ? (
        <Block className="text-center">
          <p className="text-sm text-ink-2">{getErrorMessage(error, "Impossible de charger les programmes.")}</p>
          <Button className="mt-4" variant="secondary" upper={false} onClick={() => refetch()}>Réessayer</Button>
        </Block>
      ) : (
        <Form initial={data} />
      )}
    </>
  );
}

export function LoyaltyView() {
  return (
    <PermissionGuard permission="loyalty.manage">
      <Content />
    </PermissionGuard>
  );
}
