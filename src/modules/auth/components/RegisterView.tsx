"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Call, Lock, Profile, Sms, SmsTracking, UserTick } from "iconsax-reactjs";
import { useState, type FormEvent } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Button } from "@/shared/ui/Button";
import { GoogleButton } from "./GoogleButton";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Checkbox, Input } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { getErrorMessage } from "@/shared/lib/api";
import { useRegister, useResendVerification } from "../hooks/useAuth";
import { AuthLayoutCard } from "./AuthLayoutCard";
import { fieldError, generalError } from "./fieldErrors";
import { useAuthRedirect } from "./useAuthRedirect";

const INITIAL = { firstName: "", lastName: "", email: "", phoneNumber: "", password: "", passwordConfirm: "", codeRevendeur: "" };
type Form = typeof INITIAL;

export function RegisterView() {
  const register = useRegister();
  const resend = useResendVerification();
  const { next, redirect, searchSuffix } = useAuthRedirect();
  // Lien d'invitation d'un revendeur : /inscription?code=4821 (ou ?ref=) pré-remplit le code
  const params = useSearchParams();
  const ref = params.get("ref") ?? params.get("code");
  const [form, setForm] = useState<Form>({ ...INITIAL, codeRevendeur: ref && /^\d{4}$/.test(ref) ? ref : "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Form | "terms", string>>>({});

  const set = (k: keyof Form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (!form.firstName.trim()) err.firstName = "Le prénom est requis.";
    if (!form.lastName.trim()) err.lastName = "Le nom est requis.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Adresse e-mail invalide.";
    if (form.phoneNumber && !/^[+\d][\d\s().-]{6,}$/.test(form.phoneNumber)) err.phoneNumber = "Numéro invalide.";
    if (form.password.length < 8) err.password = "Au moins 8 caractères.";
    if (form.passwordConfirm !== form.password) err.passwordConfirm = "Les mots de passe ne correspondent pas.";
    if (form.codeRevendeur && !/^\d{4}$/.test(form.codeRevendeur)) err.codeRevendeur = "Le code revendeur comporte 4 chiffres.";
    if (!terms) err.terms = "Vous devez accepter les conditions.";
    setErrors(err);
    if (Object.keys(err).length) return;
    register.mutate(
      { ...form, phoneNumber: form.phoneNumber || undefined, codeRevendeur: form.codeRevendeur || undefined },
      {
        onSuccess: (r) => {
          if (!r.verificationRequired) redirect();
        },
      },
    );
  };

  const e = (k: keyof Form, ...api: string[]) => errors[k] ?? fieldError(register.error, k, ...api);
  const general = generalError(register.error);

  const resendLink = () =>
    resend.mutate(form.email, {
      onSuccess: () => toast.success("E-mail renvoyé", "Pensez à vérifier vos spams."),
      onError: (err) => toast.error("Envoi impossible", getErrorMessage(err)),
    });

  return (
    <>
      <Breadcrumb items={[{ label: "Inscription" }]} />
      <AuthLayoutCard
        title="Créer un compte"
        subtitle="Rejoignez Celebobo en une minute et commandez en toute simplicité."
        image="/images/hero/hero-3.jpg"
        headline="Une boutique tech, des revendeurs de confiance."
        footer={<>Déjà inscrit ? <Link href={`${ROUTES.login()}${searchSuffix ? `${searchSuffix}` : ""}`} className="font-bold text-primary hover:underline">Se connecter</Link></>}
      >
        {register.data?.verificationRequired ? (
          <EmptyState
            className="sm:py-8"
            icon={<SmsTracking size={40} variant="Bulk" />}
            title="Vérifiez votre boîte e-mail"
            description={`Nous avons envoyé un lien de confirmation à ${register.data.email}. Cliquez dessus pour activer votre compte, puis connectez-vous.`}
            action={<Button variant="outline" upper={false} loading={resend.isPending} onClick={resendLink}>Renvoyer l&apos;e-mail</Button>}
          />
        ) : (
          <>
            <form onSubmit={submit} noValidate className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Prénom" required value={form.firstName} onChange={set("firstName")} error={e("firstName")} leftIcon={<Profile size={17} />} autoComplete="given-name" />
                <Input label="Nom" required value={form.lastName} onChange={set("lastName")} error={e("lastName")} leftIcon={<Profile size={17} />} autoComplete="family-name" />
              </div>
              <Input label="E-mail" required type="email" value={form.email} onChange={set("email")} error={e("email")} leftIcon={<Sms size={17} />} autoComplete="email" inputMode="email" autoCapitalize="none" enterKeyHint="next" />
              <Input label="Téléphone" value={form.phoneNumber} onChange={set("phoneNumber")} error={e("phoneNumber")} leftIcon={<Call size={17} />} placeholder="+243 …" autoComplete="tel" inputMode="tel" enterKeyHint="next" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Mot de passe" required type="password" value={form.password} onChange={set("password")} error={e("password")} leftIcon={<Lock size={17} />} autoComplete="new-password" />
                <Input label="Confirmation" required type="password" value={form.passwordConfirm} onChange={set("passwordConfirm")} error={e("passwordConfirm")} leftIcon={<Lock size={17} />} autoComplete="new-password" enterKeyHint="next" />
              </div>
              <Input label="Code revendeur (optionnel)" value={form.codeRevendeur} onChange={set("codeRevendeur")} error={e("codeRevendeur", "referralCode")} inputMode="numeric" pattern="[0-9]*" maxLength={4} enterKeyHint="go" placeholder="Ex. 4821" leftIcon={<UserTick size={17} />} hint="Si un revendeur vous a invité, saisissez son code." />
              <div>
                <Checkbox checked={terms} onChange={(ev) => { setTerms(ev.target.checked); setErrors((er) => ({ ...er, terms: undefined })); }} label={<>J&apos;accepte les <Link href={ROUTES.guide} className="font-semibold text-ink underline">conditions d&apos;utilisation</Link> et la politique de confidentialité.</>} />
                {errors.terms && <p role="alert" className="mt-1 text-[12px] text-danger">{errors.terms}</p>}
              </div>
              {general && <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger">{general}</p>}
              <Button type="submit" size="lg" fullWidth loading={register.isPending}>Créer mon compte</Button>
            </form>
            <GoogleButton next={next} label="S'inscrire avec Google" />
          </>
        )}
      </AuthLayoutCard>
    </>
  );
}
