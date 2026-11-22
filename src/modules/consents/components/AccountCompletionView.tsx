"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Call, Logout, ShieldTick, Trash } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { getErrorMessage } from "@/shared/lib/api";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Checkbox, Input } from "@/shared/ui/Form";
import { PHONE_HINT, PHONE_PLACEHOLDER, phoneError } from "@/shared/lib/phone";
import { fieldError } from "@/modules/auth/components/fieldErrors";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { ConfirmDialog } from "@/modules/admin/ui/ConfirmDialog";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useAuth, useLogout } from "@/modules/auth/hooks/useAuth";
import { useDeleteAccount, useUpdatePhone } from "@/modules/account/hooks/useAccount";
import { useConsents, useGiveConsents } from "../hooks/useConsents";
import type { ConsentKind } from "../types";
import { ConsentLabel } from "./ConsentLabel";

/** `next` n'est accepté que s'il s'agit d'un chemin interne (anti open-redirect). */
const safe = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith(ROUTES.completeAccount()) ? n : null);

function Content() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safe(params.get("next")) ?? ROUTES.home;
  const { data: overview, isLoading } = useConsents();
  const give = useGiveConsents();
  const updatePhone = useUpdatePhone();
  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState<string>();
  const logout = useLogout();
  const remove = useDeleteAccount();
  const [checked, setChecked] = useState<Partial<Record<ConsentKind, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<ConsentKind, string>>>({});
  const [closing, setClosing] = useState(false);

  if (!user) return null;
  const missing = overview?.missing ?? user.missingConsents ?? [];
  // Google ne donne pas de numéro ; numéro invalide ou en double effacé lors de la normalisation
  const needsPhone = !!user.phoneRequired;
  const marketingGiven = overview?.consents.find((c) => c.kind === "marketing")?.given ?? true;
  const outdated = overview?.consents.some((c) => c.required && c.outdated);
  const version = overview?.consents.find((c) => c.kind === "terms")?.currentVersion;

  const toggle = (kind: ConsentKind) => (ev: { target: { checked: boolean } }) => {
    setChecked((c) => ({ ...c, [kind]: ev.target.checked }));
    setErrors((er) => ({ ...er, [kind]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    for (const kind of missing) if (!checked[kind]) err[kind] = "Cette case est obligatoire pour utiliser votre compte.";
    const badPhone = needsPhone ? phoneError(phone) : undefined;
    setErrors(err);
    setPhoneErr(badPhone);
    if (Object.keys(err).length || badPhone) return;
    const kinds = [...missing, ...(checked.marketing && !marketingGiven ? (["marketing"] as const) : [])];
    try {
      // le numéro d'abord : déjà utilisé par un autre compte, il reste à corriger sans perdre les cases
      if (needsPhone) await updatePhone.mutateAsync(phone);
      const o = kinds.length ? await give.mutateAsync(kinds) : null;
      if (o?.missing.length) return;
      toast.success("Merci, votre compte est prêt");
      router.replace(next);
    } catch (er) {
      if (!fieldError(er, "phoneNumber")) toast.error("Enregistrement impossible", getErrorMessage(er));
    }
  };

  return (
    <Block className="mx-auto max-w-[640px]">
      <h1 className="flex items-center gap-2 text-[22px] leading-[28px] text-primary sm:text-h-page">
        <ShieldTick size={24} variant="Bold" /> Avant de continuer
      </h1>
      <p className="mb-5 mt-2 text-[14px] leading-[21px] text-ink-2">
        {outdated
          ? `Notre politique de confidentialité a changé${version ? ` (version ${version})` : ""}. Pour continuer à utiliser votre compte, acceptez-la de nouveau.`
          : missing.length
            ? "Pour utiliser votre compte, nous avons besoin de votre accord. Nous conservons la date et la version que vous acceptez, comme preuve."
            : "Pour utiliser votre compte, indiquez votre numéro de téléphone : votre revendeur-livreur vous appelle pour la livraison."}
      </p>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          {needsPhone && (
            <Input
              label="Téléphone"
              required
              value={phone}
              onChange={(ev) => {
                setPhone(ev.target.value);
                setPhoneErr(undefined);
              }}
              error={phoneErr ?? fieldError(updatePhone.error, "phoneNumber")}
              leftIcon={<Call size={17} />}
              placeholder={PHONE_PLACEHOLDER}
              hint={`${PHONE_HINT} Un seul compte par numéro.`}
              autoComplete="tel"
              inputMode="tel"
            />
          )}
          <fieldset className="space-y-3">
            <legend className="sr-only">Consentements</legend>
            {missing.map((kind) => (
              <div key={kind}>
                <Checkbox checked={!!checked[kind]} onChange={toggle(kind)} label={<ConsentLabel kind={kind} />} />
                {errors[kind] && <p role="alert" className="mt-1 text-[12px] text-danger">{errors[kind]}</p>}
              </div>
            ))}
            {!marketingGiven && <Checkbox checked={!!checked.marketing} onChange={toggle("marketing")} label={<ConsentLabel kind="marketing" />} />}
          </fieldset>
          <Button type="submit" size="lg" fullWidth loading={give.isPending || updatePhone.isPending}>Continuer</Button>
        </form>
      )}
      <div className="mt-6 space-y-3 border-t border-line-3 pt-5 text-[13px] leading-[20px] text-ink-2">
        <p>Vous ne souhaitez pas continuer ? Sans ces informations, votre compte ne peut pas être utilisé.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="ghost" upper={false} leftIcon={<Logout size={15} />} loading={logout.isPending} onClick={() => logout.mutate()}>Se déconnecter</Button>
          {user.role === "client" ? (
            <Button variant="ghost" upper={false} leftIcon={<Trash size={15} />} className="text-danger hover:bg-danger-100!" onClick={() => setClosing(true)}>Fermer mon compte</Button>
          ) : (
            <p className="self-center">Pour fermer votre compte revendeur, contactez un administrateur.</p>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={closing}
        onClose={() => setClosing(false)}
        title="Fermer votre compte ?"
        message="Votre compte sera anonymisé et vous serez déconnecté. Les factures restent conservées comme la loi l'exige. Cette action est irréversible."
        confirmLabel="Fermer définitivement"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(undefined, { onSuccess: () => toast.success("Compte fermé"), onError: (e) => toast.error("Fermeture impossible", getErrorMessage(e)) })}
      />
    </Block>
  );
}

/** Étape de complétion : consentements obligatoires manquants (compte existant, Google, nouvelle version). */
export function AccountCompletionView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Mon compte" }, { label: "Finaliser mon compte" }]} />
      <AuthGuard>
        <Content />
      </AuthGuard>
    </>
  );
}
