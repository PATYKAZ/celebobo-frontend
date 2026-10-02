"use client";

import { useEffect, useState } from "react";
import { Call, Location, Map1, User } from "iconsax-reactjs";
import { getErrorMessage, ApiError } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Checkbox, Input, Select } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import { useSaveAddress } from "../hooks/useAddressBook";
import { ADDRESS_LABELS, type SavedAddress, type SavedAddressInput } from "../types";

const EMPTY: SavedAddressInput = { label: "Domicile", recipient: "", phone: "", line1: "", quarter: "", city: "Kinshasa", country: "RD Congo", isDefault: false };

interface Props {
  open: boolean;
  onClose: () => void;
  /** Adresse à modifier (sinon création) */
  address?: SavedAddress | null;
  /** Valeurs initiales d'une nouvelle adresse (ex: préremplissage nom / téléphone) */
  defaults?: Partial<SavedAddressInput>;
  onSaved?: (a: SavedAddress) => void;
}

/** Création / modification d'une adresse du carnet. */
export function AddressFormModal({ open, onClose, address, defaults, onSaved }: Props) {
  const save = useSaveAddress();
  const [form, setForm] = useState<SavedAddressInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(address ? { label: address.label, recipient: address.recipient, phone: address.phone, line1: address.line1, quarter: address.quarter, city: address.city, country: address.country, isDefault: address.isDefault } : { ...EMPTY, ...defaults });
  }, [open, address, defaults]);

  const set = <K extends keyof SavedAddressInput>(k: K, v: SavedAddressInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (!form.recipient.trim()) e.recipient = "Indiquez le nom du destinataire.";
    if (!form.line1.trim()) e.line1 = "L'adresse est requise.";
    if (!form.quarter.trim()) e.quarter = "Le quartier / la commune est requis.";
    if (!/^[+\d][\d\s().-]{7,}$/.test(form.phone.trim())) e.phone = "Numéro de téléphone invalide.";
    setErrors(e);
    if (Object.keys(e).length) return;

    save.mutate(
      { input: form, id: address?.id },
      {
        onSuccess: (a) => {
          toast.success(address ? "Adresse mise à jour" : "Adresse ajoutée", a.label);
          onSaved?.(a);
          onClose();
        },
        onError: (err) => {
          if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
            setErrors(Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])));
          } else toast.error("Enregistrement impossible", getErrorMessage(err));
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={address ? "Modifier l'adresse" : "Nouvelle adresse"} className="max-w-[560px]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Libellé" value={form.label} onChange={(e) => set("label", e.target.value)} options={ADDRESS_LABELS.map((l) => ({ value: l, label: l }))} />
          <Input label="Destinataire" required value={form.recipient} onChange={(e) => set("recipient", e.target.value)} error={errors.recipient} leftIcon={<User size={17} />} />
        </div>
        <Input label="Téléphone" required value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} leftIcon={<Call size={17} />} placeholder="+243 …" />
        <Input label="Adresse" required value={form.line1} onChange={(e) => set("line1", e.target.value)} error={errors.line1} leftIcon={<Location size={17} />} placeholder="N°, avenue, rue" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Quartier / Commune" required value={form.quarter} onChange={(e) => set("quarter", e.target.value)} error={errors.quarter} leftIcon={<Map1 size={17} />} />
          <Input label="Ville" value={form.city} onChange={(e) => set("city", e.target.value)} />
          <Input label="Pays" value={form.country} onChange={(e) => set("country", e.target.value)} />
        </div>
        <Checkbox label="Définir comme adresse par défaut" checked={!!form.isDefault} onChange={(e) => set("isDefault", e.target.checked)} />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button upper={false} loading={save.isPending} onClick={submit}>Enregistrer</Button>
        </div>
      </div>
    </Modal>
  );
}
