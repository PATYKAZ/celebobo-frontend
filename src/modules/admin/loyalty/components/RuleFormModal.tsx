"use client";

import { useState, type FormEvent } from "react";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input, Select, Switch } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import { useAdminCategories } from "@/modules/admin/categories";
import { useAdminProduct } from "../../products/hooks/useAdminProducts";
import { ProductCombobox } from "../../sales/components/ProductCombobox";
import { AMOUNT_TRIGGERS, TRIGGERS, emptyRule, ruleToForm, useSaveRule, type LoyaltyRule, type LoyaltyTrigger, type RuleFormValues } from "../rules";

type Errors = Partial<Record<keyof RuleFormValues, string>>;

const num = (s: string) => Number(s.replace(",", "."));
const positiveInt = (s: string) => s.trim() !== "" && Number.isInteger(Number(s)) && Number(s) > 0;

function validate(v: RuleFormValues): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Indiquez un nom (affiché au client comme motif de crédit).";
  if (!positiveInt(v.pointsValue)) e.pointsValue = "Nombre entier, au moins 1.";
  for (const k of ["maxPerUser", "maxPerDay", "cooldownDays"] as const) if (v[k].trim() && !positiveInt(v[k])) e[k] = "Nombre entier, au moins 1 (vide : sans limite).";
  if (AMOUNT_TRIGGERS.includes(v.trigger) && v.minAmount.trim() && !(num(v.minAmount) >= 0)) e.minAmount = "Montant positif.";
  if (v.trigger === "winback_inactivity" && v.daysInactive.trim() && !positiveInt(v.daysInactive)) e.daysInactive = "Nombre de jours entier, au moins 1.";
  if (v.trigger === "product_purchased" && !v.productId) e.productId = "Choisissez un produit.";
  if (v.trigger === "category_purchased" && !v.categoryId) e.categoryId = "Choisissez une catégorie.";
  return e;
}

/** Création / modification d'une règle de points (TCA). Monté seulement quand elle est ouverte. */
export function RuleFormModal({ rule, onClose }: { rule: LoyaltyRule | null; onClose: () => void }) {
  const [v, setV] = useState<RuleFormValues>(() => (rule ? ruleToForm(rule) : emptyRule()));
  const [errors, setErrors] = useState<Errors>({});
  const save = useSaveRule(rule);
  // nom du produit choisi (déclencheur « Produit acheté »), y compris en modification
  const { data: product } = useAdminProduct(v.trigger === "product_purchased" ? (v.productId ?? undefined) : undefined);
  const { data: categories } = useAdminCategories(v.trigger === "category_purchased");

  const set = <K extends keyof RuleFormValues>(k: K, value: RuleFormValues[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  /** Changer de déclencheur efface les conditions qui ne s'appliquent plus. */
  const setTrigger = (trigger: LoyaltyTrigger) =>
    setV((x) => ({ ...x, trigger, minAmount: "", daysInactive: "", photoRequired: false, productId: null, categoryId: null }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(v);
    setErrors(found);
    if (Object.keys(found).length) return toast.error("Vérifiez les champs signalés");
    save.mutate(v, {
      onSuccess: () => {
        toast.success(rule ? "Règle mise à jour" : "Règle créée", v.name.trim());
        onClose();
      },
      onError: (err) => {
        if (err instanceof ApiError) {
          const next: Errors = {};
          for (const [k, msg] of Object.entries(err.fieldErrors)) next[k as keyof Errors] = Array.isArray(msg) ? String(msg[0]) : String(msg);
          setErrors(next);
        }
        toast.error("Enregistrement impossible", getErrorMessage(err));
      },
    });
  };

  const purchase = AMOUNT_TRIGGERS.includes(v.trigger);

  return (
    <Modal open onClose={onClose} title={rule ? "Modifier la règle" : "Nouvelle règle de points"} className="max-w-[600px]">
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Input label="Nom de la règle" required value={v.name} onChange={(e) => set("name", e.target.value)} maxLength={150} placeholder="Ex. 50 pts à l'inscription" hint="Affiché au client comme motif de crédit." error={errors.name} />

        <Select
          label="Déclencheur"
          required
          value={v.trigger}
          onChange={(e) => setTrigger(e.target.value as LoyaltyTrigger)}
          options={TRIGGERS}
          disabled={!!rule}
          hint={rule ? "Le déclencheur d'une règle existante ne change pas : créez une nouvelle règle." : "L'événement qui crédite les points."}
        />

        <Input label="Points gagnés" type="number" inputMode="numeric" min="1" step="1" required value={v.pointsValue} onChange={(e) => set("pointsValue", e.target.value)} error={errors.pointsValue} />

        {purchase && <Input label="Montant minimum de la commande ($)" type="number" inputMode="decimal" min="0" step="0.01" value={v.minAmount} onChange={(e) => set("minAmount", e.target.value)} placeholder="Sans minimum" hint="La règle s'applique seulement au-delà de ce montant." error={errors.minAmount} />}

        {v.trigger === "product_purchased" && <ProductCombobox label="Produit concerné" value={product ?? null} onChange={(p) => set("productId", p.id)} error={errors.productId} />}

        {v.trigger === "category_purchased" && (
          <Select
            label="Catégorie concernée"
            required
            value={v.categoryId ?? ""}
            onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}
            options={[{ value: "", label: "Choisir une catégorie…" }, ...(categories ?? []).map((c) => ({ value: c.id, label: c.name }))]}
            error={errors.categoryId}
          />
        )}

        {v.trigger === "review_created" && (
          <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-box border border-line px-4 active:bg-chip">
            <span className="text-[14px] font-semibold">Photo obligatoire</span>
            <Switch label="Photo obligatoire" checked={v.photoRequired} onChange={(x) => set("photoRequired", x)} />
          </label>
        )}

        {v.trigger === "winback_inactivity" && <Input label="Jours d'inactivité" type="number" inputMode="numeric" min="1" step="1" value={v.daysInactive} onChange={(e) => set("daysInactive", e.target.value)} placeholder="Ex. 90" hint="Le client revient après ce nombre de jours sans commande." error={errors.daysInactive} />}

        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Max. par client" type="number" inputMode="numeric" min="1" step="1" value={v.maxPerUser} onChange={(e) => set("maxPerUser", e.target.value)} placeholder="Sans limite" error={errors.maxPerUser} />
          <Input label="Max. par jour" type="number" inputMode="numeric" min="1" step="1" value={v.maxPerDay} onChange={(e) => set("maxPerDay", e.target.value)} placeholder="Sans limite" error={errors.maxPerDay} />
          <Input label="Délai (jours)" type="number" inputMode="numeric" min="1" step="1" value={v.cooldownDays} onChange={(e) => set("cooldownDays", e.target.value)} placeholder="Aucun" hint="Entre deux crédits." error={errors.cooldownDays} />
        </div>

        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-box border border-line px-4 active:bg-chip">
          <span className="text-[14px] font-semibold">Règle active</span>
          <Switch label="Règle active" checked={v.isActive} onChange={(x) => set("isActive", x)} />
        </label>
        <p className="-mt-2 text-[12px] leading-[17px] text-ink-3">Une règle inactive ne crédite plus rien mais garde son historique.</p>

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={save.isPending} upper={false}>{rule ? "Enregistrer" : "Créer la règle"}</Button>
        </div>
      </form>
    </Modal>
  );
}
