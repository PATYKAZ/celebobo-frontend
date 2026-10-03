"use client";

import { useSearchParams } from "next/navigation";
import { CloseCircle, Lock, TickCircle } from "iconsax-reactjs";
import { useState, type FormEvent } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input } from "@/shared/ui/Form";
import { useResetPassword } from "../hooks/useAuth";
import { fieldError, generalError } from "./fieldErrors";

/** Lien reçu par e-mail : `/reinitialiser-mot-de-passe?uid=…&token=…`. */
export function ResetPasswordView() {
  const params = useSearchParams();
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";
  const reset = useResetPassword();
  const [form, setForm] = useState({ password: "", passwordConfirm: "" });
  const [errors, setErrors] = useState<{ password?: string; passwordConfirm?: string }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (form.password.length < 8) err.password = "Au moins 8 caractères.";
    if (form.passwordConfirm !== form.password) err.passwordConfirm = "Les mots de passe ne correspondent pas.";
    setErrors(err);
    if (!Object.keys(err).length) reset.mutate({ uid, token, ...form });
  };

  const linkError = fieldError(reset.error, "uid", "token");

  return (
    <>
      <Breadcrumb items={[{ label: "Nouveau mot de passe" }]} />
      <Block className="mx-auto max-w-[560px]">
        {!uid || !token || linkError ? (
          <EmptyState
            icon={<CloseCircle size={40} variant="Bulk" />}
            title="Lien invalide ou expiré"
            description="Demandez un nouveau lien depuis la page de connexion (« Mot de passe oublié ? »)."
            action={<Button href={ROUTES.login()}>Retour à la connexion</Button>}
          />
        ) : reset.isSuccess ? (
          <EmptyState
            icon={<TickCircle size={40} variant="Bulk" />}
            title="Mot de passe modifié"
            description="Vous pouvez vous connecter avec votre nouveau mot de passe."
            action={<Button href={ROUTES.login()}>Se connecter</Button>}
          />
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <h1 className="text-h-page">Choisir un nouveau mot de passe</h1>
            <Input label="Nouveau mot de passe" required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password ?? fieldError(reset.error, "newPassword1")} leftIcon={<Lock size={17} />} autoComplete="new-password" />
            <Input label="Confirmation" required type="password" value={form.passwordConfirm} onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })} error={errors.passwordConfirm ?? fieldError(reset.error, "newPassword2")} leftIcon={<Lock size={17} />} autoComplete="new-password" enterKeyHint="go" />
            {generalError(reset.error) && <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger">{generalError(reset.error)}</p>}
            <Button type="submit" size="lg" fullWidth loading={reset.isPending}>Enregistrer</Button>
          </form>
        )}
      </Block>
    </>
  );
}
