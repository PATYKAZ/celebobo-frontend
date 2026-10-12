"use client";

import { useState, type FormEvent } from "react";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input, Switch, Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import { useSaveZone } from "../hooks/useAdminSettings";
import { zoneToForm } from "../services/admin-settings.mapper";
import { EMPTY_ZONE, type AdminShippingZone, type ZoneFormValues } from "../types";

type Errors = Partial<Record<keyof ZoneFormValues, string>>;

function validate(v: ZoneFormValues): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Le nom est requis.";
  if (v.fee.trim() === "" || Number(v.fee) < 0) e.fee = "Frais requis (0 si gratuit).";
  if (v.freeThreshold.trim() && Number(v.freeThreshold) < 0) e.freeThreshold = "Montant invalide.";
  if (!v.isDefault && !v.cities.split(/[\n,]/).some((c) => c.trim())) e.cities = "Indiquez au moins une ville (ou faites-en la zone par défaut).";
  return e;
}

/** Création / modification d'une zone. Monté seulement quand il est ouvert (`key` du parent) : état initial frais. */
export function ZoneFormModal({ zone, nextPosition, onClose }: { zone: AdminShippingZone | null; nextPosition: number; onClose: () => void }) {
  const [v, setV] = useState<ZoneFormValues>(() => (zone ? zoneToForm(zone) : EMPTY_ZONE));
  const [errors, setErrors] = useState<Errors>({});
  const save = useSaveZone(zone, nextPosition);
  const set = <K extends keyof ZoneFormValues>(k: K, value: ZoneFormValues[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(v);
    setErrors(found);
    if (Object.keys(found).length) return;
    save.mutate(v, {
      onSuccess: (z) => {
        toast.success(zone ? "Zone mise à jour" : "Zone créée", z.name);
        onClose();
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 400) {
          const next: Errors = {};
          for (const [k, msg] of Object.entries(err.fieldErrors)) next[k as keyof ZoneFormValues] = Array.isArray(msg) ? String(msg[0]) : String(msg);
          setErrors(next);
        }
        toast.error("Enregistrement impossible", getErrorMessage(err));
      },
    });
  };

  return (
    <Modal open onClose={onClose} title={zone ? "Modifier la zone" : "Nouvelle zone de livraison"} className="max-w-[560px]">
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Input label="Nom de la zone" required value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex. Bukavu" error={errors.name} maxLength={80} />
        <Textarea
          label="Villes desservies"
          className="min-h-[96px]"
          value={v.cities}
          onChange={(e) => set("cities", e.target.value)}
          placeholder={"Bukavu\nKabare"}
          hint="Une ville par ligne. La ville saisie par le client à la commande détermine la zone."
          error={errors.cities}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Frais de livraison ($)" required type="number" inputMode="decimal" min="0" step="0.01" value={v.fee} onChange={(e) => set("fee", e.target.value)} error={errors.fee} />
          <Input label="Offerte dès ($)" type="number" inputMode="decimal" min="0" step="0.01" value={v.freeThreshold} onChange={(e) => set("freeThreshold", e.target.value)} hint="Vide : jamais offerte." error={errors.freeThreshold} />
        </div>
        <Input label="Délai annoncé" value={v.deliveryEstimate} onChange={(e) => set("deliveryEstimate", e.target.value)} placeholder="Ex. 24 à 48 h" maxLength={60} error={errors.deliveryEstimate} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-box border border-line px-4 active:bg-chip">
            <span className="text-[14px] font-semibold">Zone active</span>
            <Switch label="Zone active" checked={v.isActive} onChange={(x) => set("isActive", x)} />
          </label>
          <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-box border border-line px-4 active:bg-chip">
            <span className="text-[14px] font-semibold">Zone par défaut</span>
            <Switch label="Zone par défaut" checked={v.isDefault} onChange={(x) => set("isDefault", x)} />
          </label>
        </div>
        <p className="-mt-1 text-[12px] leading-[17px] text-ink-3">La zone par défaut s’applique aux villes qui ne figurent dans aucune zone (ex. « Reste du pays »).</p>
        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={save.isPending} upper={false}>{zone ? "Enregistrer" : "Créer la zone"}</Button>
        </div>
      </form>
    </Modal>
  );
}
