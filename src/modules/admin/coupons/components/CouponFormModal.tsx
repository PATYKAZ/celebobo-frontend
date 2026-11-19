"use client";

import { useState, type FormEvent } from "react";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input, Switch } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { toast } from "@/shared/ui/Toast";
import { useSaveCoupon } from "../hooks/useAdminCoupons";
import { EMPTY_COUPON, couponToForm } from "../services/admin-coupons.service";
import type { AdminCoupon, CouponFormValues, CouponKind } from "../types";

type Errors = Partial<Record<keyof CouponFormValues, string>>;

const CODE = /^[A-Za-z0-9_-]{3,40}$/;
const num = (v: string) => Number(v.replace(",", "."));

function validate(v: CouponFormValues): Errors {
  const e: Errors = {};
  if (!CODE.test(v.code.trim())) e.code = "3 à 40 caractères : lettres, chiffres, tiret ou souligné.";
  const value = num(v.value);
  if (!v.value.trim() || !(value > 0)) e.value = "Indiquez une remise supérieure à 0.";
  else if (v.kind === "percent" && value > 100) e.value = "Un pourcentage ne peut pas dépasser 100.";
  if (v.maxDiscount.trim() && !(num(v.maxDiscount) > 0)) e.maxDiscount = "Montant invalide.";
  if (v.minSubtotal.trim() && !(num(v.minSubtotal) >= 0)) e.minSubtotal = "Montant invalide.";
  for (const key of ["usageLimit", "perUserLimit"] as const) {
    if (v[key].trim() && !(Number.isInteger(Number(v[key])) && Number(v[key]) >= 1)) e[key] = "Nombre entier, au moins 1.";
  }
  if (v.startsAt && v.endsAt && new Date(v.endsAt) <= new Date(v.startsAt)) e.endsAt = "La fin doit suivre le début.";
  return e;
}

/** Création / modification d'un code promo (monté seulement quand il est ouvert : état initial frais). */
export function CouponFormModal({ coupon, onClose }: { coupon: AdminCoupon | null; onClose: () => void }) {
  const [v, setV] = useState<CouponFormValues>(() => (coupon ? couponToForm(coupon) : EMPTY_COUPON));
  const [errors, setErrors] = useState<Errors>({});
  const save = useSaveCoupon(coupon);
  const set = <K extends keyof CouponFormValues>(k: K, value: CouponFormValues[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(v);
    setErrors(found);
    if (Object.keys(found).length) return;
    save.mutate(v, {
      onSuccess: (c) => {
        toast.success(coupon ? "Code promo mis à jour" : "Code promo créé", c.code);
        onClose();
      },
      onError: (err) => {
        if (err instanceof ApiError && (err.status === 400 || err.status === 409)) {
          const next: Errors = {};
          for (const [k, msg] of Object.entries(err.fieldErrors)) next[k as keyof CouponFormValues] = Array.isArray(msg) ? String(msg[0]) : String(msg);
          if (err.code === "coupon_code_taken") next.code = getErrorMessage(err);
          setErrors(next);
        }
        toast.error("Enregistrement impossible", getErrorMessage(err));
      },
    });
  };

  const percent = v.kind === "percent";

  return (
    <Modal open onClose={onClose} title={coupon ? `Modifier ${coupon.code}` : "Nouveau code promo"} className="max-w-[600px]">
      <form onSubmit={submit} noValidate className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Code" required value={v.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="Ex. BIENVENUE10" error={errors.code} maxLength={40} autoCapitalize="characters" />
          <Input label="Description (interne)" value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="Ex. campagne de rentrée" maxLength={200} />
        </div>

        <div>
          <p className="mb-2 text-[14px] font-semibold">Type de remise</p>
          <SegmentedControl<CouponKind>
            aria-label="Type de remise"
            value={v.kind}
            onChange={(kind) => set("kind", kind)}
            options={[
              { value: "percent", label: "Pourcentage" },
              { value: "fixed", label: "Montant fixe" },
            ]}
            size="sm"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={percent ? "Remise (%)" : "Remise ($)"} required type="number" inputMode="decimal" min="0" step={percent ? "1" : "0.01"} value={v.value} onChange={(e) => set("value", e.target.value)} error={errors.value} />
          {percent && <Input label="Remise maximale ($)" type="number" inputMode="decimal" min="0" step="0.01" value={v.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} hint="Vide : sans plafond." error={errors.maxDiscount} />}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Panier minimum ($)" type="number" inputMode="decimal" min="0" step="0.01" value={v.minSubtotal} onChange={(e) => set("minSubtotal", e.target.value)} hint="Vide : aucun minimum." error={errors.minSubtotal} />
          <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 self-end rounded-box border border-line px-4 active:bg-chip">
            <span className="text-[14px] font-semibold">Livraison offerte</span>
            <Switch label="Livraison offerte" checked={v.freeShipping} onChange={(x) => set("freeShipping", x)} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Début" type="datetime-local" value={v.startsAt} onChange={(e) => set("startsAt", e.target.value)} hint="Vide : dès maintenant." error={errors.startsAt} />
          <Input label="Fin" type="datetime-local" value={v.endsAt} onChange={(e) => set("endsAt", e.target.value)} hint="Vide : sans fin." error={errors.endsAt} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Utilisations au total" type="number" inputMode="numeric" min="1" step="1" value={v.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} hint="Vide : illimité." error={errors.usageLimit} />
          <Input label="Utilisations par client" type="number" inputMode="numeric" min="1" step="1" value={v.perUserLimit} onChange={(e) => set("perUserLimit", e.target.value)} hint="Exige d'être connecté. Vide : illimité." error={errors.perUserLimit} />
        </div>

        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-box border border-line px-4 active:bg-chip">
          <span className="text-[14px] font-semibold">Code actif</span>
          <Switch label="Code actif" checked={v.isActive} onChange={(x) => set("isActive", x)} />
        </label>

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={save.isPending} upper={false}>{coupon ? "Enregistrer" : "Créer le code"}</Button>
        </div>
      </form>
    </Modal>
  );
}
