"use client";

import { AnimatePresence, motion } from "motion/react";
import { Call, Location, Sms, TickCircle, User } from "iconsax-reactjs";
import { useState, type FormEvent } from "react";
import { ROUTES } from "@/config/routes";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { formatDateTime } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { Input, Textarea } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { displayName } from "@/modules/auth/types";
import { useSubmitResellerApplication } from "../hooks/useResellerApplication";
import type { ResellerApplicationInput } from "../types";

type Errors = Partial<Record<keyof ResellerApplicationInput, string>>;

export function ApplicationForm() {
  const { user } = useAuth();
  const submit = useSubmitResellerApplication();
  const [form, setForm] = useState<ResellerApplicationInput>({ fullName: "", phone: "", email: "", city: "Kinshasa", motivation: "", referralCode: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [prefilled, setPrefilled] = useState(false);

  // Préremplissage si connecté (une seule fois)
  if (user && !prefilled) {
    setPrefilled(true);
    setForm((f) => ({ ...f, fullName: displayName(user), email: user.email, phone: user.phoneNumber ?? "" }));
  }

  const set = <K extends keyof ResellerApplicationInput>(k: K, v: ResellerApplicationInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const er: Errors = {};
    if (form.fullName.trim().length < 3) er.fullName = "Entrez votre nom complet.";
    if (!/^[+\d][\d\s().-]{7,}$/.test(form.phone.trim())) er.phone = "Numéro de téléphone invalide.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = "Adresse e-mail invalide.";
    if (!form.city.trim()) er.city = "Indiquez votre ville.";
    if (form.motivation.trim().length < 20) er.motivation = "Décrivez votre projet en quelques phrases (20 caractères minimum).";
    if (form.referralCode && !/^\d{4}$/.test(form.referralCode)) er.referralCode = "Le code parrain comporte 4 chiffres.";
    setErrors(er);
    if (Object.keys(er).length) return;
    submit.mutate(form, {
      onError: (err) => {
        if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
          setErrors(Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])) as Errors);
        } else toast.error("Envoi impossible", getErrorMessage(err));
      },
    });
  };

  return (
    <AnimatePresence mode="wait">
      {submit.data ? (
        <motion.div key="ok" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6 text-center sm:py-10">
          <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 12 }} className="grid size-20 place-items-center rounded-full bg-primary text-white"><TickCircle size={42} variant="Bold" /></motion.span>
          <h3 className="mt-5 text-[22px]">Candidature envoyée !</h3>
          <p className="mt-2 max-w-[380px] text-[14px] leading-[22px] text-ink-2">Un responsable étudie votre dossier et vous contacte sous 48 h au <strong className="text-ink">{form.phone}</strong>.</p>
          <dl className="mt-6 w-full max-w-[360px] divide-y divide-line-3 rounded-box bg-page/60 text-left text-[13px]">
            <div className="flex justify-between px-4 py-3"><dt className="text-ink-3">Référence</dt><dd className="font-bold tracking-wide text-primary">{submit.data.reference}</dd></div>
            <div className="flex justify-between px-4 py-3"><dt className="text-ink-3">Reçue le</dt><dd className="font-semibold">{formatDateTime(submit.data.submittedAt)}</dd></div>
          </dl>
          <Button href={ROUTES.home} variant="chip" className="mt-6" upper={false}>Retour à l&apos;accueil</Button>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={onSubmit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 sm:grid-cols-2">
          <Input label="Nom complet" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} error={errors.fullName} leftIcon={<User size={17} />} autoComplete="name" />
          <Input label="Téléphone" required value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} leftIcon={<Call size={17} />} placeholder="+243 …" autoComplete="tel" inputMode="tel" enterKeyHint="next" />
          <Input label="E-mail" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} leftIcon={<Sms size={17} />} autoComplete="email" inputMode="email" autoCapitalize="none" enterKeyHint="next" />
          <Input label="Ville" required value={form.city} onChange={(e) => set("city", e.target.value)} error={errors.city} leftIcon={<Location size={17} />} />
          <Textarea label="Parlez-nous de votre projet" required value={form.motivation} onChange={(e) => set("motivation", e.target.value)} error={errors.motivation} placeholder="Votre expérience de la vente, votre réseau, vos objectifs…" wrapperClassName="sm:col-span-2" rows={5} maxLength={1000} />
          <Input label="Code d'un revendeur parrain (optionnel)" value={form.referralCode ?? ""} onChange={(e) => set("referralCode", e.target.value)} error={errors.referralCode} placeholder="4 chiffres" inputMode="numeric" pattern="[0-9]*" maxLength={4} wrapperClassName="sm:col-span-2" />
          <div className="sticky bottom-[calc(var(--tabbar-h)+8px)] z-10 -mx-4 bg-white/90 px-4 py-2 backdrop-blur-md sm:static sm:col-span-2 sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <Button type="submit" size="lg" loading={submit.isPending} fullWidth>Envoyer ma candidature</Button>
          </div>
          <p className="text-[12px] text-ink-3 sm:col-span-2">Gratuit et sans engagement. Vos informations ne sont utilisées que pour traiter votre candidature.</p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
