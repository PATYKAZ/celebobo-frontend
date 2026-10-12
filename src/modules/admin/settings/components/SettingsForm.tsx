"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Add, Trash } from "@/shared/ui/icons";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Checkbox, Input, Switch, Textarea } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { PAYMENT_METHODS } from "@/modules/site/types";
import { useSaveSettings } from "../hooks/useAdminSettings";
import { settingsToForm } from "../services/admin-settings.mapper";
import { SOCIAL_NETWORKS, type AdminSiteSettings, type SettingsFormValues } from "../types";

type Errors = Partial<Record<string, string>>;

export function SettingsSection({ title, hint, children, aside }: { title: string; hint?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <Block pad="none" className="p-4 sm:p-[30px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[16px] leading-[22px] sm:text-[18px] sm:leading-[24px]">{title}</h2>
          {hint && <p className="mt-1 text-[12px] leading-[17px] text-ink-3 sm:text-[13px] sm:leading-[19px]">{hint}</p>}
        </div>
        {aside}
      </div>
      <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5">{children}</div>
    </Block>
  );
}

const fc = (n: number) => `${Math.round(n).toLocaleString("fr-CD")} FC`;

function validate(v: SettingsFormValues): Errors {
  const e: Errors = {};
  const rate = Number(v.usdToCdf);
  if (!v.usdToCdf.trim() || !Number.isFinite(rate) || rate < 1) e.usdToCdf = "Taux invalide (au moins 1).";
  const discount = Number(v.newsletterDiscount);
  if (!Number.isInteger(discount) || discount < 0 || discount > 90) e.newsletterDiscount = "Entre 0 et 90 %.";
  const days = Number(v.returnDays);
  if (!v.returnDays.trim() || !Number.isInteger(days) || days < 0 || days > 365) e.returnDays = "Entre 0 et 365 jours.";
  if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = "Adresse e-mail invalide.";
  for (const { key } of SOCIAL_NETWORKS) {
    const url = v.social[key]?.trim();
    if (url && !/^https?:\/\/\S+$/.test(url)) e[`social.${key}`] = "Lien complet attendu (https://…).";
  }
  return e;
}

/** Réglages du site (admin) : taux USD → FC, coordonnées, horaires, moyens de paiement, réseaux, newsletter. */
export function SettingsForm({ settings }: { settings: AdminSiteSettings }) {
  const [v, setV] = useState<SettingsFormValues>(() => settingsToForm(settings));
  const [errors, setErrors] = useState<Errors>({});
  const save = useSaveSettings();
  const set = <K extends keyof SettingsFormValues>(k: K, value: SettingsFormValues[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const rate = Number(v.usdToCdf);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(v);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Vérifiez les champs signalés");
      return;
    }
    save.mutate(v, {
      onSuccess: (data) => {
        setV(settingsToForm(data));
        toast.success("Réglages enregistrés", "La boutique les affiche dans la minute.");
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 400) {
          const next: Errors = {};
          for (const [k, msg] of Object.entries(err.fieldErrors)) next[k] = Array.isArray(msg) ? String(msg[0]) : String(msg);
          setErrors(next);
        }
        toast.error("Enregistrement impossible", getErrorMessage(err));
      },
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 sm:gap-4">
      <SettingsSection title="Devise" hint="Les prix sont enregistrés et payés en dollars ; le franc congolais n'est qu'un affichage, calculé avec ce taux.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Taux : 1 $ = … FC"
            required
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            value={v.usdToCdf}
            onChange={(e) => set("usdToCdf", e.target.value)}
            error={errors.usdToCdf}
          />
          <div className="rounded-box bg-chip p-4 text-[13px] leading-[20px] text-ink-2">
            <p className="font-semibold text-ink">Aperçu</p>
            {Number.isFinite(rate) && rate >= 1 ? (
              <p className="mt-1 tabular-nums">1 $ = {fc(rate)} · 99 $ = {fc(99 * rate)} · 250 $ = {fc(250 * rate)}</p>
            ) : (
              <p className="mt-1">Saisissez un taux valide.</p>
            )}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Coordonnées" hint="Affichées dans l'en-tête, le pied de page, la page Contact et les documents.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Hotline" value={v.hotline} onChange={(e) => set("hotline", e.target.value)} placeholder="+243 …" inputMode="tel" error={errors.hotline} />
          <Input label="WhatsApp" value={v.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+243…" inputMode="tel" hint="Numéro au format international, sans espaces." error={errors.whatsapp} />
          <Input label="E-mail de contact" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
        </div>
        <Textarea
          label="Adresse"
          className="min-h-[80px]"
          value={v.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Ex. Avenue …, Ibanda, Bukavu"
          hint="Séparez les lignes par une virgule (rue, quartier, ville)."
          maxLength={255}
          error={errors.address}
        />
      </SettingsSection>

      <SettingsSection
        title="Horaires d'ouverture"
        aside={
          <Button type="button" variant="chip" size="sm" upper={false} leftIcon={<Add size={16} />} onClick={() => set("openingHours", [...v.openingHours, { days: "", hours: "" }])}>
            Ajouter une ligne
          </Button>
        }
      >
        {v.openingHours.length === 0 && <p className="text-[13px] text-ink-3">Aucun horaire affiché.</p>}
        {v.openingHours.map((h, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:gap-3">
            <Input label={i === 0 ? "Jours" : undefined} aria-label="Jours" value={h.days} placeholder="Lundi à vendredi" onChange={(e) => set("openingHours", v.openingHours.map((x, j) => (j === i ? { ...x, days: e.target.value } : x)))} wrapperClassName="max-sm:col-span-2" />
            <Input label={i === 0 ? "Heures" : undefined} aria-label="Heures" value={h.hours} placeholder="8 h 30 à 18 h 30" onChange={(e) => set("openingHours", v.openingHours.map((x, j) => (j === i ? { ...x, hours: e.target.value } : x)))} />
            <button type="button" aria-label={`Retirer la ligne ${h.days || i + 1}`} onClick={() => set("openingHours", v.openingHours.filter((_, j) => j !== i))} className="grid size-12 place-items-center rounded-box text-ink-3 transition-colors hover:bg-danger-50 hover:text-danger sm:size-[45px]">
              <Trash size={18} />
            </button>
          </div>
        ))}
      </SettingsSection>

      <SettingsSection title="Engagements affichés en boutique" hint="Repris dans la barre verte, la fiche produit, le pied de page, la page Contact et le texte de l'accueil.">
        <Input
          label="Délai de retour (jours)"
          type="number"
          inputMode="numeric"
          min="0"
          max="365"
          wrapperClassName="sm:max-w-[260px]"
          value={v.returnDays}
          onChange={(e) => set("returnDays", e.target.value)}
          hint={Number(v.returnDays) === 0 ? "0 : aucun délai de retour annoncé." : `Affiché : « Retour sous ${v.returnDays || "…"} jour${Number(v.returnDays) > 1 ? "s" : ""} ».`}
          error={errors.returnDays}
        />
        <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-box border border-line px-4 py-3 active:bg-chip">
          <span>
            <span className="block text-[14px] font-semibold">Service client joignable 24 h/24, 7 j/7</span>
            <span className="block text-[12px] leading-[17px] text-ink-3">
              {v.supportAlwaysOpen ? "La boutique affiche « Service client 24/7 »." : "La boutique affiche vos horaires d'ouverture à la place."}
            </span>
          </span>
          <Switch label="Service client joignable 24 h/24, 7 j/7" checked={v.supportAlwaysOpen} onChange={(x) => set("supportAlwaysOpen", x)} />
        </label>
      </SettingsSection>

      <SettingsSection title="Moyens de paiement" hint="Proposés au client et présentés dans le guide d'achat.">
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(PAYMENT_METHODS).map(([code, m]) => (
            <Checkbox
              key={code}
              label={m.label}
              checked={v.paymentMethods.includes(code)}
              onChange={(e) => set("paymentMethods", e.target.checked ? [...v.paymentMethods, code] : v.paymentMethods.filter((c) => c !== code))}
            />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Réseaux sociaux" hint="Laissez vide pour masquer un réseau.">
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_NETWORKS.map(({ key, label }) => (
            <Input key={key} label={label} type="url" inputMode="url" value={v.social[key] ?? ""} placeholder="https://…" onChange={(e) => set("social", { ...v.social, [key]: e.target.value })} error={errors[`social.${key}`]} />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Newsletter" hint="Code de bienvenue envoyé à l'inscription.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Code de bienvenue" value={v.newsletterCode} onChange={(e) => set("newsletterCode", e.target.value.toUpperCase())} maxLength={30} error={errors.newsletterCode} />
          <Input label="Remise (%)" type="number" inputMode="numeric" min="0" max="90" value={v.newsletterDiscount} onChange={(e) => set("newsletterDiscount", e.target.value)} error={errors.newsletterDiscount} />
        </div>
      </SettingsSection>

      {/* actions collées en bas de l'écran */}
      <div className="sticky bottom-[calc(var(--tabbar-h)+8px)] z-10 lg:bottom-4">
        <Block pad="none" className="flex items-center justify-between gap-3 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,.08)] sm:px-[30px]">
          <p className="text-[13px] text-ink-2 max-sm:hidden">Les changements s’appliquent à toute la boutique.</p>
          <Button type="submit" loading={save.isPending} upper={false} className="max-sm:w-full">Enregistrer les réglages</Button>
        </Block>
      </div>
    </form>
  );
}
