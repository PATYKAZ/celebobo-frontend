"use client";

import { CloseCircle, TickCircle } from "iconsax-reactjs";
import { useEffect, useRef } from "react";
import { ROUTES } from "@/config/routes";
import { getErrorMessage } from "@/shared/lib/api";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Spinner } from "@/shared/ui/Spinner";
import { useVerifyEmail } from "../hooks/useAuth";

/** Lien reçu par e-mail : `/verifier-email/{key}`. */
export function VerifyEmailView({ verificationKey }: { verificationKey: string }) {
  const verify = useVerifyEmail();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    verify.mutate(verificationKey);
  }, [verify, verificationKey]);

  return (
    <Block className="mx-auto max-w-[560px]">
      {verify.isSuccess ? (
        <EmptyState
          icon={<TickCircle size={40} variant="Bulk" />}
          title="Adresse e-mail confirmée"
          description="Votre compte est activé. Vous pouvez maintenant vous connecter."
          action={<Button href={ROUTES.login()}>Se connecter</Button>}
        />
      ) : verify.isError ? (
        <EmptyState
          icon={<CloseCircle size={40} variant="Bulk" />}
          title="Lien invalide ou expiré"
          description={getErrorMessage(verify.error, "Ce lien de confirmation n'est plus valable.")}
          action={<Button href={ROUTES.login()}>Retour à la connexion</Button>}
        />
      ) : (
        <div className="grid min-h-[260px] place-items-center gap-3 text-center">
          <Spinner size={28} />
          <p className="text-[14px] text-ink-2">Confirmation de votre adresse e-mail…</p>
        </div>
      )}
    </Block>
  );
}
