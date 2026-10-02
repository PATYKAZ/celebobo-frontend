"use client";

import { Call, Lock, Profile as ProfileIcon, UserTick } from "iconsax-reactjs";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { fieldError, generalError } from "@/modules/auth/components/fieldErrors";
import { useUpdateProfile } from "../hooks/useAccount";
import type { Profile } from "../types";

interface Props {
  profile?: Profile;
  avatarFile: File | null;
  onSaved: () => void;
}

export function PersonalInfoForm({ profile, avatarFile, onSaved }: Props) {
  const mutation = useUpdateProfile();
  const [form, setForm] = useState({ firstName: "", lastName: "", phoneNumber: "", revendeurCode: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) setForm({ firstName: profile.firstName, lastName: profile.lastName, phoneNumber: profile.phoneNumber ?? "", revendeurCode: profile.invitedByCode ?? "" });
  }, [profile]);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.firstName.trim()) err.firstName = "Le prénom est requis.";
    if (!form.lastName.trim()) err.lastName = "Le nom est requis.";
    if (form.phoneNumber && !/^[+\d][\d\s().-]{6,}$/.test(form.phoneNumber)) err.phoneNumber = "Numéro de téléphone invalide.";
    if (form.revendeurCode && !/^\d{4}$/.test(form.revendeurCode)) err.revendeurCode = "Le code revendeur comporte 4 chiffres.";
    setErrors(err);
    if (Object.keys(err).length) return;
    mutation.mutate(
      { ...form, avatar: avatarFile },
      {
        onSuccess: () => {
          toast.success("Informations mises à jour");
          onSaved();
        },
      },
    );
  };

  const err = (k: string) => errors[k] ?? fieldError(mutation.error, k);
  const general = generalError(mutation.error);

  return (
    <form onSubmit={submit} noValidate className="space-y-4 sm:space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <Input label="Prénom" required value={form.firstName} onChange={set("firstName")} error={err("firstName")} leftIcon={<ProfileIcon size={17} />} autoComplete="given-name" />
        <Input label="Nom" required value={form.lastName} onChange={set("lastName")} error={err("lastName")} leftIcon={<ProfileIcon size={17} />} autoComplete="family-name" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <Input label="Téléphone" value={form.phoneNumber} onChange={set("phoneNumber")} error={err("phoneNumber") ?? fieldError(mutation.error, "phone")} leftIcon={<Call size={17} />} placeholder="+243 …" autoComplete="tel" inputMode="tel" enterKeyHint="next" />
        <Input label="E-mail" value={profile?.email ?? ""} disabled readOnly leftIcon={<Lock size={17} />} hint="Non modifiable." />
      </div>
      <Input
        label="Code du revendeur qui vous a invité"
        value={form.revendeurCode}
        onChange={set("revendeurCode")}
        error={err("revendeurCode")}
        inputMode="numeric"
        pattern="[0-9]*"
        enterKeyHint="go"
        maxLength={4}
        placeholder="Ex. 4821"
        leftIcon={<UserTick size={17} />}
        hint="Optionnel — il sera lié à vos futures commandes."
      />
      {general && <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger">{general}</p>}
      <div className="sticky bottom-[calc(var(--tabbar-h)+8px)] z-10 -mx-4 flex justify-end bg-white/90 px-4 py-2 backdrop-blur-md max-sm:[&>button]:w-full sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Button type="submit" loading={mutation.isPending}>Enregistrer</Button>
      </div>
    </form>
  );
}
