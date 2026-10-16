"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { getErrorMessage } from "@/shared/lib/api";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Input, Switch } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import type { Programmes } from "@/modules/site/types";
import { SettingsSection } from "../../settings/components/SettingsForm";
import { PageHeader } from "../../ui/PageHeader";
import { toLoyaltyForm, useLoyaltySettings, useSaveLoyalty, type LoyaltyFormValues } from "../loyalty";
import { RulesSection } from "./RulesSection";

type Errors = Partial<Record<keyof LoyaltyFormValues, string>>;

const num = (s: string) => Number(s.replace(",", "."));
const intIn = (s: string, min: number, max: number) => s.trim() !== "" && Number.isInteger(Number(s)) && Number(s) >= min && Number(s) <= max;

function validate(v: LoyaltyFormValues): Errors {
  const e: Errors = {};
  const p = num(v.cashbackPercent);
  if (!(p >= 0.01 && p <= 50)) e.cashbackPercent = "Entre 0,01 et 50 %.";
  if (!intIn(v.cashbackMaxShare, 1, 100)) e.cashbackMaxShare = "Entre 1 et 100 %.";
  if (!(num(v.cashbackMinBalance) >= 0)) e.cashbackMinBalance = "Montant positif.";
  if (!intIn(v.cashbackValidityMonths, 1, 60)) e.cashbackValidityMonths = "Entre 1 et 60 mois.";
  for (const k of ["appStoreUrl", "playStoreUrl"] as const) if (v[k].trim() && !/^https?:\/\/\S+$/.test(v[k].trim())) e[k] = "Lien complet attendu (https://…).";
  return e;
}

function ProgrammeSwitch({ label, on, onChange, children }: { label: string; on: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-box border border-line px-4 py-3 active:bg-chip">
      <span>
        <span className="block text-[14px] font-semibold">{label}</span>
        <span className="block text-[12px] leading-[17px] text-ink-3">{children}</span>
      </span>
      <Switch label={label} checked={on} onChange={onChange} />
    </label>
  );
}

function Form({ initial }: { initial: Programmes }) {
  const [v, setV] = useState<LoyaltyFormValues>(() => toLoyaltyForm(initial));
  const [errors, setErrors] = useState<Errors>({});
  const save = useSaveLoyalty();
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
        toast.success("Programmes de fidélité enregistrés");
      },
      onError: (e) => toast.error("Enregistrement échoué", getErrorMessage(e)),
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      <SettingsSection title="Cagnotte" hint="Les clients gagnent un pourcentage de leurs achats livrés, utilisable pour payer une partie d'une commande.">
        <ProgrammeSwitch label="Programme actif" on={v.cashbackEnabled} onChange={(x) => set("cashbackEnabled", x)}>
          {v.cashbackEnabled ? `L'accueil affiche « ${v.cashbackPercent || "…"} % remboursés dans votre cagnotte ».` : "Désactivé : aucun bloc cagnotte sur l'accueil."}
        </ProgrammeSwitch>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Taux (%)" type="number" inputMode="decimal" min="0.01" max="50" step="0.01" hint="Du montant des produits, après coupons et offres." {...field("cashbackPercent")} />
          <Input label="Part maximale d'une commande (%)" type="number" inputMode="numeric" min="1" max="100" hint="Ce que la cagnotte peut payer au plus." {...field("cashbackMaxShare")} />
          <Input label="Solde minimum pour l'utiliser ($)" type="number" inputMode="decimal" min="0" step="0.01" {...field("cashbackMinBalance")} />
          <Input label="Validité (mois)" type="number" inputMode="numeric" min="1" max="60" hint="Après chaque crédit." {...field("cashbackValidityMonths")} />
        </div>
      </SettingsSection>

      <SettingsSection title="Application mobile" hint={""}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Lien App Store" type="url" placeholder="https://apps.apple.com/…" {...field("appStoreUrl")} />
          <Input label="Lien Google Play" type="url" placeholder="https://play.google.com/store/apps/…" {...field("playStoreUrl")} />
        </div>
      </SettingsSection>

      <div className="sticky bottom-[calc(var(--tabbar-h)+8px)] z-10 lg:bottom-4">
        <Block pad="none" className="flex items-center justify-between gap-3 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,.08)] sm:px-[30px]">
          <p className="text-[13px] text-ink-2 max-sm:hidden">Chaque programme n&apos;apparaît en boutique qu&apos;une fois activé.</p>
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
      <PageHeader title="Programmes de fidélité" description="Points, cagnotte et application : chaque règle se règle ici, chaque programme reste invisible tant qu'il n'est pas activé." />
      <RulesSection />
      {isLoading ? (
        <div role="status" aria-busy="true" className="grid gap-3">
          <span className="sr-only">Chargement des programmes…</span>
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[220px] rounded-box!" />)}
        </div>
      ) : isError || !data ? (
        <Block className="text-center">
          <p className="text-[14px] text-ink-2">{getErrorMessage(error, "Impossible de charger les programmes.")}</p>
          <Button className="mt-4" variant="chip" upper={false} onClick={() => refetch()}>Réessayer</Button>
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
