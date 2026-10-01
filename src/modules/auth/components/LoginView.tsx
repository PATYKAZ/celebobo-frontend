"use client";

import Link from "next/link";
import { Lock, Profile } from "iconsax-reactjs";
import { useState, type FormEvent } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Button } from "@/shared/ui/Button";
import { Checkbox, Input } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { useLogin } from "../hooks/useAuth";
import { AuthLayoutCard } from "./AuthLayoutCard";
import { DemoAccounts } from "./DemoAccounts";
import { fieldError, generalError } from "./fieldErrors";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { useAuthRedirect } from "./useAuthRedirect";

export function LoginView() {
  const login = useLogin();
  const { redirect, searchSuffix } = useAuthRedirect();
  const [form, setForm] = useState({ login: "", password: "", remember: true });
  const [errors, setErrors] = useState<{ login?: string; password?: string }>({});
  const [forgot, setForgot] = useState(false);

  const run = (payload: { login: string; password: string; remember?: boolean }) =>
    login.mutate(payload, {
      onSuccess: (u) => {
        toast.success(`Bienvenue ${u.firstName || u.username} !`);
        redirect();
      },
    });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (!form.login.trim()) err.login = "Entrez votre e-mail ou nom d'utilisateur.";
    if (!form.password) err.password = "Entrez votre mot de passe.";
    setErrors(err);
    if (!Object.keys(err).length) run(form);
  };

  const general = generalError(login.error);

  return (
    <>
      <Breadcrumb items={[{ label: "Connexion" }]} />
      <AuthLayoutCard
        title="Connexion"
        subtitle="Heureux de vous revoir ! Connectez-vous pour suivre vos commandes et discuter avec votre revendeur."
        image="/images/hero/hero-1.jpg"
        headline="Votre high-tech, livré en toute confiance."
        footer={<>Pas encore de compte ? <Link href={`${ROUTES.register}${searchSuffix}`} className="font-bold text-primary hover:underline">Créer un compte</Link></>}
      >
        <form onSubmit={submit} noValidate className="space-y-5">
          <Input label="E-mail ou nom d'utilisateur" required value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} error={errors.login ?? fieldError(login.error, "login", "email", "username")} leftIcon={<Profile size={17} />} autoComplete="username" />
          <Input label="Mot de passe" required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password ?? fieldError(login.error, "password")} leftIcon={<Lock size={17} />} autoComplete="current-password" />
          <div className="flex items-center justify-between gap-3">
            <Checkbox checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} label="Se souvenir de moi" />
            <button type="button" onClick={() => setForgot(true)} className="text-[13px] font-semibold text-primary hover:underline">Mot de passe oublié ?</button>
          </div>
          {general && <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger">{general}</p>}
          <Button type="submit" size="lg" fullWidth loading={login.isPending}>Se connecter</Button>
        </form>
        <DemoAccounts disabled={login.isPending} onPick={(l) => run({ login: l, password: "demo1234", remember: true })} />
      </AuthLayoutCard>
      <ForgotPasswordModal open={forgot} onClose={() => setForgot(false)} initialEmail={form.login.includes("@") ? form.login : ""} />
    </>
  );
}
