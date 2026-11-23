"use client";

import { useState, type FormEvent } from "react";
import { getErrorMessage, ApiError } from "@/shared/lib/api";
import { PHONE_HINT, PHONE_PLACEHOLDER, phoneError } from "@/shared/lib/phone";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import { useCreateReseller } from "../hooks/useResellers";

const INITIAL = { firstName: "", lastName: "", email: "", phone: "" };

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
    // un revendeur doit avoir un numéro mobile congolais (même règle que l'API)
    const phone = phoneError(form.phone);
    if (phone) err.phone = phone;
    setErrors(err);
    if (Object.keys(err).length) return;
    create.mutate(
      { firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined },
      {
        onSuccess: (r) => {
          toast.success("Revendeur créé", `${r.name} · code ${r.codeRevendeur}`);
          setForm(INITIAL);
          onClose();
        },
        onError: (e) => {
          if (e instanceof ApiError && e.status === 400) {
            const fe = e.fieldErrors;
            setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k === "phoneNumber" ? "phone" : k, Array.isArray(v) ? v[0] : v])));
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
        <Input label="Téléphone" type="tel" inputMode="tel" value={form.phone} onChange={set("phone")} error={errors.phone} placeholder={PHONE_PLACEHOLDER} hint={PHONE_HINT} required />
        <p className="rounded-box bg-primary-50 p-3 text-sm text-ink-2">Un code d&apos;invitation à 4 chiffres sera généré. Le revendeur pourra le partager à ses clients. Ses commissions suivent les règles communes à tous les revendeurs.</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose} upper={false}>Annuler</Button>
          <Button type="submit" loading={create.isPending} upper={false}>Créer le revendeur</Button>
        </div>
      </form>
    </Modal>
  );
}
