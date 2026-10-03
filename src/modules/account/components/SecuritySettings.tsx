"use client";

import { Key, Lock, Trash } from "iconsax-reactjs";
import { useState, type FormEvent } from "react";
import { getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { fieldError, generalError } from "@/modules/auth/components/fieldErrors";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { ConfirmDialog } from "@/modules/admin/ui/ConfirmDialog";
import { useChangePassword, useDeleteAccount } from "../hooks/useAccount";
import type { ChangePasswordInput } from "../types";

const EMPTY: ChangePasswordInput = { oldPassword: "", newPassword: "", newPasswordConfirm: "" };

function ChangePasswordForm() {
  const change = useChangePassword();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<ChangePasswordInput>>({});

  const set = (k: keyof ChangePasswordInput) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Partial<ChangePasswordInput> = {};
    if (!form.oldPassword) er.oldPassword = "Saisissez votre mot de passe actuel.";
    if (form.newPassword.length < 8) er.newPassword = "Au moins 8 caractères.";
    if (form.newPasswordConfirm !== form.newPassword) er.newPasswordConfirm = "Les mots de passe ne correspondent pas.";
    setErrors(er);
    if (Object.keys(er).length) return;
    change.mutate(form, {
      onSuccess: () => {
        setForm(EMPTY);
        toast.success("Mot de passe modifié");
      },
    });
  };

  const err = (k: keyof ChangePasswordInput, api: string) => errors[k] ?? fieldError(change.error, api);
  const general = generalError(change.error);

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <h3 className="flex items-center gap-2 text-[16px]"><Key size={16} /> Changer de mot de passe</h3>
      <Input label="Mot de passe actuel" required type="password" value={form.oldPassword} onChange={set("oldPassword")} error={err("oldPassword", "oldPassword")} leftIcon={<Lock size={17} />} autoComplete="current-password" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nouveau mot de passe" required type="password" value={form.newPassword} onChange={set("newPassword")} error={err("newPassword", "newPassword1")} leftIcon={<Lock size={17} />} autoComplete="new-password" />
        <Input label="Confirmation" required type="password" value={form.newPasswordConfirm} onChange={set("newPasswordConfirm")} error={err("newPasswordConfirm", "newPassword2")} leftIcon={<Lock size={17} />} autoComplete="new-password" enterKeyHint="go" />
      </div>
      {general && <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger">{general}</p>}
      <div className="flex justify-end max-sm:[&>button]:w-full">
        <Button type="submit" loading={change.isPending}>Mettre à jour</Button>
      </div>
    </form>
  );
}

/** Onglet « Sécurité » : changement de mot de passe et suppression du compte (clients uniquement). */
export function SecuritySettings() {
  const { user } = useAuth();
  const remove = useDeleteAccount();
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="rounded-box bg-page/60 p-4 sm:p-5">
        <ChangePasswordForm />
      </div>
      {user?.role === "client" && (
        <div className="flex flex-col gap-3 rounded-box border border-danger/30 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-2 text-[16px] text-danger"><Trash size={16} /> Supprimer mon compte</h3>
            <p className="mt-1 text-[13px] leading-[20px] text-ink-2">Vos informations personnelles et vos adresses sont effacées. Cette action est définitive.</p>
          </div>
          <Button variant="ghost" upper={false} leftIcon={<Trash size={15} />} className="text-danger hover:!bg-danger-100 max-sm:w-full" onClick={() => setConfirm(true)}>Supprimer</Button>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Supprimer votre compte ?"
        message="Votre compte sera anonymisé et vous serez déconnecté. Cette action est irréversible."
        confirmLabel="Supprimer définitivement"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(undefined, { onSuccess: () => toast.success("Compte supprimé"), onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)) })}
      />
    </div>
  );
}
