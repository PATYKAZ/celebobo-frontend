"use client";

import Link from "next/link";
import { useState } from "react";
import { Call, Crown1, TickCircle, Truck, Whatsapp } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { useFormatPrice } from "@/shared/currency/CurrencyProvider";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { AccountSkeleton } from "@/shared/ui/PageSkeletons";
import { toast } from "@/shared/ui/Toast";
import { ConfirmDialog } from "@/modules/admin/ui/ConfirmDialog";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useAuth, useResendVerification } from "@/modules/auth/hooks/useAuth";
import { useShippingZones } from "@/modules/checkout/hooks/useCheckout";
import { paymentMethod, useSiteSettings } from "@/modules/site";
import { useCancelMembershipRequest, useMyMembership, useRequestMembership, useStartTrial } from "../hooks/useMembership";
import { MEMBERSHIP_PAYMENT_METHODS, PLAN_LABEL, type MembershipRequest, type MyMembership, type PaidPlan, type TrialRefusal } from "../types";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
const list = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} et ${names.at(-1)}` : names[0]);

/** Message et action pour chaque refus de l'essai (`trial_unavailable`, meta.reason). */
const REFUSAL: Record<TrialRefusal, string> = {
  email_unverified: "Confirmez d’abord votre adresse e-mail : l’essai est réservé aux comptes vérifiés.",
  phone_missing: "Ajoutez votre numéro de téléphone à votre profil pour profiter de l’essai.",
  trial_used: "Vous avez déjà profité de l’essai gratuit. Choisissez une formule ci-dessous.",
  already_member: "Votre abonnement est déjà actif.",
  phone_used: "Ce numéro de téléphone a déjà servi pour un essai gratuit. Choisissez une formule ci-dessous.",
};

/** Zones où les membres sont livrés gratuitement (zones de livraison marquées dans l'admin). */
function useMemberZones() {
  const { data } = useShippingZones();
  return (data ?? []).filter((z) => z.memberFreeShipping).map((z) => z.name);
}

function Benefits() {
  const { membership } = useSiteSettings().programmes;
  const zones = useMemberZones();
  const items = [
    `Livraison offerte sans minimum d’achat${zones.length ? ` à ${list(zones)}` : " dans les zones membres"}.`,
    "Les commandes passées pendant l’abonnement gardent leur livraison offerte.",
    `Pas de renouvellement automatique${membership.reminderDays > 0 ? ` : un rappel ${membership.reminderDays} jour${membership.reminderDays > 1 ? "s" : ""} avant la fin` : ""}.`,
  ];
  return (
    <ul className="grid gap-2">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2 text-[14px] leading-[21px]">
          <TickCircle size={18} variant="Bold" className="mt-0.5 shrink-0 text-primary" /> {t}
        </li>
      ))}
    </ul>
  );
}

/** Statut : membre (essai ou payant) jusqu'à telle date, ou ancien membre. */
function StatusCard({ m }: { m: MyMembership }) {
  if (m.status === "none") return null;
  const member = m.status === "trial" || m.status === "active";
  const left = m.endsAt ? daysLeft(m.endsAt) : 0;
  return (
    <div className={cn("relative overflow-hidden rounded-box p-5 text-white sm:p-6", member ? "bg-linear-to-br from-primary-dark to-primary" : "bg-ink-dark")}>
      <Crown1 size={90} variant="Bulk" className="absolute -right-4 -top-4 text-white/10" aria-hidden />
      <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-white/75">Celebobo Plus</p>
      <p className="mt-1 text-[22px] font-bold leading-[28px]">
        {member ? (m.status === "trial" ? "Essai gratuit en cours" : `Membre Plus · ${PLAN_LABEL[m.plan ?? "monthly"].toLowerCase()}`) : "Abonnement terminé"}
      </p>
      {m.endsAt && (
        <p className="mt-1 text-[14px] text-white/85">
          {member ? (
            <>
              Jusqu’au <strong className="text-sun">{dateFmt.format(new Date(m.endsAt))}</strong> · {left} jour{left > 1 ? "s" : ""} restant{left > 1 ? "s" : ""}
            </>
          ) : (
            <>Terminé le {dateFmt.format(new Date(m.endsAt))}. La livraison suit de nouveau les frais de votre zone.</>
          )}
        </p>
      )}
    </div>
  );
}

/** Demande en attente : prix, moyen de paiement et marche à suivre jusqu'à la confirmation. */
function PendingCard({ request, member, onCancel }: { request: MembershipRequest; member: boolean; onCancel: () => void }) {
  const formatPrice = useFormatPrice();
  const { user } = useAuth();
  const site = useSiteSettings();
  const method = paymentMethod(request.paymentMethod).label;
  return (
    <div className="rounded-box border-2 border-sun bg-sun/15 p-4 sm:p-5">
      <p className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-sun px-2.5 py-0.5 text-[11px] font-bold uppercase text-on-light">En attente de confirmation</span>
        <span className="text-[13px] text-ink-2">Demande du {dateFmt.format(new Date(request.createdAt))}</span>
      </p>
      <p className="mt-2 text-[17px] font-bold">
        Formule {PLAN_LABEL[request.plan].toLowerCase()} · {formatPrice(request.price)} · {method}
      </p>
      <ol className="mt-3 grid gap-1.5 text-[14px] leading-[21px] text-ink-2">
        <li>
          1. Notre équipe vous contacte{user?.phoneNumber ? <> au <strong className="text-ink">{user.phoneNumber}</strong></> : ""} pour encaisser <strong className="text-ink">{formatPrice(request.price)}</strong>{" "}
          {request.paymentMethod === "cash" ? "en espèces" : `par ${method}`}.
        </li>
        <li>2. Dès le paiement reçu, elle confirme votre demande et vous recevez une notification.</li>
        <li>3. {member ? "La nouvelle période s’ajoute à la fin de l’abonnement en cours : aucun jour perdu." : "Votre abonnement démarre à la confirmation."}</li>
      </ol>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button size="sm" variant="outline" upper={false} href={site.whatsappUrl} leftIcon={<Whatsapp size={16} variant="Bold" />}>Écrire sur WhatsApp</Button>
        <Button size="sm" variant="chip" upper={false} href={site.hotlineHref} leftIcon={<Call size={16} variant="Bold" />}>{site.hotline}</Button>
        <Button size="sm" variant="chip" upper={false} onClick={onCancel} className="text-danger sm:ml-auto">Annuler la demande</Button>
      </div>
    </div>
  );
}

/** Choix de la formule et du moyen de paiement ; une demande à la fois, au prix du jour. */
function PlanPicker({ renew }: { renew: boolean }) {
  const formatPrice = useFormatPrice();
  const site = useSiteSettings();
  const { monthlyPrice, yearlyPrice } = site.programmes.membership;
  const methods = MEMBERSHIP_PAYMENT_METHODS.filter((c) => site.paymentMethods.includes(c));
  const [plan, setPlan] = useState<PaidPlan>("yearly");
  const [method, setMethod] = useState<string>(methods[0] ?? "cash");
  const request = useRequestMembership();
  const saving = monthlyPrice * 12 - yearlyPrice;
  const plans: { value: PaidPlan; price: number; per: string; note?: string }[] = [
    { value: "monthly", price: monthlyPrice, per: "par mois" },
    { value: "yearly", price: yearlyPrice, per: "par an", note: saving > 0 ? `${formatPrice(saving)} d’économie` : undefined },
  ];
  const submit = () =>
    request.mutate(
      { plan, paymentMethod: method },
      {
        onSuccess: () => toast.success("Demande envoyée", "Notre équipe vous contacte pour le paiement."),
        onError: (e) => toast.error("Demande impossible", getErrorMessage(e)),
      },
    );
  return (
    <div className="grid gap-4">
      <h2 className="text-[17px] leading-[22px]">{renew ? "Prolonger mon abonnement" : "Choisir une formule"}</h2>
      <div role="radiogroup" aria-label="Formule" className="grid gap-3 sm:grid-cols-2">
        {plans.map((p) => (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={plan === p.value}
            onClick={() => setPlan(p.value)}
            className={cn("relative rounded-box border-2 p-4 text-left transition-colors", plan === p.value ? "border-primary bg-primary-50" : "border-line-3 hover:border-primary/40")}
          >
            {p.note && <span className="absolute right-3 top-3 rounded-full bg-sun px-2 py-0.5 text-[10px] font-bold uppercase text-on-light">{p.note}</span>}
            <span className="block text-[13px] font-semibold text-ink-2">{PLAN_LABEL[p.value]}</span>
            <span className="mt-1 block text-[24px] font-extrabold leading-[30px] text-primary">{formatPrice(p.price)}</span>
            <span className="text-[12px] text-ink-3">{p.per}</span>
          </button>
        ))}
      </div>
      <div>
        <p className="mb-2 text-[13px] font-semibold">Paiement</p>
        <div role="radiogroup" aria-label="Moyen de paiement" className="flex flex-wrap gap-2">
          {methods.map((code) => (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={method === code}
              onClick={() => setMethod(code)}
              className={cn("min-h-11 rounded-pill border-2 px-4 text-[13px] font-semibold transition-colors", method === code ? "border-primary bg-primary text-white" : "border-line-3 hover:border-primary/40")}
            >
              {paymentMethod(code).label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] leading-[17px] text-ink-3">Pas de paiement en ligne : notre équipe vous contacte pour l’encaissement, puis confirme votre abonnement.</p>
      </div>
      <Button onClick={submit} loading={request.isPending} upper={false} className="sm:w-fit">
        Demander l’abonnement · {formatPrice(plan === "yearly" ? yearlyPrice : monthlyPrice)}
      </Button>
    </div>
  );
}

/** Essai gratuit : message et action précis quand il est refusé. */
function TrialCard() {
  const { trialDays } = useSiteSettings().programmes.membership;
  const { user } = useAuth();
  const trial = useStartTrial();
  const resend = useResendVerification();
  const [refusal, setRefusal] = useState<TrialRefusal | null>(null);
  const start = () =>
    trial.mutate(undefined, {
      onSuccess: () => toast.success("Essai gratuit activé", `Livraison offerte pendant ${trialDays} jours.`),
      onError: (e) => {
        const reason = e instanceof ApiError && e.code === "trial_unavailable" ? (e.meta.reason as TrialRefusal) : null;
        if (reason && reason in REFUSAL) setRefusal(reason);
        else toast.error("Essai impossible", getErrorMessage(e));
      },
    });
  return (
    <div className="rounded-box border border-primary/30 bg-primary-50 p-4 sm:p-5">
      <p className="text-[17px] font-bold">Essayez gratuitement pendant {trialDays} jours</p>
      <p className="mt-1 text-[13px] leading-[19px] text-ink-2">Sans engagement ni paiement. Une fois par compte et par numéro de téléphone.</p>
      {refusal ? (
        <div role="alert" className="mt-3 rounded-md bg-surface p-3 text-[14px] leading-[21px]">
          {REFUSAL[refusal]}
          {refusal === "email_unverified" && user?.email && (
            <Button size="sm" variant="chip" upper={false} className="mt-2 flex" loading={resend.isPending} onClick={() => resend.mutate(user.email, { onSuccess: () => toast.success("E-mail envoyé", `Ouvrez le lien reçu sur ${user.email}.`), onError: (e) => toast.error("Envoi impossible", getErrorMessage(e)) })}>
              Renvoyer l’e-mail de confirmation
            </Button>
          )}
          {refusal === "phone_missing" && (
            <Link href={ROUTES.profile} className="mt-2 block font-semibold text-primary hover:underline">Ajouter mon numéro</Link>
          )}
        </div>
      ) : (
        <Button onClick={start} loading={trial.isPending} upper={false} className="mt-3" leftIcon={<Crown1 size={16} variant="Bold" />}>
          Démarrer l’essai gratuit
        </Button>
      )}
    </div>
  );
}

function Content() {
  const site = useSiteSettings();
  const formatPrice = useFormatPrice();
  const { data: m, isLoading, isError, error, refetch } = useMyMembership();
  const cancel = useCancelMembershipRequest();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const open = site.programmes.membership.enabled;

  if (isLoading) return <AccountSkeleton breadcrumb={false} />;
  if (isError || !m)
    return (
      <Block className="text-center">
        <p className="text-[14px] text-ink-2">{getErrorMessage(error, "Impossible de charger votre abonnement.")}</p>
        <Button className="mt-4" variant="chip" upper={false} onClick={() => refetch()}>Réessayer</Button>
      </Block>
    );

  const member = m.status === "trial" || m.status === "active";
  // programme fermé : un membre garde son statut, les autres voient qu'il n'est pas proposé
  if (!open && !member && !m.pendingRequest)
    return (
      <Block>
        <EmptyState icon={<Crown1 size={44} variant="Bulk" />} title="Celebobo Plus n’est pas proposé pour le moment" description="Revenez bientôt : la livraison offerte sans minimum arrive pour les membres." action={<Button href={ROUTES.products} upper={false}>Voir les produits</Button>} />
      </Block>
    );

  return (
    <Block pad="none" className="grid gap-5 p-4 sm:gap-6 sm:p-[30px]">
      <div>
        <h1 className="flex items-center gap-2 text-[22px] leading-[28px] text-primary sm:text-h-page">
          <Crown1 size={26} variant="Bold" aria-hidden /> Celebobo Plus
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] leading-[19px] text-ink-2 sm:text-[14px]">
          <Truck size={16} aria-hidden /> La livraison offerte sans minimum, dès {formatPrice(site.programmes.membership.monthlyPrice)} par mois.
        </p>
      </div>
      <StatusCard m={m} />
      {m.pendingRequest ? (
        <PendingCard request={m.pendingRequest} member={member} onCancel={() => setConfirmCancel(true)} />
      ) : (
        open && (
          <>
            {!member && m.trialAvailable && site.programmes.membership.trialDays > 0 && <TrialCard />}
            <PlanPicker renew={member} />
          </>
        )
      )}
      <div className="border-t border-line-3 pt-5">
        <h2 className="mb-3 text-[17px] leading-[22px]">Ce que comprend Celebobo Plus</h2>
        <Benefits />
      </div>
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Annuler la demande ?"
        message="Vous pourrez en faire une nouvelle à tout moment."
        confirmLabel="Annuler la demande"
        tone="danger"
        loading={cancel.isPending}
        onConfirm={() =>
          m.pendingRequest &&
          cancel.mutate(m.pendingRequest.id, {
            onSuccess: () => {
              toast.info("Demande annulée");
              setConfirmCancel(false);
            },
            onError: (e) => toast.error("Annulation impossible", getErrorMessage(e)),
          })
        }
      />
    </Block>
  );
}

/** Espace client : Celebobo Plus (statut, essai, formules, demande en attente). */
export function MembershipView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Mon compte", href: ROUTES.profile }, { label: "Abonnement Plus" }]} />
      <AuthGuard fallback={<AccountSkeleton breadcrumb={false} />}>
        <Content />
      </AuthGuard>
    </>
  );
}
