"use client";

import { CloseCircle, SmsNotification, TickCircle } from "iconsax-reactjs";
import { useSearchParams } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { getErrorMessage } from "@/shared/lib/api";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useNewsletterUnsubscribe } from "../hooks/useNewsletter";

/** Lien de désinscription envoyé par e-mail : `/newsletter/desinscription?token=…` (confirmation explicite). */
export function UnsubscribeView() {
  const token = useSearchParams().get("token") ?? "";
  const unsubscribe = useNewsletterUnsubscribe();

  return (
    <>
      <Breadcrumb items={[{ label: "Newsletter" }]} />
      <Block className="mx-auto w-full max-w-[560px]">
        {!token ? (
          <EmptyState icon={<CloseCircle size={40} variant="Bulk" />} title="Lien incomplet" description="Utilisez le lien de désinscription présent dans nos e-mails." action={<Button href={ROUTES.home}>Retour à l&apos;accueil</Button>} />
        ) : unsubscribe.isSuccess ? (
          <EmptyState icon={<TickCircle size={40} variant="Bulk" />} title="Vous êtes désinscrit(e)" description="Vous ne recevrez plus notre newsletter. Vous pouvez vous réabonner à tout moment depuis le bas de page." action={<Button href={ROUTES.home}>Retour à la boutique</Button>} />
        ) : (
          <EmptyState
            icon={<SmsNotification size={40} variant="Bulk" />}
            title="Se désabonner de la newsletter ?"
            description={unsubscribe.isError ? getErrorMessage(unsubscribe.error, "Ce lien n'est plus valable.") : "Vous ne recevrez plus nos offres et nouveautés par e-mail."}
            action={
              <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                <Button loading={unsubscribe.isPending} onClick={() => unsubscribe.mutate(token)}>Me désabonner</Button>
                <Button href={ROUTES.home} variant="chip" upper={false}>Rester abonné(e)</Button>
              </div>
            }
          />
        )}
      </Block>
    </>
  );
}
