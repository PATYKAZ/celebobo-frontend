"use client";

import { useState, type FormEvent } from "react";
import { getErrorMessage, ApiError } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import { useCreateReseller } from "../hooks/useResellers";

const INITIAL = { firstName: "", lastName: "", email: "", phone: "", rate: "7" };

/** Création d'un revendeur : un code d'invitation à 4 chiffres est généré à l'enregistrement. */
export function CreateResellerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useCreateReseller();
  const set = (k: keyof typeof INITIAL) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.firstName.trim()) err.firstName = "Prénom requis";
    if (!form.lastName.trim()) err.lastName = "Nom requis";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "E-mail invalide";
    const rate = Number(form.rate.replace(",", "."));
    if (Number.isNaN(rate) || rate < 0 || rate > 50) err.rate = "Entre 0 et 50 %";
    setErrors(err);
    if (Object.keys(err).length) return;
    create.mutate(
      { firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, commissionRate: rate / 100 },
      {
        onSuccess: (r) => {
          toast.success("Revendeur créé", `${r.name} · code ${r.codeRevendeur}`);
          setForm(INITIAL);
          onClose();
        },
        onError: (e) => {
          if (e instanceof ApiError && e.status === 400) {
            const fe = e.fieldErrors;
            setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
          }
          toast.error("Création impossible", getErrorMessage(e));
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouveau revendeur">
      <form onSubmit={submit} className="grid gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Prénom" value={form.firstName} onChange={set("firstName")} error={errors.firstName} required />
          <Input label="Nom" value={form.lastName} onChange={set("lastName")} error={errors.lastName} required />
        </div>
        <Input label="E-mail" type="email" value={form.email} onChange={set("email")} error={errors.email} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Téléphone" value={form.phone} onChange={set("phone")} placeholder="+243 …" />
          <Input label="Commission (%)" inputMode="decimal" value={form.rate} onChange={set("rate")} error={errors.rate} hint="Appliquée au chiffre d'affaires de ses ventes." />
        </div>
        <p className="rounded-box bg-primary-50 p-3 text-[13px] leading-[19px] text-ink-2">Un code d&apos;invitation à 4 chiffres sera généré. Le revendeur pourra le partager à ses clients.</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="chip" onClick={onClose} upper={false}>Annuler</Button>
          <Button type="submit" loading={create.isPending} upper={false}>Créer le revendeur</Button>
        </div>
      </form>
    </Modal>
  );
}
